/**
 * Pure helpers for the tap / hover tooltip on the Stats Results chart, kept
 * out of the component so they can be unit tested without a DOM.
 */

/**
 * Which point's tooltip is open after a tap. Tapping a point opens it,
 * tapping the open point again closes it, and tapping elsewhere (`null`)
 * closes it.
 */
export function nextTooltipIndex(
  current: number | null,
  tapped: number | null,
): number | null {
  if (tapped === null) return null;
  return tapped === current ? null : tapped;
}

/**
 * Left edge (in px, from the chart's left) for a tooltip centred on a point,
 * nudged so the whole tooltip stays inside the chart.
 */
export function clampTooltipCentre(
  pointCentre: number,
  chartWidth: number,
  tooltipWidth: number,
): number {
  const half = tooltipWidth / 2;
  if (chartWidth <= tooltipWidth) return chartWidth / 2;
  return Math.min(Math.max(pointCentre, half), chartWidth - half);
}
