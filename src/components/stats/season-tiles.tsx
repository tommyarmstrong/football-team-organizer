import { seasonTilesFromResults } from "@/lib/stats/season-tiles";
import type { ResultOverTimePoint } from "@/lib/data/stats";

export function SeasonTiles({ results }: { results: ResultOverTimePoint[] }) {
  const tiles = seasonTilesFromResults(results);
  if (!tiles) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="bg-card ring-foreground/10 flex min-h-[4.5rem] flex-col justify-center rounded-2xl px-3 py-2.5 shadow-sm ring-1"
        >
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {tile.label}
          </p>
          <p
            className="font-display text-3xl leading-none tracking-tight tabular-nums sm:text-4xl"
            aria-label={tile.ariaLabel}
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
