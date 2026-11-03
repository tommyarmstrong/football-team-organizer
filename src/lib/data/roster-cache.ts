import { updateTag } from "next/cache";

/**
 * Cache tags for the cross-request roster cache in `listRosterForTeam`.
 *
 * Every cached roster carries two tags:
 * - `roster:<teamId>` for changes to one team's squad (add, remove, shirt).
 * - `rosters` for changes to a person or player that appear on any roster
 *   (name, position, active role). A person can be on several teams, and the
 *   editor may not be able to see all of them through RLS, so those changes
 *   invalidate every cached roster instead of looking up teams.
 */
export const ALL_ROSTERS_TAG = "rosters";

export function rosterTag(teamId: string): string {
  return `roster:${teamId}`;
}

export function rosterCacheTags(teamId: string): string[] {
  return [rosterTag(teamId), ALL_ROSTERS_TAG];
}

/** Server Actions only (`updateTag`). Call after a squad membership change. */
export function invalidateRoster(teamId: string): void {
  updateTag(rosterTag(teamId));
}

/**
 * Server Actions only (`updateTag`). Call after any person or player change
 * that shows on a roster: name, position, or active role.
 */
export function invalidateAllRosters(): void {
  updateTag(ALL_ROSTERS_TAG);
}
