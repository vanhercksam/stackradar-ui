ADLS_BASE = "abfss://stackradar@dlsstackradarprod.dfs.core.windows.net/"

dbutils.widgets.text("blob_path", f"{ADLS_BASE}raw/", "Blob path to raw JSON")
dbutils.widgets.text("item_count", "0", "Number of items scraped")

blob_path = dbutils.widgets.get("blob_path")
item_count = dbutils.widgets.get("item_count")

if not blob_path.startswith("abfss://"):
    blob_path = f"{ADLS_BASE}{blob_path.lstrip('/')}"

spark.sql("CREATE SCHEMA IF NOT EXISTS dbw_stackradar_prod.bronze")

df = (
    spark.read
    .option("multiline", "true")
    .json(blob_path)
)

df.write.format("delta").mode("overwrite").option("overwriteSchema", "true").saveAsTable("dbw_stackradar_prod.bronze.jobs")