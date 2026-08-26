import { COMPETITION_KINDS } from "@/lib/constants";
import type { CompetitionKind } from "@/lib/supabase/database.types";

export type CompetitionFilterOption = {
  id: string;
  name: string;
  kind: CompetitionKind | null;
};

export const ALL_COMPETITIONS = "all";
export const ALL_COMPETITION_KINDS = "all";
export const NO_COMPETITION = "none";
/** Stats competitions filter value for friendly fixtures. */
export const FRIENDLY_MATCHES = "friendly";
/** Locked competition-type display when filtering friendlies. */
export const FRIENDLY_KIND = "friendly";

export const COMPETITION_KIND_FILTER_OPTIONS = COMPETITION_KINDS;

export function matchesCompetitionFilters(input: {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly?: boolean;
  selectedCompetitionId: string;
  selectedCompetitionKind: string;
}): boolean {
  const isFriendly = input.isFriendly === true;

  if (input.selectedCompetitionId === FRIENDLY_MATCHES) {
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

  if (input.selectedCompetitionKind !== ALL_COMPETITION_KINDS) {
    if (input.competitionKind !== input.selectedCompetitionKind) return false;
  }

  return true;
}
