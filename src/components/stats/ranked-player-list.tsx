export function RankedPlayerList({
  rows,
  unit,
}: {
  rows: ReadonlyArray<{ playerId: string; name: string; count: number }>;
  unit: string;
}) {
  return (
    <ol aria-label={unit}>
      {rows.map((row, index) => (
        <li
          key={row.playerId}
          className="border-border/70 flex min-h-11 items-center gap-3 border-b py-1 last:border-b-0"
        >
          <span className="text-muted-foreground w-5 shrink-0 text-sm tabular-nums">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
          <span className="font-display text-sm font-semibold tabular-nums">
            {row.count}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
