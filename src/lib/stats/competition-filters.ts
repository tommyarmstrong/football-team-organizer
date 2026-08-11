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

export const COMPETITION_KIND_FILTER_OPTIONS = COMPETITION_KINDS;

export function matchesCompetitionFilters(input: {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  selectedCompetitionId: string;
  selectedCompetitionKind: string;
}): boolean {
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
