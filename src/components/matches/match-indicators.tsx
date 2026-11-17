/** Status pills shared by every match card (dashboard, list, detail). */

export function LiveIndicator() {
  return (
    <span
      className="relative inline-flex shrink-0 animate-[live-throb_1.6s_ease-in-out_infinite] items-center rounded-full border border-red-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-red-600 uppercase dark:border-red-400 dark:text-red-400"
      aria-label="Live — in progress"
      title="In progress"
    >
      LIVE
    </span>
  );
}

export function ScheduledIndicator() {
  return (
    <span
      className="text-win border-win inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide"
      aria-label="Scheduled"
      title="Scheduled"
    >
      Scheduled
    </span>
  );
}
