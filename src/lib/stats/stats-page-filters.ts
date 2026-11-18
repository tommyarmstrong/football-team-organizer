import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
  FRIENDLY_KIND,
  NO_COMPETITION,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";
import {
  GOALS_POSITION_FILTERS,
  toggleGoalsPositionFilter,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";

/** Saved on the Stats page and restored when the coach comes back to it. */
export type StatsFilterSelection = {
  competitionId: string;
  competitionKind: string;
  positions: GoalsPositionFilter[];
};

export const STATS_FILTERS_STORAGE_KEY = "fto-stats-filters";

/**
 * League and cup stays the page default, matching the previous Stats filters.
 * Friendlies and other competitions stay out until the coach asks for them.
 */
export function defaultStatsFilters(): StatsFilterSelection {
  return {
    competitionId: ALL_COMPETITIONS,
    competitionKind: ALL_LEAGUE_AND_CUP,
    positions: ["ALL"],
  };
}

export const STATS_COMPETITION_TYPE_OPTIONS = [
  { value: ALL_COMPETITION_KINDS, label: "All types" },
  { value: ALL_LEAGUE_AND_CUP, label: "League and Cup" },
  { value: FRIENDLY_KIND, label: "Friendlies" },
] as const;

export const STATS_POSITION_OPTIONS: ReadonlyArray<{
  value: GoalsPositionFilter;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "FWD", label: "FWD" },
  { value: "WNG", label: "WNG" },
  { value: "MID", label: "MID" },
  { value: "DEF", label: "DEF" },
  { value: "GK", label: "GK" },
];

const COMPETITION_TYPE_VALUES = new Set<string>(
  STATS_COMPETITION_TYPE_OPTIONS.map((option) => option.value),
);

export type StatsFilterChip = {
  id: string;
  label: string;
};

function isPosition(value: unknown): value is GoalsPositionFilter {
  return (
    typeof value === "string" &&
    (GOALS_POSITION_FILTERS as readonly string[]).includes(value)
  );
}

function sanitizePositions(value: unknown): GoalsPositionFilter[] {
  if (!Array.isArray(value)) return ["ALL"];
  const picked = new Set(
    value.filter(
      (item): item is Exclude<GoalsPositionFilter, "ALL"> =>
        isPosition(item) && item !== "ALL",
    ),
  );
  const ordered = GOALS_POSITION_FILTERS.filter(
    (position): position is Exclude<GoalsPositionFilter, "ALL"> =>
      position !== "ALL" && picked.has(position),
  );
  return ordered.length === 0 ? ["ALL"] : ordered;
}

/**
 * Drops a competition that does not belong to the current team or season.
 * Position and the three competition types stay, because they are not tied
 * to one competition id.
 */
export function sanitizeStatsFilters(
  value: unknown,
  competitions: readonly CompetitionFilterOption[],
): StatsFilterSelection {
  const defaults = defaultStatsFilters();
  if (!value || typeof value !== "object") return defaults;
  const raw = value as Partial<StatsFilterSelection>;

  const competitionId =
    typeof raw.competitionId === "string"
      ? raw.competitionId
      : defaults.competitionId;
  const competitionKnown =
    competitionId === ALL_COMPETITIONS ||
    competitionId === NO_COMPETITION ||
    competitions.some((competition) => competition.id === competitionId);

  const competitionKind =
    typeof raw.competitionKind === "string" &&
    COMPETITION_TYPE_VALUES.has(raw.competitionKind)
      ? raw.competitionKind
      : defaults.competitionKind;

  return {
    competitionId: competitionKnown ? competitionId : ALL_COMPETITIONS,
    competitionKind,
    positions: sanitizePositions(raw.positions),
  };
}

export function statsFiltersEqual(
  left: StatsFilterSelection,
  right: StatsFilterSelection,
): boolean {
  return (
    left.competitionId === right.competitionId &&
    left.competitionKind === right.competitionKind &&
    left.positions.length === right.positions.length &&
    left.positions.every(
      (position, index) => position === right.positions[index],
    )
  );
}

function competitionChipLabel(
  competitionId: string,
  competitions: readonly CompetitionFilterOption[],
): string {
  if (competitionId === NO_COMPETITION) return "Unknown competitions";
  return (
    competitions.find((competition) => competition.id === competitionId)
      ?.name ?? "Competition"
  );
}

/** Chips for filters that are not the page default. */
export function statsFilterChips(
  filters: StatsFilterSelection,
  competitions: readonly CompetitionFilterOption[],
): StatsFilterChip[] {
  const defaults = defaultStatsFilters();
  const chips: StatsFilterChip[] = [];

  if (filters.competitionId !== defaults.competitionId) {
    chips.push({
      id: "competition",
      label: competitionChipLabel(filters.competitionId, competitions),
    });
  }

  if (filters.competitionKind !== defaults.competitionKind) {
    const label = STATS_COMPETITION_TYPE_OPTIONS.find(
      (option) => option.value === filters.competitionKind,
    )?.label;
    if (label) chips.push({ id: "type", label });
  }

  if (!filters.positions.includes("ALL")) {
    for (const position of filters.positions) {
      chips.push({ id: `position:${position}`, label: position });
    }
  }

  return chips;
}

export function statsFiltersAreCustom(
  filters: StatsFilterSelection,
  competitions: readonly CompetitionFilterOption[],
): boolean {
  return statsFilterChips(filters, competitions).length > 0;
}

/** Returns the selection with one chip's filter put back to its default. */
export function clearStatsFilterChip(
  filters: StatsFilterSelection,
  chipId: string,
): StatsFilterSelection {
  const defaults = defaultStatsFilters();
  if (chipId === "competition") {
    return { ...filters, competitionId: defaults.competitionId };
  }
  if (chipId === "type") {
    return { ...filters, competitionKind: defaults.competitionKind };
  }
  if (chipId.startsWith("position:")) {
    const position = chipId.slice("position:".length);
    if (!isPosition(position) || position === "ALL") return filters;
    return {
      ...filters,
      positions: toggleGoalsPositionFilter(filters.positions, position),
    };
  }
  return filters;
}

type FilterStorage = Pick<Storage, "getItem" | "setItem">;

function readStore(storage: FilterStorage): Record<string, unknown> {
  const raw = storage.getItem(STATS_FILTERS_STORAGE_KEY);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return parsed as Record<string, unknown>;
}

/**
 * Filters for this team. A different team or season has its own entry, and a
 * competition id that team does not have is dropped.
 */
export function readStoredStatsFilters(
  storage: FilterStorage,
  teamId: string,
  competitions: readonly CompetitionFilterOption[],
): StatsFilterSelection {
  try {
    return sanitizeStatsFilters(readStore(storage)[teamId], competitions);
  } catch {
    return defaultStatsFilters();
  }
}

export function writeStoredStatsFilters(
  storage: FilterStorage,
  teamId: string,
  filters: StatsFilterSelection,
): void {
  try {
    const store = readStore(storage);
    store[teamId] = filters;
    storage.setItem(STATS_FILTERS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode and a full quota should not block the page.
  }
}
