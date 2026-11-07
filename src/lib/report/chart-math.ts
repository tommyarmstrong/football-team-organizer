import type { Tally } from "@/lib/report/summary";
import type { ReportMatch } from "@/lib/report/types";

/** Pure geometry and tick helpers for the report charts (unit tested). */

export const DONUT_RADIUS = 38;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Arc segments for a ring chart, in order, starting at 12 o'clock. Parts on
 * zero are left out, and a small gap separates neighbouring segments.
 */
export function ringSegments<K extends string>(
  parts: readonly { key: K; count: number }[],
  gap = 1.2,
): Array<{ key: K; length: number; offset: number }> {
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  if (total === 0) return [];
  const visible = parts.filter((p) => p.count > 0);
  const useGap = visible.length > 1 ? gap : 0;
  let offset = 0;
  return visible.map((p) => {
    const share = (p.count / total) * DONUT_CIRCUMFERENCE;
    const segment = {
      key: p.key,
      length: Math.max(share - useGap, 0.01),
      offset,
    };
    offset += share;
    return segment;
  });
}

export function donutSegments(
  tally: Tally,
  gap = 1.2,
): Array<{ key: "W" | "D" | "L"; length: number; offset: number }> {
  return ringSegments(
    [
      { key: "W", count: tally.wins },
      { key: "D", count: tally.draws },
      { key: "L", count: tally.losses },
    ] as const,
    gap,
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Indices where the month changes, with its short name, for x-axis ticks. */
export function monthTicks(
  matches: ReadonlyArray<Pick<ReportMatch, "date">>,
): Array<{ index: number; label: string }> {
  const ticks: Array<{ index: number; label: string }> = [];
  let previous = "";
  matches.forEach((m, index) => {
    const month = m.date.slice(0, 7);
    if (month !== previous) {
      const monthIndex = Number(m.date.slice(5, 7)) - 1;
      ticks.push({ index, label: MONTHS[monthIndex] ?? "" });
      previous = month;
    }
  });
  return ticks;
}

/** A tidy y-axis step (1, 2, 5, 10, ...) giving about four to six lines. */
export function niceStep(max: number): number {
  if (max <= 6) return 1;
  if (max <= 12) return 2;
  if (max <= 30) return 5;
  if (max <= 60) return 10;
  return 20;
}

/** Point size the report prints (SVG units). */
export const REPORT_POINT_RADIUS = 4.2;

/**
 * Radius of a point on the points trend, and of its invisible hover target.
 *
 * `wanted` is how big the point should be; it shrinks only when there are so
 * many matches that neighbouring points would touch, and never below the
 * report's size. The hover target is about twice the point but never wider
 * than half the gap to the next point, so neighbouring targets do not overlap.
 */
export function pointSizes(
  count: number,
  innerWidth: number,
  wanted: number = REPORT_POINT_RADIUS,
): { radius: number; hit: number } {
  const gap = count > 1 ? innerWidth / (count - 1) : Number.POSITIVE_INFINITY;
  const radius = Math.max(REPORT_POINT_RADIUS, Math.min(wanted, gap * 0.42));
  const hit = Math.max(radius + 2, Math.min(radius * 2, 9 + radius, gap / 2));
  return { radius, hit };
}
