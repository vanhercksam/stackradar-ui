export function RateLimitNotice(props: { seconds: number; onDismiss: () => void }) {
  return (
    <section class="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 shadow-[0_4px_14px_rgba(23,58,64,0.06)]">
      <p class="text-sm font-semibold text-amber-800">
        Rate limit reached — wait {Math.floor(props.seconds / 60)}m {props.seconds % 60}s before fetching again.
      </p>
      <button onClick={props.onDismiss} class="mt-3 rounded-full border border-amber-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-white/90">
        Back
      </button>
    </section>
  );
}
