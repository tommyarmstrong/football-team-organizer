import {
  isExtraTimeOrPenaltyPeriodName,
  matchPeriodSortOrder,
  periodNamesForCompetitionPeriods,
  type MatchPeriodName,
} from "@/lib/constants";

/** Regulation formats a match can be switched between. */
export type PeriodFormat = "halves" | "quarters";

export const PERIOD_FORMATS: readonly PeriodFormat[] = ["halves", "quarters"];

export const PERIOD_FORMAT_LABELS: Record<PeriodFormat, string> = {
  halves: "halves",
  quarters: "quarters",
};

export function isPeriodFormat(value: string): value is PeriodFormat {
  return (PERIOD_FORMATS as readonly string[]).includes(value);
}

/** Regulation period names for a format, in match order. */
export function periodNamesForFormat(
  format: PeriodFormat,
): readonly MatchPeriodName[] {
  return periodNamesForCompetitionPeriods(format === "halves" ? "2" : "4");
}

const QUARTER_NAMES: readonly string[] = periodNamesForFormat("quarters");
const HALF_NAMES: readonly string[] = periodNamesForFormat("halves");
const EXTRA_TIME_NAMES: readonly string[] = ["Extra time 1", "Extra time 2"];

/** Just what the planner needs from a period row. */
export type FormatChangePeriod = {
  id: string;
  name: string;
  sort_order: number;
};

function isRegulationName(name: string): boolean {
  return !isExtraTimeOrPenaltyPeriodName(name);
}

function byMatchOrder<T extends FormatChangePeriod>(
  periods: readonly T[],
): T[] {
  return [...periods].sort(
    (a, b) =>
      matchPeriodSortOrder(a.name) - matchPeriodSortOrder(b.name) ||
      a.sort_order - b.sort_order,
  );
}

/**
 * The format a match is currently recorded in, from its regulation periods
 * (extra time and penalties are ignored). `null` when there are none, or when
 * they are not all quarters or all halves (for example "Single period match").
 */
export function currentPeriodFormat(
  periods: readonly Pick<FormatChangePeriod, "name">[],
): PeriodFormat | null {
  const regulation = periods.map((p) => p.name).filter(isRegulationName);
  if (regulation.length === 0) return null;
  if (regulation.every((name) => QUARTER_NAMES.includes(name))) {
    return "quarters";
  }
  if (regulation.every((name) => HALF_NAMES.includes(name))) return "halves";
  return null;
}

/** The format the "Change period format" action switches this match to. */
export function oppositePeriodFormat(
  format: PeriodFormat | null,
): PeriodFormat | null {
  if (format === "quarters") return "halves";
  if (format === "halves") return "quarters";
  return null;
}

/** An existing period that stays, under its new name. */
export type FormatChangeKeep = {
  periodId: string;
  fromName: string;
  toName: string;
  sortOrder: number;
};

/** An existing period folded into a kept one: its goals move, the row goes. */
export type FormatChangeMerge = {
  periodId: string;
  fromName: string;
  intoPeriodId: string;
  intoName: string;
};

/** A period that does not exist yet. */
export type FormatChangeCreate = {
  name: string;
  sortOrder: number;
};

export type FormatChangePlan = {
  target: PeriodFormat;
  keep: FormatChangeKeep[];
  merge: FormatChangeMerge[];
  create: FormatChangeCreate[];
  /** New periods copy their starting players from this period, if any. */
  copyStartersFrom: string | null;
  /** True when Extra time periods are being used as regulation periods. */
  usesExtraTime: boolean;
};

export type FormatChangeResult =
  { ok: true; plan: FormatChangePlan } | { ok: false; error: string };

/**
 * Extra time periods that could stand in for missing regulation periods.
 * Only relevant when the target format is longer than what is recorded, for
 * example two halves plus two extra periods that were really Q3 and Q4.
 */
export function extraTimeStandInCount(
  periods: readonly FormatChangePeriod[],
  target: PeriodFormat,
): number {
  const regulationCount = periods.filter((p) =>
    isRegulationName(p.name),
  ).length;
  const missing = periodNamesForFormat(target).length - regulationCount;
  if (missing <= 0) return 0;
  const extra = periods.filter((p) => EXTRA_TIME_NAMES.includes(p.name));
  return Math.min(missing, extra.length);
}

/**
 * Maps a match's periods onto another regulation format by position: the nth
 * period recorded becomes the nth period of the new format.
 *
 * - Periods beyond the new format's length (Q3 and Q4 when moving to halves)
 *   merge into the last period of the new format; their goals move with them.
 * - Periods the new format needs that do not exist are created, with the
 *   starting players copied from the last kept period.
 * - With `useExtraTime`, Extra time periods fill the gaps before anything is
 *   created. A penalty shootout is never touched.
 */
export function planFormatChange(
  periods: readonly FormatChangePeriod[],
  target: PeriodFormat,
  options: { useExtraTime?: boolean } = {},
): FormatChangeResult {
  const { useExtraTime = true } = options;
  const current = currentPeriodFormat(periods);

  if (!current) {
    return {
      ok: false,
      error: "This match's periods are not quarters or halves.",
    };
  }
  if (current === target) {
    return { ok: false, error: `This match is already in ${target}.` };
  }

  const targetNames = periodNamesForFormat(target);
  const sequence = byMatchOrder(
    periods.filter((p) => isRegulationName(p.name)),
  );

  let usesExtraTime = false;
  if (useExtraTime) {
    const standIns = extraTimeStandInCount(periods, target);
    if (standIns > 0) {
      const extra = byMatchOrder(
        periods.filter((p) => EXTRA_TIME_NAMES.includes(p.name)),
      ).slice(0, standIns);
      sequence.push(...extra);
      usesExtraTime = true;
    }
  }

  const keepCount = Math.min(sequence.length, targetNames.length);

  const keep: FormatChangeKeep[] = sequence
    .slice(0, keepCount)
    .flatMap((period, index) => {
      const toName = targetNames[index];
      if (!toName) return [];
      return [
        {
          periodId: period.id,
          fromName: period.name,
          toName,
          sortOrder: matchPeriodSortOrder(toName),
        },
      ];
    });

  const lastKept = keep[keep.length - 1];

  const merge: FormatChangeMerge[] = lastKept
    ? sequence.slice(keepCount).map((period) => ({
        periodId: period.id,
        fromName: period.name,
        intoPeriodId: lastKept.periodId,
        intoName: lastKept.toName,
      }))
    : [];

  const create: FormatChangeCreate[] = targetNames
    .slice(sequence.length)
    .map((name) => ({ name, sortOrder: matchPeriodSortOrder(name) }));

  return {
    ok: true,
    plan: {
      target,
      keep,
      merge,
      create,
      copyStartersFrom: lastKept?.periodId ?? null,
      usesExtraTime,
    },
  };
}

/** Goal and starter counts per period, for the preview. */
export type PeriodCounts = Record<
  string,
  { goals: number; starters: number } | undefined
>;

export type FormatChangePreviewRow = {
  /** Existing period name, or null for a period that will be created. */
  from: string | null;
  to: string;
  kind: "keep" | "merge" | "create";
  /** Human note, such as "2 goals move into Second half". */
  note: string;
};

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** One row per period the change touches, in the order the user sees them. */
export function planPreviewRows(
  plan: FormatChangePlan,
  counts: PeriodCounts,
): FormatChangePreviewRow[] {
  const rows: FormatChangePreviewRow[] = [];

  for (const item of plan.keep) {
    const c = counts[item.periodId];
    const unchanged = item.fromName === item.toName;
    rows.push({
      from: item.fromName,
      to: item.toName,
      kind: "keep",
      note: [
        unchanged ? "Unchanged" : "Renamed",
        plural(c?.goals ?? 0, "goal"),
        plural(c?.starters ?? 0, "starter"),
      ].join(", "),
    });
  }

  for (const item of plan.merge) {
    const c = counts[item.periodId];
    const goals = c?.goals ?? 0;
    rows.push({
      from: item.fromName,
      to: item.intoName,
      kind: "merge",
      note:
        goals > 0
          ? `Removed. ${goals} ${goals === 1 ? "goal moves" : "goals move"} into ${item.intoName}`
          : "Removed (no goals)",
    });
  }

  for (const item of plan.create) {
    rows.push({
      from: null,
      to: item.name,
      kind: "create",
      note: plan.copyStartersFrom
        ? "Created, with the same starting players"
        : "Created",
    });
  }

  return rows;
}

/** A one-line summary for the success toast. */
export function formatChangeSuccessMessage(target: PeriodFormat): string {
  return `Changed to ${PERIOD_FORMAT_LABELS[target]}.`;
}
