import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onCleanup, Show, For } from "solid-js";
import { checkApifyRuns, runDatabricksQuery, startPipeline } from "../server/jobs";
import type { StackResult, PipelineInput } from "../server/jobs";

export const Route = createFileRoute("/")({ component: JobsPage });

const CARD = "bg-[linear-gradient(165deg,var(--surface-strong),var(--surface))] shadow-[0_1px_0_var(--inset-glint)_inset,0_22px_44px_rgba(30,90,72,0.1),0_6px_18px_rgba(23,58,64,0.08)]"
const KICKER = "tracking-[0.16em] uppercase font-bold text-[0.69rem] text-[var(--kicker)]"

// ─── Static data ─────────────────────────────────────────────────────────────

interface Option {
  value: string;
  label: string;
}

const JOB_TITLE_OPTIONS: Option[] = [
  "Data Engineer",
  "Data Scientist",
  "Data Analyst",
  "Analytics Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Business Intelligence Analyst",
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Platform Engineer",
  "Site Reliability Engineer",
  "Solutions Architect",
  "Cybersecurity Engineer",
  "Mobile Developer",
  "iOS Developer",
  "Android Developer",
  "Java Developer",
  "Python Developer",
  ".NET Developer",
  "Go Developer",
  "React Developer",
  "Node.js Developer",
  "Embedded Software Engineer",
  "QA Engineer",
  "Scrum Master",
  "Product Manager",
  "Product Owner",
  "UX Designer",
  "UI Designer",
].map((t) => ({ value: t, label: t }));

interface Country {
  key: string;
  name: string;
  geoId: string;
}

const COUNTRIES: Country[] = [
  // Europe — West
  { key: "be", name: "Belgium", geoId: "100565514" },
  { key: "nl", name: "Netherlands", geoId: "102890719" },
  { key: "de", name: "Germany", geoId: "101282230" },
  { key: "fr", name: "France", geoId: "105015875" },
  { key: "gb", name: "United Kingdom", geoId: "101165590" },
  { key: "lu", name: "Luxembourg", geoId: "100263768" },
  { key: "ch", name: "Switzerland", geoId: "106693272" },
  { key: "at", name: "Austria", geoId: "103883259" },
  { key: "ie", name: "Ireland", geoId: "104738515" },
  { key: "pt", name: "Portugal", geoId: "100364837" },
  // Europe — North
  { key: "dk", name: "Denmark", geoId: "104514075" },
  { key: "se", name: "Sweden", geoId: "105117694" },
  { key: "no", name: "Norway", geoId: "103819153" },
  { key: "fi", name: "Finland", geoId: "100456013" },
  // Europe — South
  { key: "es", name: "Spain", geoId: "105646813" },
  { key: "it", name: "Italy", geoId: "103350119" },
  { key: "gr", name: "Greece", geoId: "104677530" },
  // Europe — East
  { key: "pl", name: "Poland", geoId: "105072130" },
  { key: "cz", name: "Czech Republic", geoId: "104508036" },
  { key: "hu", name: "Hungary", geoId: "100288700" },
  { key: "ro", name: "Romania", geoId: "106670623" },
  { key: "ua", name: "Ukraine", geoId: "102264497" },
  // North America
  { key: "us", name: "United States", geoId: "103644278" },
  { key: "ca", name: "Canada", geoId: "101174742" },
];

const COUNTRY_OPTIONS: Option[] = COUNTRIES.map((c) => ({
  value: c.key,
  label: c.name,
}));

// ─── Generic searchable select ────────────────────────────────────────────────

function SearchableSelect(props: {
  label: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = createSignal("");
  const [open, setOpen] = createSignal(false);

  const selectedLabel = () =>
    props.options.find((o) => o.value === props.value)?.label ?? "";
  const filtered = () => {
    const q = query().toLowerCase();
    return q
      ? props.options.filter((o) => o.label.toLowerCase().includes(q))
      : props.options;
  };

  return (
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        {props.label}
      </label>
      <div class="relative">
        <input
          type="text"
          disabled={props.disabled}
          value={open() ? query() : selectedLabel()}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder={props.placeholder ?? "Search…"}
          class="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2.5 pr-8 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)] disabled:opacity-50"
        />
        <svg
          class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <Show when={open()}>
          <ul class="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-white shadow-xl">
            <For each={filtered()}>
              {(option) => (
                <li
                  class={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(79,184,178,0.1)] ${
                    option.value === props.value
                      ? "font-semibold text-[var(--lagoon-deep)]"
                      : "text-[var(--sea-ink)]"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    props.onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}

// ─── Pipeline helpers ─────────────────────────────────────────────────────────

type Stage =
  | "idle"
  | "starting"
  | "apify"
  | "databricks"
  | "done"
  | "error"
  | "rate_limited";

const PIPELINE_STEPS = [
  {
    key: "apify",
    label: "Scraping LinkedIn & Indeed",
    desc: "Apify fetches job listings via headless browser",
  },
  {
    key: "adls",
    label: "Writing to Azure Data Lake Gen2",
    desc: "Raw JSON stored in ADLS Gen2",
  },
  {
    key: "databricks",
    label: "Databricks PySpark pipeline",
    desc: "Stack extraction, deduplication & ranking",
  },
  {
    key: "done",
    label: "Stack rankings ready",
    desc: "Most-demanded stacks ranked by mention frequency",
  },
] as const;

function stepState(
  stepKey: string,
  stage: Stage,
): "done" | "active" | "pending" {
  if (stage === "done") return "done";
  if (stage === "databricks") {
    if (stepKey === "apify" || stepKey === "adls") return "done";
    if (stepKey === "databricks") return "active";
    return "pending";
  }
  if (stage === "apify" && stepKey === "apify") return "active";
  return "pending";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function JobsPage() {
  const [selectedTitle, setSelectedTitle] = createSignal<string>(
    JOB_TITLE_OPTIONS[0].value,
  );
  const [selectedCountryKey, setSelectedCountryKey] = createSignal("be");

  const [stage, setStage] = createSignal<Stage>("idle");
  const [activeSearch, setActiveSearch] = createSignal<Pick<
    PipelineInput,
    "jobTitle" | "countryName"
  > | null>(null);
  const [apifyRunIds, setApifyRunIds] = createSignal<[string, string] | null>(null);
  const [stacks, setStacks] = createSignal<StackResult[]>([]);
  const [error, setError] = createSignal("");
  const [rateLimitSecs, setRateLimitSecs] = createSignal(0);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollInProgress = false;

  const stopPoll = () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
  onCleanup(stopPoll);

  const poll = async () => {
    if (pollInProgress) return;
    pollInProgress = true;

    const runIds = apifyRunIds();

    try {
      if (stage() === "apify" && runIds) {
        const result = await checkApifyRuns({
          data: { runId1: runIds[0], runId2: runIds[1] },
        });
        if (result.error) {
          setError(result.error);
          setStage("error");
          stopPoll();
          return;
        }
        if (!result.done) return; // still scraping

        // Apify done — transition to databricks immediately
        const dbRunId = result.databricksRunId;
        setStage("databricks");

        const dbResult = await runDatabricksQuery({ data: { runId: dbRunId } });
        if (dbResult.error) {
          setError(dbResult.error);
          setStage("error");
          stopPoll();
          return;
        }
        if (dbResult.done) {
          setStacks(dbResult.items);
          setStage("done");
          stopPoll();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poll error");
      setStage("error");
      stopPoll();
    } finally {
      pollInProgress = false;
    }
  };

  const handleFetch = async () => {
    if (stage() === "starting" || stage() === "apify" || stage() === "databricks") return;

    const country = COUNTRIES.find((c) => c.key === selectedCountryKey())!;
    const input: PipelineInput = {
      jobTitle: selectedTitle(),
      countryKey: country.key,
      countryName: country.name,
      geoId: country.geoId,
    };

    setStage("starting");
    setError("");
    setStacks([]);
    setApifyRunIds(null);
    setActiveSearch({ jobTitle: input.jobTitle, countryName: input.countryName });
    stopPoll();

    try {
      const result = await startPipeline({ data: input });
      setApifyRunIds(result.apifyRunIds);
      setStage("apify");
      pollTimer = setInterval(poll, 15_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("RATE_LIMITED:")) {
        setRateLimitSecs(parseInt(msg.split(":")[1] ?? "300"));
        setStage("rate_limited");
      } else {
        setError(msg);
        setStage("error");
      }
    }
  };

  const isRunning = () =>
    stage() === "starting" || stage() === "apify" || stage() === "databricks";

  return (
    <main class="flex flex-col gap-6 w-[min(1080px,calc(100%-2rem))] mx-auto px-4 pb-12 pt-14">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section class={`flex flex-col items-start gap-4 ${CARD} animate-[rise-in_700ms_cubic-bezier(0.16,1,0.3,1)_both] relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12`}>
        <div class="pointer-events-none absolute -left-56 -top-56 h-96 aspect-square rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div class="pointer-events-none absolute -bottom-56 -right-56 h-96 aspect-square rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <h1 class="[font-family:'Fraunces',Georgia,serif] max-w-2xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Stack Radar
        </h1>

        <p class="m-0 max-w-2xl text-base text-[var(--sea-ink-soft)]">
          Discover the most in-demand tech stacks by scraping live job listings
          from <strong>LinkedIn</strong> and <strong>Indeed</strong>. A personal
          portfolio project powered by <strong>Apify</strong>,{" "}
          <strong>Azure ADLS Gen2</strong>, and <strong>Databricks</strong>.
        </p>

        <div class="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
          <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="m-0">
            <strong>Personal project</strong> not intended for heavy use. Limited to <strong>1 request per 5 minutes</strong>.
          </p>
        </div>
      </section>

      {/* ── Search form ──────────────────────────────────────────── */}
      <div class={`${CARD} relative rounded-2xl px-6 py-5 sm:px-8`}>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div class="sm:min-w-[220px]">
            <SearchableSelect
              label="Job title"
              options={JOB_TITLE_OPTIONS}
              value={selectedTitle()}
              onSelect={setSelectedTitle}
              disabled={isRunning()}
              placeholder="Search role…"
            />
          </div>
          <div class="sm:min-w-[220px]">
            <SearchableSelect
              label="Country"
              options={COUNTRY_OPTIONS}
              value={selectedCountryKey()}
              onSelect={setSelectedCountryKey}
              disabled={isRunning()}
              placeholder="Search country…"
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={isRunning()}
            class={`inline-flex items-center gap-2.5 rounded-full px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)] focus:ring-offset-2 sm:self-end cursor-pointer ${
              isRunning()
                ? "cursor-not-allowed bg-[var(--lagoon)] opacity-60"
                : "bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            }`}
          >
            <Show when={isRunning()}>
              <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </Show>
            <Show when={!isRunning()}>
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </Show>
            {isRunning() ? "Running…" : "Analyse stacks"}
          </button>
        </div>
      </div>

      {/* ── Pipeline progress ────────────────────────────────────── */}
      <section class={`${CARD} rounded-2xl p-6 sm:p-8`}>
        <div class="mb-5 flex items-start justify-between gap-4">
          <p class={KICKER}>Pipeline status</p>
          <p class="text-right text-xs text-[var(--sea-ink-soft)]">
            <span class="font-semibold text-[var(--sea-ink)]">{selectedTitle()}</span>
            {" "}in{" "}
            <span class="font-semibold text-[var(--sea-ink)]">
              {COUNTRIES.find((c) => c.key === selectedCountryKey())?.name}
            </span>
          </p>
        </div>
        <ol class="space-y-5">
          <For each={PIPELINE_STEPS}>
            {(step) => {
              const state = () => stepState(step.key, stage());
              return (
                <li class="flex items-start gap-4">
                  <div
                    class={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      state() === "done"
                        ? "bg-[var(--palm)] text-white"
                        : state() === "active"
                          ? "bg-[var(--lagoon)] text-white"
                          : "border border-[var(--line)] bg-white/60 text-[var(--sea-ink-soft)]"
                    }`}
                  >
                    <Show when={state() === "done"}>
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </Show>
                    <Show when={state() === "active"}>
                      <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </Show>
                  </div>
                  <div>
                    <p class={`text-sm font-semibold ${state() !== "pending" ? "text-[var(--sea-ink)]" : "text-[var(--sea-ink-soft)]"}`}>
                      {step.label}
                    </p>
                    <p class="text-xs text-[var(--sea-ink-soft)]">{step.desc}</p>
                  </div>
                </li>
              );
            }}
          </For>
        </ol>
        <Show when={stage() === "apify" || stage() === "databricks"}>
          <p class="mt-5 text-xs text-[var(--sea-ink-soft)]">
            <Show when={stage() === "apify"}>
              Scraping can take 1–3 minutes. Status polled every 15 s.
            </Show>
            <Show when={stage() === "databricks"}>
              Databricks pipeline running — usually completes within 5 minutes.
            </Show>
          </p>
        </Show>
      </section>

      {/* ── Rate limited ─────────────────────────────────────────── */}
      <Show when={stage() === "rate_limited"}>
        <section class="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 shadow-[0_4px_14px_rgba(23,58,64,0.06)]">
          <p class="text-sm font-semibold text-amber-800">
            Rate limit reached — wait {Math.floor(rateLimitSecs() / 60)}m{" "}
            {rateLimitSecs() % 60}s before fetching again.
          </p>
          <button
            onClick={() => setStage("idle")}
            class="mt-3 rounded-full border border-amber-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-white/90"
          >
            Back
          </button>
        </section>
      </Show>

      {/* ── Error ────────────────────────────────────────────────── */}
      <Show when={stage() === "error"}>
        <section class="rounded-2xl border border-red-200/60 bg-red-50/50 p-5 shadow-[0_4px_14px_rgba(23,58,64,0.06)]">
          <p class="text-sm font-semibold text-red-700">Error: {error()}</p>
          <button
            onClick={() => { setStage("idle"); setError(""); }}
            class="mt-3 rounded-full border border-red-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-white/90"
          >
            Try again
          </button>
        </section>
      </Show>

      {/* ── Stack rankings ───────────────────────────────────────── */}
      <Show when={stage() === "done"}>
        <section class={`${CARD} overflow-hidden rounded-2xl p-6 sm:p-8`}>

          {/* Header */}
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class={KICKER}>{stacks().length} stacks ranked</p>
              <Show when={activeSearch()}>
                <p class="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                  {activeSearch()!.jobTitle} · {activeSearch()!.countryName}
                </p>
              </Show>
            </div>
            <button
              onClick={() => setStage("idle")}
              class="rounded-full border border-[var(--line)] bg-white/60 px-4 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] cursor-pointer transition hover:bg-white/90"
            >
              New search
            </button>
          </div>

          {/* Top 6 grid */}
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <For each={stacks().slice(0, 6)}>
              {(stack, i) => (
                <div class="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-white/50 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--sea-ink-soft)]">#{i() + 1}</span>
                    <span class="text-xs text-[var(--sea-ink-soft)]">{stack.count} jobs</span>
                  </div>
                  <p class="text-sm font-semibold leading-tight text-[var(--sea-ink)]">{stack.stack}</p>
                  <div class="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] transition-all duration-700"
                      style={{ width: `${stack.percentage}%` }}
                    />
                  </div>
                  <span class="text-right text-xs font-semibold text-[var(--lagoon-deep)]">{stack.percentage}%</span>
                </div>
              )}
            </For>
          </div>

          {/* Full ranked list */}
          <div class="-mx-6 sm:-mx-8">
            <For each={stacks()}>
              {(stack, i) => (
                <div class={`flex items-center gap-4 px-6 py-3.5 sm:px-8 ${i() < stacks().length - 1 ? "border-b border-[var(--line)]" : ""} transition-colors hover:bg-white/20`}>
                  <span class="w-6 flex-shrink-0 text-right text-xs font-bold text-[var(--sea-ink-soft)]">
                    {i() + 1}
                  </span>
                  <div class="w-36 flex-shrink-0">
                    <p class="text-sm font-semibold text-[var(--sea-ink)]">{stack.stack}</p>
                  </div>
                  <div class="flex flex-1 items-center gap-3">
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] transition-all duration-700"
                        style={{ width: `${stack.percentage}%` }}
                      />
                    </div>
                    <span class="w-10 flex-shrink-0 text-right text-xs font-semibold text-[var(--sea-ink)]">
                      {stack.percentage}%
                    </span>
                  </div>
                  <span class="w-20 flex-shrink-0 text-right text-xs text-[var(--sea-ink-soft)]">
                    {stack.count} listings
                  </span>
                </div>
              )}
            </For>
          </div>

        </section>
      </Show>

    </main>
  );
}
