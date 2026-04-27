export type Stage = "idle" | "starting" | "apify" | "databricks" | "done" | "error" | "rate_limited";
export type StepState = "done" | "active" | "pending";

export const PIPELINE_STEPS = [
  { key: "apify",      label: "Scraping LinkedIn & Indeed",      desc: "Apify fetches job listings via headless browser" },
  { key: "adls",       label: "Writing to Azure Data Lake Gen2", desc: "Raw JSON stored in ADLS Gen2" },
  { key: "databricks", label: "Databricks PySpark pipeline",     desc: "Stack extraction, deduplication & ranking" },
  { key: "done",       label: "Stack rankings ready",            desc: "Most-demanded stacks ranked by mention frequency" },
] as const;

export function resolveStepState(stepKey: string, stage: Stage): StepState {
  if (stage === "done") return "done";
  if (stage === "databricks") {
    if (stepKey === "apify" || stepKey === "adls") return "done";
    if (stepKey === "databricks") return "active";
    return "pending";
  }
  if (stage === "apify" && stepKey === "apify") return "active";
  return "pending";
}
