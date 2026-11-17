import { seasonTilesFromResults } from "@/lib/stats/season-tiles";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

/** Played and goal difference stay on larger screens; a phone shows W–D–L and Goals. */
const GLANCE_HIDDEN_ON_MOBILE = new Set(["Played", "Goal difference"]);

export function SeasonTiles({
  results,
  variant = "default",
}: {
  results: ResultOverTimePoint[];
  variant?: "default" | "glance";
}) {
  const tiles = seasonTilesFromResults(results);
  if (!tiles) return null;
  const glance = variant === "glance";

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        glance ? "md:grid-cols-4" : "sm:grid-cols-4",
      )}
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={cn(
            "bg-card ring-border flex flex-col justify-center shadow-sm ring-1",
            glance
              ? "min-h-12 rounded-lg px-3 py-2"
              : "min-h-[4.5rem] rounded-2xl px-3 py-2.5",
            glance &&
              GLANCE_HIDDEN_ON_MOBILE.has(tile.label) &&
              "hidden md:flex",
          )}
        >
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {tile.label}
          </p>
          <p
            className={cn(
              "font-display leading-none tracking-tight tabular-nums",
              glance ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
            )}
            aria-label={tile.ariaLabel}
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
