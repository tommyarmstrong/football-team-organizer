import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  GOALS_METRIC_OPTIONS,
  GOALS_POSITION_FILTERS,
  toggleGoalsPositionFilter,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";
import {
  PERIOD_TYPE_FILTER_OPTIONS,
  type PeriodTypeFilter,
} from "@/lib/stats/period-starts-view";

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

function FilterGroup({
  heading,
  groupLabel,
  children,
}: {
  heading: string;
  groupLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {heading}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={groupLabel}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Position filters, then the period Type filter when `periodType` and
 * `onPeriodTypeChange` are given, then the Total / Per game / Per period view
 * when `metric`, `onMetricChange` and `metricAriaLabel` are all given.
 * Sections that only make sense as a total (e.g. appearances) leave the view
 * out.
 */
export function StatFilters({
  positions,
  onPositionsChange,
  metric,
  onMetricChange,
  metricAriaLabel,
  metricOptions = GOALS_METRIC_OPTIONS,
  periodType,
  onPeriodTypeChange,
}: {
  positions: GoalsPositionFilter[];
  onPositionsChange: (next: GoalsPositionFilter[]) => void;
  metric?: GoalsMetric;
  onMetricChange?: (next: GoalsMetric) => void;
  metricAriaLabel?: string;
  /** The buttons in the View row. Defaults to Total / Per game / Per period. */
  metricOptions?: ReadonlyArray<{ value: GoalsMetric; label: string }>;
  /** Period Type filter (All / Quarters / Halves / Extra time). */
  periodType?: PeriodTypeFilter;
  onPeriodTypeChange?: (next: PeriodTypeFilter) => void;
}) {
  return (
    <>
      <FilterGroup heading="Position" groupLabel="Position filters">
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
      </FilterGroup>

      {periodType && onPeriodTypeChange ? (
        <FilterGroup heading="Type" groupLabel="Period type filters">
          {PERIOD_TYPE_FILTER_OPTIONS.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              pressed={periodType === option.value}
              onClick={() => onPeriodTypeChange(option.value)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {metric && onMetricChange && metricAriaLabel ? (
        <FilterGroup heading="View" groupLabel={metricAriaLabel}>
          {metricOptions.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              pressed={metric === option.value}
              onClick={() => onMetricChange(option.value)}
            />
          ))}
        </FilterGroup>
      ) : null}
    </>
  );
}
