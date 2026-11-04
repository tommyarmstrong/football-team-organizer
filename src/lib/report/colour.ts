import { isValidClubColour } from "@/lib/clubs/branding";

/** The app's pitch green, used when a club has not set a colour. */
export const DEFAULT_REPORT_COLOUR = "#146C4A";

export type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb | null {
  if (!isValidClubColour(hex)) return null;
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgb = [255, 255, 255];
const NEAR_BLACK: Rgb = [17, 24, 20];

/** Valid #RRGGBB club colour, or the default green. */
export function resolveReportColour(colour: string | null | undefined): string {
  const value = colour?.trim().toUpperCase();
  return value && isValidClubColour(value) ? value : DEFAULT_REPORT_COLOUR;
}

/** Black or white, whichever reads best on top of `colour`. */
export function readableForeground(colour: string): "#FFFFFF" | "#111814" {
  const rgb =
    hexToRgb(resolveReportColour(colour)) ?? hexToRgb(DEFAULT_REPORT_COLOUR)!;
  return contrastRatio(rgb, WHITE) >= contrastRatio(rgb, NEAR_BLACK)
    ? "#FFFFFF"
    : "#111814";
}

/**
 * Light club colours (yellow, pale blue) are unreadable as text on white
 * paper. Above this luminance the "ink" variant is darkened.
 */
const LIGHT_COLOUR_LUMINANCE = 0.3;

export function isLightColour(colour: string): boolean {
  const rgb = hexToRgb(resolveReportColour(colour));
  return rgb ? relativeLuminance(rgb) > LIGHT_COLOUR_LUMINANCE : false;
}

/**
 * CSS custom properties for the report root. Everything on the page is built
 * from these, so a new club colour re-themes the whole book.
 *
 * - `--club`      the colour itself (panels, bars)
 * - `--club-fg`   readable text on `--club`
 * - `--club-deep` darker shade (cover gradient, dark panels)
 * - `--club-ink`  coloured text on white paper (darkened for light colours)
 * - `--club-soft` pale tint for table banding and cards
 * - `--club-line` hairlines
 */
export function reportThemeVars(
  colour: string | null | undefined,
): Record<string, string> {
  const club = resolveReportColour(colour);
  const light = isLightColour(club);
  return {
    "--club": club,
    "--club-fg": readableForeground(club),
    "--club-deep": `color-mix(in srgb, ${club} 62%, #05140c)`,
    "--club-ink": light ? `color-mix(in srgb, ${club} 40%, #1a1a10)` : club,
    "--club-soft": `color-mix(in srgb, ${club} 9%, #ffffff)`,
    "--club-line": `color-mix(in srgb, ${club} 28%, #ffffff)`,
  };
}
