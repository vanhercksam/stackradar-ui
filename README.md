# Stack Radar

> Discover the most in-demand tech stacks by scraping live job listings from LinkedIn and Indeed.

Stack Radar is an experimental personal project I built to learn **Databricks in a real, end-to-end context** — not through isolated tutorials, but by designing and wiring a complete workflow: scraping → cloud storage → medallion pipeline → AI extraction → presentation.

You pick a job title and country, click a button, and get a ranked breakdown of which technologies appear most in active job listings.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [SolidJS](https://www.solidjs.com/) + [TanStack Start](https://tanstack.com/start) |
| Styling | Tailwind CSS v4 |
| Scraping | [Apify](https://apify.com/) — LinkedIn Jobs Scraper + Indeed Scraper |
| Storage | Azure Data Lake Storage Gen2 (HNS enabled) |
| Pipeline | Azure Databricks — PySpark + Delta Lake |
| AI extraction | Databricks `ai_extract()` built-in AI function |
| Job orchestration | Databricks Jobs API (`/api/2.1/jobs/run-now`) |
| SQL query | Databricks SQL Statements API (`/api/2.0/sql/statements`) |

---

### Scraping — Apify

Two actors run in parallel: a LinkedIn Jobs Scraper and an Indeed Scraper. Both return a run ID immediately. The server polls every 15 s until both reach `SUCCEEDED`, then fetches and merges the datasets into one JSON array tagged by source.

---

### Storage — Azure ADLS Gen2

The merged JSON is uploaded as a single blob (`raw/jobs_latest.json`) to ADLS Gen2. HNS must be enabled on the storage account — this is what distinguishes it from regular Blob Storage. Each run overwrites the same file.

---

### Databricks — Medallion pipeline

Three notebooks wired as tasks in a single Databricks Job (bronze → silver → gold).

- **Bronze** — reads the raw JSON from ADLS directly into a Delta table, no transformation.

- **Silver** — normalizes the LinkedIn and Indeed schemas into a unified set of columns, deduplicates listings with a window function, then runs `ai_extract()` on each job description. `ai_extract()` is a Databricks built-in SQL function that calls an LLM to pull structured data from free text — in this case an array of tech stack names. Results are lowercased and deduplicated.

- **Gold** — explodes the tech stacks array so each skill is its own row, then counts occurrences per skill. Output: `skill` and `job_count`.

---

### Databricks Jobs API — trigger & poll

The job is triggered via `POST /api/2.1/jobs/run-now` with the blob path as a parameter. The server then polls `GET /api/2.1/jobs/runs/get?run_id=<id>` every 10 s (max 5 min) until `life_cycle_state` reaches `TERMINATED`.

---

### Databricks SQL Statements API — query gold table

Once the job succeeds, the gold table is queried over HTTP via `POST /api/2.0/sql/statements` — no JDBC driver needed. The response returns a `data_array` of `[skill, job_count]` rows, from which the server derives the percentage and returns the ranked list to the frontend.