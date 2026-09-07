import { COMPETITION_KINDS } from "@/lib/constants";
import type { CompetitionKind } from "@/lib/supabase/database.types";

export type StatCompetitionRef = {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly: boolean;
};

export type CompetitionFilterOption = {
  id: string;
  name: string;
  kind: CompetitionKind | null;
};

export const ALL_COMPETITIONS = "all";
export const ALL_COMPETITION_KINDS = "all";
export const NO_COMPETITION = "none";
/** @deprecated Friendly fixtures are filtered via competition type. */
export const FRIENDLY_MATCHES = "friendly";
/** Competition-type filter for friendly fixtures. */
export const FRIENDLY_KIND = "friendly";
/** League and cup competitions (excludes tournaments, other, friendlies). */
export const ALL_LEAGUE_AND_CUP = "league_and_cup";
/** League, cup, and tournament competitions (excludes other and friendlies). */
export const ALL_COMPETITIVE = "competitive";

export const COMPETITION_KIND_FILTER_OPTIONS = COMPETITION_KINDS;

const LEAGUE_AND_CUP_KINDS = new Set<CompetitionKind>(["league", "cup"]);
const COMPETITIVE_KINDS = new Set<CompetitionKind>([
  "league",
  "cup",
  "tournament",
]);

function matchesCompetitionKindFilter(
  competitionKind: CompetitionKind | null,
  selectedCompetitionKind: string,
): boolean {
  if (selectedCompetitionKind === ALL_COMPETITION_KINDS) return true;
  if (selectedCompetitionKind === ALL_LEAGUE_AND_CUP) {
    return competitionKind != null && LEAGUE_AND_CUP_KINDS.has(competitionKind);
  }
  if (selectedCompetitionKind === ALL_COMPETITIVE) {
    return competitionKind != null && COMPETITIVE_KINDS.has(competitionKind);
  }
  return competitionKind === selectedCompetitionKind;
}

export function matchesCompetitionFilters(input: {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly?: boolean;
  selectedCompetitionId: string;
  selectedCompetitionKind: string;
}): boolean {
  const isFriendly = input.isFriendly === true;

  if (
    input.selectedCompetitionId === FRIENDLY_MATCHES ||
    input.selectedCompetitionKind === FRIENDLY_KIND
  ) {
    return isFriendly;
  }

  if (isFriendly) {
    if (input.selectedCompetitionId !== ALL_COMPETITIONS) return false;
    if (input.selectedCompetitionKind !== ALL_COMPETITION_KINDS) return false;
    return true;
  }

  if (input.selectedCompetitionId === NO_COMPETITION) {
    if (input.competitionId != null) return false;
  } else if (input.selectedCompetitionId !== ALL_COMPETITIONS) {
    if (input.competitionId !== input.selectedCompetitionId) return false;
  }

  return matchesCompetitionKindFilter(
    input.competitionKind,
    input.selectedCompetitionKind,
  );
}

export function filterStatCompetitions(
  events: StatCompetitionRef[],
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
): StatCompetitionRef[] {
  return events.filter((event) =>
    matchesCompetitionFilters({
      competitionId: event.competitionId,
      competitionKind: event.competitionKind,
      isFriendly: event.isFriendly,
      selectedCompetitionId,
      selectedCompetitionKind,
    }),
  );
}

export function hasCompetitionFilter(
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
): boolean {
  return (
    selectedCompetitionId !== ALL_COMPETITIONS ||
    selectedCompetitionKind !== ALL_COMPETITION_KINDS
  );
}
