import { For } from "solid-js";
import { CARD, KICKER } from "../lib/styles";
import type { StackResult } from "../server/jobs";

function TopSkillCard(props: { rank: number; stack: StackResult }) {
  return (
    <div class="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-white/50 p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-[var(--sea-ink-soft)]">#{props.rank}</span>
        <span class="text-xs text-[var(--sea-ink-soft)]">{props.stack.count} jobs</span>
      </div>
      <p class="text-sm font-semibold leading-tight text-[var(--sea-ink)]">{props.stack.stack}</p>
      <div class="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div class="h-full rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] transition-all duration-700" style={{ width: `${props.stack.percentage}%` }} />
      </div>
      <span class="text-right text-xs font-semibold text-[var(--lagoon-deep)]">{props.stack.percentage}%</span>
    </div>
  );
}

function SkillRow(props: { rank: number; stack: StackResult; showDivider: boolean }) {
  return (
    <div class={`flex items-center gap-4 px-6 py-3.5 sm:px-8 ${props.showDivider ? "border-b border-[var(--line)]" : ""} transition-colors hover:bg-white/20`}>
      <span class="w-6 flex-shrink-0 text-right text-xs font-bold text-[var(--sea-ink-soft)]">{props.rank}</span>
      <div class="w-36 flex-shrink-0">
        <p class="text-sm font-semibold text-[var(--sea-ink)]">{props.stack.stack}</p>
      </div>
      <div class="flex flex-1 items-center gap-3">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
          <div class="h-full rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--lagoon-deep)] transition-all duration-700" style={{ width: `${props.stack.percentage}%` }} />
        </div>
        <span class="w-10 flex-shrink-0 text-right text-xs font-semibold text-[var(--sea-ink)]">{props.stack.percentage}%</span>
      </div>
      <span class="w-20 flex-shrink-0 text-right text-xs text-[var(--sea-ink-soft)]">{props.stack.count} listings</span>
    </div>
  );
}

export function StackResults(props: {
  stacks: StackResult[];
  jobTitle: string;
  countryName: string;
  onNewSearch: () => void;
}) {
  return (
    <section class={`${CARD} overflow-hidden rounded-2xl p-6 sm:p-8`}>
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <p class={KICKER}>{props.stacks.length} stacks ranked</p>
          <p class="mt-0.5 text-xs text-[var(--sea-ink-soft)]">{props.jobTitle} · {props.countryName}</p>
        </div>
        <button onClick={props.onNewSearch} class="rounded-full border border-[var(--line)] bg-white/60 px-4 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] cursor-pointer transition hover:bg-white/90">
          New search
        </button>
      </div>
      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <For each={props.stacks.slice(0, 6)}>
          {(stack, i) => <TopSkillCard rank={i() + 1} stack={stack} />}
        </For>
      </div>
      <div class="-mx-6 sm:-mx-8">
        <For each={props.stacks}>
          {(stack, i) => <SkillRow rank={i() + 1} stack={stack} showDivider={i() < props.stacks.length - 1} />}
        </For>
      </div>
    </section>
  );
}
