/** Live pill shared by the match card and the matches list. */

export function LiveIndicator() {
  return (
    <span
      className="border-loss text-loss relative inline-flex shrink-0 animate-[live-throb_1.6s_ease-in-out_infinite] items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase"
      aria-label="Live — in progress"
      title="In progress"
    >
      LIVE
    </span>
  );
}
