import { Show } from "solid-js";
import { SearchableSelect } from "./SearchableSelect";
import { JOB_TITLE_OPTIONS, COUNTRY_OPTIONS } from "../lib/options";
import { CARD } from "../lib/styles";

export function SearchForm(props: {
  title: string;
  countryKey: string;
  running: boolean;
  onSelectTitle: (v: string) => void;
  onSelectCountry: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div class={`${CARD} relative rounded-2xl px-6 py-5 sm:px-8`}>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="sm:min-w-[220px]">
          <SearchableSelect label="Job title" options={JOB_TITLE_OPTIONS} value={props.title} onSelect={props.onSelectTitle} disabled={props.running} placeholder="Search role…" />
        </div>
        <div class="sm:min-w-[220px]">
          <SearchableSelect label="Country" options={COUNTRY_OPTIONS} value={props.countryKey} onSelect={props.onSelectCountry} disabled={props.running} placeholder="Search country…" />
        </div>
        <button
          onClick={props.onSubmit}
          disabled={props.running}
          class={`inline-flex items-center gap-2.5 rounded-full px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)] focus:ring-offset-2 sm:self-end cursor-pointer ${props.running ? "cursor-not-allowed bg-[var(--lagoon)] opacity-60" : "bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"}`}
        >
          <Show when={props.running}>
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </Show>
          <Show when={!props.running}>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Show>
          {props.running ? "Running…" : "Analyse stacks"}
        </button>
      </div>
    </div>
  );
}
