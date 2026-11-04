import type { Tally } from "@/lib/report/summary";
import type { ReportMatch } from "@/lib/report/types";

/** Pure geometry and tick helpers for the report charts (unit tested). */

export const DONUT_RADIUS = 38;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function donutSegments(
  tally: Tally,
  gap = 1.2,
): Array<{ key: "W" | "D" | "L"; length: number; offset: number }> {
  const total = tally.wins + tally.draws + tally.losses;
  if (total === 0) return [];
  const parts = [
    { key: "W", count: tally.wins },
    { key: "D", count: tally.draws },
    { key: "L", count: tally.losses },
  ] as const;
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
  matches: readonly ReportMatch[],
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
