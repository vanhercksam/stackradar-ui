import { CARD } from "../lib/styles";

export function HeroBanner() {
  return (
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
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <p class="m-0">
          <strong>Personal project</strong> not intended for heavy use. Limited to <strong>1 request per 5 minutes</strong>.
        </p>
      </div>
    </section>
  );
}
