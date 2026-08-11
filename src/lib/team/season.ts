import type { Team } from "@/lib/supabase/database.types";

/** True when this season's team record has been archived. */
export function isTeamArchived(team: Pick<Team, "archived_at">): boolean {
  return team.archived_at != null;
}

/** Active seasons first, then name, then newer season labels. */
export function sortTeamsForDisplay(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const aArchived = isTeamArchived(a) ? 1 : 0;
    const bArchived = isTeamArchived(b) ? 1 : 0;
    if (aArchived !== bArchived) return aArchived - bArchived;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return b.season_label.localeCompare(a.season_label);
  });
}
