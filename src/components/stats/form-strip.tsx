const RESULT_LABELS = {
  W: "Win",
  D: "Draw",
  L: "Loss",
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
            className={
              letter === "W"
                ? "bg-foreground text-background inline-flex size-9 items-center justify-center rounded-md text-xs font-semibold"
                : letter === "D"
                  ? "bg-muted text-foreground ring-border inline-flex size-9 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-inset"
                  : "border-border text-muted-foreground inline-flex size-9 items-center justify-center rounded-md border text-xs font-semibold"
            }
            aria-label={RESULT_LABELS[letter]}
          >
            <span aria-hidden>{letter}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
