import { Show, For } from "solid-js";
import { CARD, KICKER } from "../lib/styles";
import { PIPELINE_STEPS, resolveStepState } from "../lib/pipeline";
import type { Stage, StepState } from "../lib/pipeline";

function PipelineStepItem(props: { label: string; desc: string; state: StepState }) {
  return (
    <li class="flex items-start gap-4">
      <div class={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${props.state === "done" ? "bg-[var(--palm)] text-white" : props.state === "active" ? "bg-[var(--lagoon)] text-white" : "border border-[var(--line)] bg-white/60 text-[var(--sea-ink-soft)]"}`}>
        <Show when={props.state === "done"}>
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </Show>
        <Show when={props.state === "active"}>
          <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </Show>
      </div>
      <div>
        <p class={`text-sm font-semibold ${props.state !== "pending" ? "text-[var(--sea-ink)]" : "text-[var(--sea-ink-soft)]"}`}>
          {props.label}
        </p>
        <p class="text-xs text-[var(--sea-ink-soft)]">{props.desc}</p>
      </div>
    </li>
  );
}

export function PipelineCard(props: { stage: Stage; jobTitle: string; countryName: string }) {
  return (
    <section class={`${CARD} rounded-2xl p-6 sm:p-8`}>
      <div class="mb-5 flex items-start justify-between gap-4">
        <p class={KICKER}>Pipeline status</p>
        <p class="text-right text-xs text-[var(--sea-ink-soft)]">
          <span class="font-semibold text-[var(--sea-ink)]">{props.jobTitle}</span>
          {" "}in{" "}
          <span class="font-semibold text-[var(--sea-ink)]">{props.countryName}</span>
        </p>
      </div>
      <ol class="space-y-5">
        <For each={PIPELINE_STEPS}>
          {(step) => (
            <PipelineStepItem
              label={step.label}
              desc={step.desc}
              state={resolveStepState(step.key, props.stage)}
            />
          )}
        </For>
      </ol>
      <Show when={props.stage === "apify" || props.stage === "databricks"}>
        <p class="mt-5 text-xs text-[var(--sea-ink-soft)]">
          <Show when={props.stage === "apify"}>Scraping usually takes 30–50 seconds.</Show>
          <Show when={props.stage === "databricks"}>Pipeline is running, this takes 2–3 minutes.</Show>
        </p>
      </Show>
    </section>
  );
}
