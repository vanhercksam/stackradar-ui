export function ErrorNotice(props: { message: string; onRetry: () => void }) {
  return (
    <section class="rounded-2xl border border-red-200/60 bg-red-50/50 p-5 shadow-[0_4px_14px_rgba(23,58,64,0.06)]">
      <p class="text-sm font-semibold text-red-700">Error: {props.message}</p>
      <button onClick={props.onRetry} class="mt-3 rounded-full border border-red-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-white/90">
        Try again
      </button>
    </section>
  );
}
