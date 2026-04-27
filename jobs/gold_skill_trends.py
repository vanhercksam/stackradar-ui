from pyspark.sql.functions import col, count, explode

spark.sql("CREATE SCHEMA IF NOT EXISTS dbw_stackradar_prod.gold")

gold = (
    spark.table("dbw_stackradar_prod.silver.jobs")
    .select(col("id"), explode(col("tech_stacks")).alias("skill"))
    .filter(col("skill").isNotNull() & (col("skill") != ""))
    .groupBy("skill")
    .agg(count("*").alias("job_count"))
    .orderBy(col("job_count").desc())
)

gold.write.format("delta").mode("overwrite").option("overwriteSchema", "true").saveAsTable("dbw_stackradar_prod.gold.skill_trends")