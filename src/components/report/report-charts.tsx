import type { CSSProperties, ReactNode } from "react";
import {
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  monthTicks,
  niceStep,
  ringSegments,
} from "@/lib/report/chart-math";
import {
  cumulativePoints,
  pointsTooltip,
  type Tally,
  type TrendMatch,
} from "@/lib/report/summary";
import type { ReportMatch } from "@/lib/report/types";

/**
 * Charts for the printed report. Static SVG/HTML only, so they are vector,
 * need no client JavaScript and print identically everywhere.
 *
 * SVG viewBoxes are sized in roughly CSS pixels of the printed width, so 1
 * unit is about 0.26 mm and a font size of 11 is about 8 pt.
 *
 * The same charts are reused on the Stats page. Every neutral colour reads a
 * `--chart-*` custom property and falls back to the printed-paper value, so the
 * report needs no setup; `ChartTheme` supplies app-themed values on screen.
 */

export const RESULT_COLOURS = {
  W: "#1c8a4e",
  D: "#e0a526",
  L: "#cf4437",
} as const;

/** Goals scored and conceded use the win and loss colours. */
export const GOALS_COLOURS = {
  for: RESULT_COLOURS.W,
  against: RESULT_COLOURS.L,
} as const;

const GRID = "var(--chart-grid, #d9dfdb)";
const MUTED = "var(--chart-muted, #6b7770)";
const LABEL = "var(--chart-label, #525252)";
const INK = "var(--chart-ink, #14201a)";
const TRACK = "var(--chart-track, #e5e5e5)";
const AGAINST = "var(--chart-against, #9aa5a0)";

/**
 * Maps the report's `--club` and `--chart-*` properties onto the app theme, so
 * the report charts follow the club colour and dark mode on the Stats page.
 */
export const CHART_THEME_STYLE = {
  "--club": "var(--primary)",
  "--club-ink": "var(--primary)",
  "--chart-grid": "var(--border)",
  "--chart-muted": "var(--muted-foreground)",
  "--chart-label": "var(--muted-foreground)",
  "--chart-ink": "var(--foreground)",
  "--chart-track": "var(--muted)",
  "--chart-against": "var(--muted-foreground)",
} as CSSProperties;

export function ChartTheme({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={CHART_THEME_STYLE}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ring (donut)
// ---------------------------------------------------------------------------

type RingSlice = {
  key: string;
  label: string;
  count: number;
  colour: string;
};

function RingChart({
  slices,
  centreLabel,
  ariaLabel,
}: {
  slices: readonly RingSlice[];
  centreLabel: string;
  ariaLabel: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const colours = new Map(slices.map((s) => [s.key, s.colour]));
  const segments = ringSegments(
    slices.map((s) => ({ key: s.key, count: s.count })),
  );
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={ariaLabel}
      className="h-full w-full"
    >
      <circle
        cx="50"
        cy="50"
        r={DONUT_RADIUS}
        fill="none"
        stroke={GRID}
        strokeWidth="13"
      />
      <g transform="rotate(-90 50 50)">
        {segments.map((s) => (
          <circle
            key={s.key}
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="none"
            stroke={colours.get(s.key)}
            strokeWidth="13"
            strokeDasharray={`${s.length} ${DONUT_CIRCUMFERENCE}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </g>
      <text
        x="50"
        y="52"
        textAnchor="middle"
        className="font-display"
        fontSize="26"
        fontWeight="600"
        fill={INK}
      >
        {total}
      </text>
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="1.2"
        fill={MUTED}
      >
        {centreLabel}
      </text>
    </svg>
  );
}

function RingLegend({ slices }: { slices: readonly RingSlice[] }) {
  return (
    <ul className="space-y-[2.2mm]">
      {slices.map((s) => (
        <li key={s.key} className="flex items-center gap-[3mm] text-[10.5pt]">
          <span
            className="inline-block size-[3.4mm] rounded-full"
            style={{ backgroundColor: s.colour }}
          />
          <span className="w-[16mm]" style={{ color: LABEL }}>
            {s.label}
          </span>
          <span className="font-display text-[15pt] leading-none font-semibold">
            {s.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function resultSlices(tally: Tally): RingSlice[] {
  return [
    { key: "W", label: "Won", count: tally.wins, colour: RESULT_COLOURS.W },
    { key: "D", label: "Drawn", count: tally.draws, colour: RESULT_COLOURS.D },
    { key: "L", label: "Lost", count: tally.losses, colour: RESULT_COLOURS.L },
  ];
}

function goalSlices(goals: {
  goalsFor: number;
  goalsAgainst: number;
}): RingSlice[] {
  return [
    {
      key: "for",
      label: "Scored",
      count: goals.goalsFor,
      colour: GOALS_COLOURS.for,
    },
    {
      key: "against",
      label: "Conceded",
      count: goals.goalsAgainst,
      colour: GOALS_COLOURS.against,
    },
  ];
}

export function ResultsDonut({ tally }: { tally: Tally }) {
  return (
    <RingChart
      slices={resultSlices(tally)}
      centreLabel="PLAYED"
      ariaLabel={`${tally.wins} wins, ${tally.draws} draws, ${tally.losses} losses`}
    />
  );
}

export function ResultsLegend({ tally }: { tally: Tally }) {
  return <RingLegend slices={resultSlices(tally)} />;
}

/** Goals scored and conceded, as a ring in the same format as the results. */
export function GoalsDonut({
  goalsFor,
  goalsAgainst,
}: {
  goalsFor: number;
  goalsAgainst: number;
}) {
  return (
    <RingChart
      slices={goalSlices({ goalsFor, goalsAgainst })}
      centreLabel="GOALS"
      ariaLabel={`${goalsFor} goals scored, ${goalsAgainst} goals conceded`}
    />
  );
}

export function GoalsLegend({
  goalsFor,
  goalsAgainst,
}: {
  goalsFor: number;
  goalsAgainst: number;
}) {
  return <RingLegend slices={goalSlices({ goalsFor, goalsAgainst })} />;
}

// ---------------------------------------------------------------------------
// Form strip
// ---------------------------------------------------------------------------

export function FormStrip({ matches }: { matches: readonly ReportMatch[] }) {
  return (
    <ol className="flex flex-wrap gap-[1.6mm]" aria-label="Results in order">
      {matches.map((m) => (
        <li
          key={m.id}
          title={`${m.opponent} ${m.goalsFor}–${m.goalsAgainst}`}
          className="font-display flex size-[7.4mm] items-center justify-center rounded-[1.4mm] text-[10pt] font-semibold text-white"
          style={{ backgroundColor: RESULT_COLOURS[m.result] }}
        >
          {m.result}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Points trend
// ---------------------------------------------------------------------------

/**
 * Cumulative points after each match. Each point is tagged `data-point` (its
 * index) and, by default, carries a native hover tooltip. The Stats page turns
 * the native tooltip off and draws its own, which also works on touch.
 */
export function PointsTrend({
  matches,
  nativeTooltips = true,
}: {
  matches: readonly TrendMatch[];
  nativeTooltips?: boolean;
}) {
  const W = 688;
  const H = 230;
  const pad = { l: 30, r: 10, t: 12, b: 26 };
  const points = cumulativePoints(matches);
  if (points.length === 0) return null;

  const step = niceStep(points[points.length - 1]!);
  const yMax = Math.ceil(points[points.length - 1]! / step) * step || step;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) =>
    pad.l +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (value: number) => pad.t + innerH - (value / yMax) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p)}`).join(" ");
  const area = `${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`;
  const gridValues: number[] = [];
  for (let v = 0; v <= yMax; v += step) gridValues.push(v);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Cumulative points through the season"
      className="w-full"
    >
      {gridValues.map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(v)}
            y2={y(v)}
            stroke={GRID}
            strokeWidth="1"
          />
          <text
            x={pad.l - 6}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize="10"
            fill={MUTED}
          >
            {v}
          </text>
        </g>
      ))}
      <polygon points={area} fill="var(--club)" opacity="0.14" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--club)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {matches.map((m, i) => (
        <g key={m.id} data-point={i}>
          {nativeTooltips ? (
            <title>{pointsTooltip(m, points[i]!)}</title>
          ) : null}
          <circle
            cx={x(i)}
            cy={y(points[i]!)}
            r="4.2"
            fill={RESULT_COLOURS[m.result]}
            stroke="#fff"
            strokeWidth="1.6"
          />
          {/* A larger invisible target, so the tooltip is easy to hit. */}
          <circle
            cx={x(i)}
            cy={y(points[i]!)}
            r="9"
            fill="transparent"
            className="cursor-pointer"
            data-hit="true"
          />
        </g>
      ))}
      {monthTicks(matches).map((t) => (
        <text
          key={t.index}
          x={x(t.index)}
          y={H - 8}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="0.8"
          fill={MUTED}
        >
          {t.label.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Goals per match
// ---------------------------------------------------------------------------

export function GoalsPerMatch({
  matches,
}: {
  matches: ReadonlyArray<Pick<ReportMatch, "id" | "goalsFor" | "goalsAgainst">>;
}) {
  const W = 688;
  const H = 330;
  const pad = { l: 30, r: 10, t: 14, b: 26 };
  if (matches.length === 0) return null;

  const maxGoals = Math.max(
    1,
    ...matches.map((m) => Math.max(m.goalsFor, m.goalsAgainst)),
  );
  const innerW = W - pad.l - pad.r;
  const mid = pad.t + (H - pad.t - pad.b) / 2;
  const half = (H - pad.t - pad.b) / 2 - 4;
  const unit = half / maxGoals;
  const slot = innerW / matches.length;
  const barW = Math.min(slot * 0.62, 22);

  const ticks: number[] = [];
  for (let v = 0; v <= maxGoals; v += maxGoals > 8 ? 2 : 1) ticks.push(v);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Goals scored and conceded in each match"
      className="w-full"
    >
      {ticks.map((v) => (
        <g key={v}>
          {v > 0 ? (
            <>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={mid - v * unit}
                y2={mid - v * unit}
                stroke={GRID}
              />
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={mid + v * unit}
                y2={mid + v * unit}
                stroke={GRID}
              />
              <text
                x={pad.l - 6}
                y={mid - v * unit + 3.5}
                textAnchor="end"
                fontSize="10"
                fill={MUTED}
              >
                {v}
              </text>
              <text
                x={pad.l - 6}
                y={mid + v * unit + 3.5}
                textAnchor="end"
                fontSize="10"
                fill={MUTED}
              >
                {v}
              </text>
            </>
          ) : null}
        </g>
      ))}
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={mid}
        y2={mid}
        stroke={INK}
        strokeWidth="1.2"
      />
      {matches.map((m, i) => {
        const cx = pad.l + slot * i + slot / 2;
        return (
          <g key={m.id}>
            <rect
              x={cx - barW / 2}
              y={mid - m.goalsFor * unit}
              width={barW}
              height={m.goalsFor * unit}
              rx="2"
              fill="var(--club)"
            />
            <rect
              x={cx - barW / 2}
              y={mid}
              width={barW}
              height={m.goalsAgainst * unit}
              rx="2"
              fill={AGAINST}
            />
            <text
              x={cx}
              y={H - 8}
              textAnchor="middle"
              fontSize="9.5"
              fill={MUTED}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <text
        x={pad.l + 4}
        y={pad.t - 2}
        fontSize="9.5"
        letterSpacing="1"
        fill="var(--club-ink)"
      >
        SCORED
      </text>
      <text
        x={pad.l + 4}
        y={H - pad.b + 2 - 12}
        fontSize="9.5"
        letterSpacing="1"
        fill={MUTED}
      >
        CONCEDED
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Leader bars
// ---------------------------------------------------------------------------

export function LeaderBars({
  rows,
  unit,
  emptyText,
  nameWidth = "34mm",
  valueWidth = "9mm",
}: {
  rows: ReadonlyArray<{
    name: string;
    value: number;
    playerId: string;
    /** Text shown instead of `value`, e.g. "0.50" for a per-game rate. */
    display?: string;
  }>;
  unit: string;
  emptyText: string;
  /** Width of the name column; narrower in half-width panels. */
  nameWidth?: string;
  /** Width of the value column; wider for decimal values. */
  valueWidth?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-[10pt] text-neutral-500 italic">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="space-y-[2.2mm]">
      {rows.map((r) => (
        <li
          key={r.playerId}
          className="grid items-center gap-[3mm] text-[10pt]"
          style={{ gridTemplateColumns: `${nameWidth} 1fr ${valueWidth}` }}
        >
          <span className="truncate">{r.name}</span>
          <span
            className="block h-[4.2mm] overflow-hidden rounded-full"
            style={{ backgroundColor: TRACK }}
          >
            <span
              className="block h-full rounded-full bg-(--club)"
              style={{
                width: `${max > 0 ? Math.max((r.value / max) * 100, 4) : 4}%`,
              }}
            />
          </span>
          <span className="font-display text-right text-[13pt] leading-none font-semibold">
            {r.display ?? r.value}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
