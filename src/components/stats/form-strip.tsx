const RESULT_LABELS = {
  W: "Win",
  D: "Draw",
  L: "Loss",
} as const;

const RESULT_CLASS = {
  W: "bg-win text-win-foreground",
  D: "bg-draw text-draw-foreground",
  L: "bg-loss text-loss-foreground",
} as const;

export function FormStrip({ form }: { form: Array<"W" | "D" | "L"> }) {
  return (
    <ul
      className="flex flex-wrap gap-1.5"
      aria-label={`Recent form: ${form
        .map((letter) => RESULT_LABELS[letter])
        .join(", ")}`}
    >
      {form.map((letter, i) => (
        <li key={`${letter}-${i}`}>
          <span
            className={`${RESULT_CLASS[letter]} inline-flex size-9 items-center justify-center rounded-lg text-xs font-bold shadow-sm`}
            aria-label={RESULT_LABELS[letter]}
          >
            <span aria-hidden>{letter}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
