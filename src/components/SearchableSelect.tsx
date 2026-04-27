import { createSignal, Show, For } from "solid-js";
import type { Option } from "../lib/options";

export function SearchableSelect(props: {
  label: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = createSignal("");
  const [open, setOpen] = createSignal(false);

  const selectedLabel = () => props.options.find((o) => o.value === props.value)?.label ?? "";
  const filteredOptions = () => {
    const q = query().toLowerCase();
    return q ? props.options.filter((o) => o.label.toLowerCase().includes(q)) : props.options;
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
          onFocus={() => { setOpen(true); setQuery(""); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder={props.placeholder ?? "Search…"}
          class="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2.5 pr-8 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)] disabled:opacity-50"
        />
        <svg class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--sea-ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <Show when={open()}>
          <ul class="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-white shadow-xl">
            <For each={filteredOptions()}>
              {(option) => (
                <li
                  class={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(79,184,178,0.1)] ${option.value === props.value ? "font-semibold text-[var(--lagoon-deep)]" : "text-[var(--sea-ink)]"}`}
                  onMouseDown={(e) => { e.preventDefault(); props.onSelect(option.value); setOpen(false); }}
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
