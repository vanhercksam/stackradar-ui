import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onCleanup, Show } from "solid-js";
import { checkApifyRuns, runDatabricksQuery, startPipeline } from "../server/jobs";
import type { StackResult, PipelineInput } from "../server/jobs";
import { COUNTRIES, JOB_TITLE_OPTIONS } from "../lib/options";
import type { Stage } from "../lib/pipeline";
import { HeroBanner } from "../components/HeroBanner";
import { SearchForm } from "../components/SearchForm";
import { PipelineCard } from "../components/PipelineCard";
import { RateLimitNotice } from "../components/RateLimitNotice";
import { ErrorNotice } from "../components/ErrorNotice";
import { StackResults } from "../components/StackResults";

export const Route = createFileRoute("/")({ component: JobsPage });

function JobsPage() {
  const [selectedTitle, setSelectedTitle] = createSignal(JOB_TITLE_OPTIONS[0].value);
  const [selectedCountryKey, setSelectedCountryKey] = createSignal("be");
  const [stage, setStage] = createSignal<Stage>("idle");
  const [apifyRunIds, setApifyRunIds] = createSignal<[string, string] | null>(null);
  const [stacks, setStacks] = createSignal<StackResult[]>([]);
  const [errorMessage, setErrorMessage] = createSignal("");
  const [rateLimitSecs, setRateLimitSecs] = createSignal(0);
  const [searchSnapshot, setSearchSnapshot] = createSignal<{ jobTitle: string; countryName: string } | null>(null);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollInProgress = false;

  const selectedCountryName = () => COUNTRIES.find((c) => c.key === selectedCountryKey())?.name ?? "";

  const stopPolling = () => {
    if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null; }
  };
  onCleanup(stopPolling);

  const pollPipeline = async () => {
    if (pollInProgress) return;
    pollInProgress = true;
    const runIds = apifyRunIds();
    try {
      if (stage() === "apify" && runIds) {
        const apifyResult = await checkApifyRuns({ data: { runId1: runIds[0], runId2: runIds[1] } });
        if (apifyResult.error) { setErrorMessage(apifyResult.error); setStage("error"); stopPolling(); return; }
        if (!apifyResult.done) return;

        setStage("databricks");
        const dbResult = await runDatabricksQuery({ data: { runId: apifyResult.databricksRunId } });
        if (dbResult.error) { setErrorMessage(dbResult.error); setStage("error"); stopPolling(); return; }
        if (dbResult.done) { setStacks(dbResult.items); setStage("done"); stopPolling(); }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Poll error");
      setStage("error");
      stopPolling();
    } finally {
      pollInProgress = false;
    }
  };

  const runAnalysis = async () => {
    if (stage() === "starting" || stage() === "apify" || stage() === "databricks") return;
    const country = COUNTRIES.find((c) => c.key === selectedCountryKey())!;
    const input: PipelineInput = {
      jobTitle: selectedTitle(),
      countryKey: country.key,
      countryName: country.name,
      geoId: country.geoId,
    };
    setStage("starting");
    setErrorMessage("");
    setStacks([]);
    setApifyRunIds(null);
    setSearchSnapshot({ jobTitle: input.jobTitle, countryName: input.countryName });
    stopPolling();
    try {
      const result = await startPipeline({ data: input });
      setApifyRunIds(result.apifyRunIds);
      setStage("apify");
      pollTimer = setInterval(pollPipeline, 15_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("RATE_LIMITED:")) {
        setRateLimitSecs(parseInt(msg.split(":")[1] ?? "300"));
        setStage("rate_limited");
      } else {
        setErrorMessage(msg);
        setStage("error");
      }
    }
  };

  const pipelineRunning = () => stage() === "starting" || stage() === "apify" || stage() === "databricks";

  return (
    <main class="flex flex-col gap-6 w-[min(1080px,calc(100%-2rem))] mx-auto px-4 pb-12 pt-14">
      <HeroBanner />
      <SearchForm
        title={selectedTitle()}
        countryKey={selectedCountryKey()}
        running={pipelineRunning()}
        onSelectTitle={setSelectedTitle}
        onSelectCountry={setSelectedCountryKey}
        onSubmit={runAnalysis}
      />
      <PipelineCard
        stage={stage()}
        jobTitle={selectedTitle()}
        countryName={selectedCountryName()}
      />
      <Show when={stage() === "rate_limited"}>
        <RateLimitNotice seconds={rateLimitSecs()} onDismiss={() => setStage("idle")} />
      </Show>
      <Show when={stage() === "error"}>
        <ErrorNotice message={errorMessage()} onRetry={() => { setStage("idle"); setErrorMessage(""); }} />
      </Show>
      <Show when={stage() === "done" && searchSnapshot() !== null}>
        <StackResults
          stacks={stacks()}
          jobTitle={searchSnapshot()!.jobTitle}
          countryName={searchSnapshot()!.countryName}
          onNewSearch={() => setStage("idle")}
        />
      </Show>
    </main>
  );
}
