from pyspark.sql.functions import col, when, lit, to_timestamp, expr, lower, trim, array_distinct, transform, get_json_object, coalesce, concat, row_number
from pyspark.sql.window import Window

spark.sql("CREATE SCHEMA IF NOT EXISTS dbw_stackradar_prod.silver")

raw = spark.table("dbw_stackradar_prod.bronze.jobs")

linkedin = (
    raw.filter(col("source") == "linkedin")
    .select(
        col("id"),
        col("title"),
        col("companyName").alias("company"),
        col("location"),
        col("descriptionText").alias("description"),
        to_timestamp(col("postedAt")).alias("posted_at"),
        col("seniorityLevel").alias("seniority_level"),
        col("employmentType").alias("employment_type"),
        col("link").alias("url"),
        lit("linkedin").alias("source"),
    )
)

indeed = (
    raw.filter(col("source") == "indeed")
    .select(
        col("key").alias("id"),
        col("title"),
        col("employer.name").alias("company"),
        when(
            get_json_object(col("location"), "$.city").isNotNull() & (get_json_object(col("location"), "$.city") != ""),
            concat(get_json_object(col("location"), "$.city"), lit(", "), get_json_object(col("location"), "$.countryName")),
        ).otherwise(
            coalesce(get_json_object(col("location"), "$.countryName"), col("location"))
        ).alias("location"),
        col("description.text").alias("description"),
        to_timestamp(col("datePublished")).alias("posted_at"),
        lit(None).cast("string").alias("seniority_level"),
        lit(None).cast("string").alias("employment_type"),
        col("jobUrl").alias("url"),
        lit("indeed").alias("source"),
    )
)

dedup_window = Window.partitionBy("title", "company", "location").orderBy(col("posted_at").desc())

silver = (
    linkedin.unionByName(indeed)
    .filter(col("title").isNotNull())
    .filter(trim(col("description")).isNotNull() & (trim(col("description")) != ""))
    .withColumn("_rank", row_number().over(dedup_window))
    .filter(col("_rank") == 1)
    .drop("_rank")
)

silver = silver.withColumn(
    "tech_stacks_raw",
    expr("""
        ai_extract(
            description,
            '{
                "tech_stacks": {
                    "type": "array",
                    "description": "List of major technology stacks, frameworks, platforms and tools mentioned",
                    "items": {
                        "type": "string",
                        "description": "Well-known technology name (e.g., .NET, Azure, Databricks, Python, AWS, Kubernetes)"
                    }
                }
            }',
            map('instructions', 'Extract only well-known, major technology stacks, platforms, cloud services, and frameworks. Include: programming languages (Python, Java, C#, .NET), cloud platforms (Azure, AWS, GCP), data platforms (Databricks, Snowflake, Spark), databases (SQL Server, PostgreSQL, MongoDB), container technologies (Docker, Kubernetes), storage services (ADLS, Azure Blob Storage, S3). Exclude: soft skills, certifications, job requirements that are not technologies, small libraries or minor tools.')
        )
    """)
)

silver = (
    silver
    .withColumn(
        "tech_stacks",
        transform(expr("CAST(tech_stacks_raw:response.tech_stacks AS ARRAY<STRING>)"), lambda x: trim(lower(x)))
    )
    .withColumn("tech_stacks", array_distinct(col("tech_stacks")))
    .withColumn("extraction_error", expr("tech_stacks_raw:error_message::STRING"))
    .drop("tech_stacks_raw")
)

silver.write.format("delta").mode("overwrite").option("overwriteSchema", "true").saveAsTable("dbw_stackradar_prod.silver.jobs")