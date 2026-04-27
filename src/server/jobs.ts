import { createServerFn } from "@tanstack/solid-start";
import { ApifyClient } from "apify-client";
import { BlobServiceClient } from "@azure/storage-blob";

let lastCallTime = 0;
const RATE_LIMIT_MS = 5 * 60 * 1000;

export interface StackResult {
  stack: string;
  count: number;
  percentage: number; 
}

export interface PipelineInput {
  jobTitle: string;
  countryKey: string;
  countryName: string;
  geoId: string;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Environment variable ${name} is not set in .env`);
  return val;
}

export const startPipeline = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as PipelineInput)
  .handler(async ({ data }) => {
    requireEnv("APIFY_TOKEN");

    const now = Date.now();
    const remaining = RATE_LIMIT_MS - (now - lastCallTime);
    if (remaining > 0) {
      throw new Error(`RATE_LIMITED:${Math.ceil(remaining / 1000)}`);
    }
    lastCallTime = now;

    const apify = new ApifyClient({ token: process.env["APIFY_TOKEN"] });

    const linkedinUrl =
      `https://www.linkedin.com/jobs/search` +
      `?keywords=${encodeURIComponent(data.jobTitle)}` +
      `&location=${encodeURIComponent(data.countryName)}` +
      `&geoId=${data.geoId}` +
      `&f_TPR=&f_WT=3%2C1&position=1&pageNum=0`;

    const [r1, r2] = await Promise.all([
      apify.actor("hKByXkMQaC5Qt9UMN").start({
        urls: [linkedinUrl],
        scrapeCompany: false,
        count: 20,
        splitByLocation: false,
      }),
      apify.actor(requireEnv("INDEED_ACTOR_ID")).start({
        title: data.jobTitle,
        country:
          ({ gb: "uk" } as Record<string, string>)[data.countryKey] ??
          data.countryKey,
        location: data.countryName,
        limit: 20,
      }),
    ]);

    return { apifyRunIds: [r1.id, r2.id] as [string, string] };
  });

export const checkApifyRuns = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => d as { runId1: string; runId2: string })
  .handler(
    async ({
      data: { runId1, runId2 },
    }): Promise<
      | { done: false; error: string | null }
      | { done: true; error: null; databricksRunId: number; itemCount: number }
    > => {
      const apify = new ApifyClient({ token: requireEnv("APIFY_TOKEN") });

      const [run1, run2] = await Promise.all([
        apify.run(runId1).get(),
        apify.run(runId2).get(),
      ]);

      const s1 = run1?.status ?? "UNKNOWN";
      const s2 = run2?.status ?? "UNKNOWN";
      const terminalFail = ["FAILED", "ABORTED", "TIMED-OUT"];

      if (terminalFail.includes(s1) || terminalFail.includes(s2)) {
        return { done: false, error: `Apify run failed (${s1} / ${s2})` };
      }
      if (s1 !== "SUCCEEDED" || s2 !== "SUCCEEDED") {
        return { done: false, error: null };
      }

      const [{ items: liItems }, { items: indeedItems }] = await Promise.all([
        apify.dataset(run1!.defaultDatasetId).listItems(),
        apify.dataset(run2!.defaultDatasetId).listItems(),
      ]);

      const allItems = [
        ...liItems.map((i) => ({ ...(i as object), source: "linkedin" })),
        ...indeedItems.map((i) => ({ ...(i as object), source: "indeed" })),
      ];

      const connStr = requireEnv("AZURE_STORAGE_CONNECTION_STRING");
      const containerName = process.env["AZURE_CONTAINER_NAME"] ?? "stackradar";
      const blobName = `raw/jobs_latest.json`;
      const content = JSON.stringify(allItems);
      const container = BlobServiceClient.fromConnectionString(connStr).getContainerClient(containerName);
      await container
        .getBlockBlobClient(blobName)
        .upload(content, Buffer.byteLength(content), {
          blobHTTPHeaders: { blobContentType: "application/json" },
        });

      const dbHost = requireEnv("DATABRICKS_HOST");
      const dbToken = requireEnv("DATABRICKS_TOKEN");
      const dbJobId = parseInt(requireEnv("DATABRICKS_JOB_ID"));
      const dbRes = await fetch(`${dbHost}/api/2.1/jobs/run-now`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dbToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: dbJobId,
          job_parameters: {
            blob_path: blobName,
            item_count: String(allItems.length),
          },
        }),
      });
      if (!dbRes.ok) {
        const body = await dbRes.text();
        return { done: false, error: `Databricks trigger failed: ${body}` };
      }
      const { run_id } = (await dbRes.json()) as { run_id: number };

      return { done: true, error: null, databricksRunId: run_id, itemCount: allItems.length };
    },
  );

async function pollDatabricksRun(
  dbHost: string,
  dbToken: string,
  runId: number,
): Promise<{ success: boolean; resultState: string }> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${dbHost}/api/2.1/jobs/runs/get?run_id=${runId}`, {
      headers: { Authorization: `Bearer ${dbToken}` },
    });
    const body = (await res.json()) as { state?: { life_cycle_state: string; result_state?: string } } | null;
    const lc = body?.state?.life_cycle_state;
    if (!lc) return { success: false, resultState: `unexpected response: ${JSON.stringify(body)}` };
    if (lc === "TERMINATED")
      return {
        success: body!.state!.result_state === "SUCCESS",
        resultState: body!.state!.result_state ?? "UNKNOWN",
      };
    if (lc === "INTERNAL_ERROR" || lc === "SKIPPED")
      return { success: false, resultState: lc };
    await new Promise<void>((r) => setTimeout(r, 10_000));
  }
  return { success: false, resultState: "TIMEOUT" };
}

export const runDatabricksQuery = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => d as { runId: number })
  .handler(
    async ({
      data: { runId },
    }): Promise<
      | { done: false; error: string }
      | { done: true; error: null; items: StackResult[] }
    > => {
      const dbHost = requireEnv("DATABRICKS_HOST");
      const dbToken = requireEnv("DATABRICKS_TOKEN");

      const { success, resultState } = await pollDatabricksRun(dbHost, dbToken, runId);
      if (!success) return { done: false, error: `Databricks job failed: ${resultState}` };

      const warehouseId = requireEnv("DATABRICKS_WAREHOUSE_ID");
      const sqlRes = await fetch(`${dbHost}/api/2.0/sql/statements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${dbToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          statement: "SELECT skill, job_count FROM dbw_stackradar_prod.gold.skill_trends ORDER BY job_count DESC",
          wait_timeout: "50s",
        }),
      });
      const sqlBody = await sqlRes.json() as {
        status?: { state: string; error?: { message: string } };
        result?: { data_array?: [string, string][] };
        message?: string;
      };
      if (sqlBody.status?.state !== "SUCCEEDED") {
        const reason = sqlBody.status?.error?.message ?? sqlBody.status?.state ?? sqlBody.message ?? JSON.stringify(sqlBody);
        return { done: false, error: `SQL query failed: ${reason}` };
      }

      const rows = sqlBody.result?.data_array ?? [];
      const total = rows.reduce((s, r) => s + parseInt(r[1] ?? "0"), 0) || 1;
      const items: StackResult[] = rows.map((r) => ({
        stack: r[0],
        count: parseInt(r[1] ?? "0"),
        percentage: Math.round((parseInt(r[1] ?? "0") / total) * 1000) / 10,
      }));

      return { done: true, error: null, items };
    },
  );
