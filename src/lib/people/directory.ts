import {
  canManageClub,
  canViewPlayerContact,
  isSelfPerson,
  staffTeamIds,
  type ViewerContext,
} from "@/lib/authz/context";

export type PersonDirectoryRoles = {
  player: boolean;
  guardian: boolean;
  coach: boolean;
  manager: boolean;
};

export type PersonDirectoryVisibility = {
  id: string;
  auth_user_id: string | null;
  roles: PersonDirectoryRoles;
  playerIds: string[];
  playerTeamIds: string[];
  linkedPlayerIds: string[];
  linkedPlayerTeamIds: string[];
};

export function isCoachDirectoryViewer(ctx: ViewerContext): boolean {
  return staffTeamIds(ctx).length > 0;
}

export function isGuardianDirectoryViewer(ctx: ViewerContext): boolean {
  if (ctx.guardianPlayerIds.length > 0) return true;
  const roles = Object.values(ctx.memberTeamRoles).flat();
  return roles.includes("guardian") || roles.includes("guardian_assistant");
}

export function isPersonVisibleInDirectory(
  person: PersonDirectoryVisibility,
  ctx: ViewerContext,
  clubId: string,
): boolean {
  if (canManageClub(ctx, clubId)) return true;

  const self = isSelfPerson(ctx, person);
  const coachViewer = isCoachDirectoryViewer(ctx);
  const guardianViewer = isGuardianDirectoryViewer(ctx);

  if (self && (coachViewer || guardianViewer)) return true;

  if (
    guardianViewer &&
    person.playerIds.some((id) => ctx.guardianPlayerIds.includes(id))
  ) {
    return true;
  }

  if (coachViewer) {
    if (person.roles.coach || person.roles.manager) return true;
    const staffTeams = new Set(staffTeamIds(ctx));
    if (person.playerTeamIds.some((id) => staffTeams.has(id))) return true;
    if (person.linkedPlayerTeamIds.some((id) => staffTeams.has(id))) {
      return true;
    }
  }

  return false;
}

export function filterPeopleDirectory<T extends PersonDirectoryVisibility>(
  people: T[],
  ctx: ViewerContext,
  clubId: string,
): T[] {
  return people.filter((person) =>
    isPersonVisibleInDirectory(person, ctx, clubId),
  );
}

export function redactDirectoryEmergencyContact<
  T extends PersonDirectoryVisibility & {
    emergency_contact: unknown;
  },
>(person: T, ctx: ViewerContext, clubId: string): T {
  const canView = person.playerIds.some((playerId) =>
    canViewPlayerContact(ctx, playerId, clubId, person.playerTeamIds),
  );
  if (canView) return person;
  return { ...person, emergency_contact: null };
}

export function directoryDescription(
  ctx: ViewerContext,
  clubId: string,
  clubName: string,
): string {
  if (canManageClub(ctx, clubId)) {
    return `All players, coaches, guardians, and managers at ${clubName}.`;
  }
  const coachViewer = isCoachDirectoryViewer(ctx);
  const guardianViewer = isGuardianDirectoryViewer(ctx);
  if (coachViewer && guardianViewer) {
    return `Your account, linked players, coaches, managers, and people linked to your teams at ${clubName}.`;
  }
  if (coachViewer) {
    return `Coaches, managers, and people linked to your teams at ${clubName}.`;
  }
  return `Your account and linked players at ${clubName}.`;
}
