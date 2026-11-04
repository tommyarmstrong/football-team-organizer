import {
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  donutSegments,
  monthTicks,
  niceStep,
} from "@/lib/report/chart-math";
import { cumulativePoints, type Tally } from "@/lib/report/summary";
import type { ReportMatch } from "@/lib/report/types";

/**
 * Charts for the printed report. Static SVG/HTML only, so they are vector,
 * need no client JavaScript and print identically everywhere.
 *
 * SVG viewBoxes are sized in roughly CSS pixels of the printed width, so 1
 * unit is about 0.26 mm and a font size of 11 is about 8 pt.
 */

export const RESULT_COLOURS = {
  W: "#1c8a4e",
  D: "#e0a526",
  L: "#cf4437",
} as const;

const GRID = "#d9dfdb";
const MUTED = "#6b7770";

// ---------------------------------------------------------------------------
// Donut
// ---------------------------------------------------------------------------

export function ResultsDonut({ tally }: { tally: Tally }) {
  const played = tally.wins + tally.draws + tally.losses;
  const segments = donutSegments(tally);
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${tally.wins} wins, ${tally.draws} draws, ${tally.losses} losses`}
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
            stroke={RESULT_COLOURS[s.key]}
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
        fill="#14201a"
      >
        {played}
      </text>
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="1.2"
        fill={MUTED}
      >
        PLAYED
      </text>
    </svg>
  );
}

export function ResultsLegend({ tally }: { tally: Tally }) {
  const rows = [
    { key: "W", label: "Won", count: tally.wins },
    { key: "D", label: "Drawn", count: tally.draws },
    { key: "L", label: "Lost", count: tally.losses },
  ] as const;
  return (
    <ul className="space-y-[2.2mm]">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-[3mm] text-[10.5pt]">
          <span
            className="inline-block size-[3.4mm] rounded-full"
            style={{ backgroundColor: RESULT_COLOURS[r.key] }}
          />
          <span className="w-[16mm] text-neutral-600">{r.label}</span>
          <span className="font-display text-[15pt] leading-none font-semibold">
            {r.count}
          </span>
        </li>
      ))}
    </ul>
  );
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

export function PointsTrend({ matches }: { matches: readonly ReportMatch[] }) {
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
      aria-label="Cumulative league points through the season"
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
        <circle
          key={m.id}
          cx={x(i)}
          cy={y(points[i]!)}
          r="4.2"
          fill={RESULT_COLOURS[m.result]}
          stroke="#fff"
          strokeWidth="1.6"
        />
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
  matches: readonly ReportMatch[];
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
        stroke="#14201a"
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
              fill="#9aa5a0"
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
}: {
  rows: ReadonlyArray<{ name: string; value: number; playerId: string }>;
  unit: string;
  emptyText: string;
  /** Width of the name column; narrower in half-width panels. */
  nameWidth?: string;
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
          style={{ gridTemplateColumns: `${nameWidth} 1fr 9mm` }}
        >
          <span className="truncate">{r.name}</span>
          <span className="block h-[4.2mm] overflow-hidden rounded-full bg-neutral-200">
            <span
              className="block h-full rounded-full bg-(--club)"
              style={{ width: `${Math.max((r.value / max) * 100, 4)}%` }}
            />
          </span>
          <span className="font-display text-right text-[13pt] leading-none font-semibold">
            {r.value}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
