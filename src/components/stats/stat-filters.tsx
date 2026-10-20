import { Button } from "@/components/ui/button";
import {
  GOALS_METRIC_OPTIONS,
  GOALS_POSITION_FILTERS,
  toggleGoalsPositionFilter,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";

function FilterButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function StatFilters({
  positions,
  onPositionsChange,
  metric,
  onMetricChange,
  metricAriaLabel,
}: {
  positions: GoalsPositionFilter[];
  onPositionsChange: (next: GoalsPositionFilter[]) => void;
  metric: GoalsMetric;
  onMetricChange: (next: GoalsMetric) => void;
  metricAriaLabel: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Position
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Position filters"
        >
          {GOALS_POSITION_FILTERS.map((value) => (
            <FilterButton
              key={value}
              label={value}
              pressed={positions.includes(value)}
              onClick={() =>
                onPositionsChange(toggleGoalsPositionFilter(positions, value))
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          View
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={metricAriaLabel}
        >
          {GOALS_METRIC_OPTIONS.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              pressed={metric === option.value}
              onClick={() => onMetricChange(option.value)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
