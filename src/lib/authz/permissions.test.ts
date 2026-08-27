import { describe, expect, it } from "vitest";
import {
  canAccessClubAndPeople,
  canEditLinkedPlayerProfile,
  canEditMatchDay,
  canEditOwnGuardianPlayerLink,
  canEditPersonDetails,
  canEditPlayer,
  canEditTeam,
  canEditTeamHistory,
  canManageGuardianPlayerLinks,
  isGuardianOfPlayer,
  isSelfPerson,
  canManageClub,
  canReadTeam,
  canUpdateGuardianPlayerLink,
  canViewClubTeams,
  canViewPlayerContact,
  hasTeamRole,
  isClubStaff,
  staffTeamIds,
  viewerRoleLabel,
  type ViewerContext,
} from "@/lib/authz/context";
import type { Team } from "@/lib/supabase/database.types";

function team(overrides: Partial<Team> & Pick<Team, "id" | "club_id">): Team {
  return {
    name: "U12 Blues",
    display_name: null,
    age_group: "U12",
    gender: "mixed",
    home_venue_id: null,
    training_venue_id: null,
    training_days: null,
    season_label: "2025/26",
    photo_url: null,
    archived_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function viewer(overrides: Partial<ViewerContext> = {}): ViewerContext {
  return {
    userId: "user-1",
    email: "alex@example.com",
    firstName: "Alex",
    lastName: "Player",
    displayName: "Alex Player",
    managementClubIds: [],
    coachTeamIds: [],
    managementTeamIds: [],
    memberTeamRoles: {},
    guardianPlayerIds: [],
    guardianIds: [],
    selfPlayerIds: [],
    personId: null,
    visibleTeams: [],
    editableTeamIds: [],
    isManagement: false,
    ...overrides,
  };
}

describe("hasTeamRole", () => {
  it("checks roles for a team", () => {
    const ctx = viewer({
      memberTeamRoles: { "team-1": ["coach", "player"] },
    });
    expect(hasTeamRole(ctx, "team-1", "coach")).toBe(true);
    expect(hasTeamRole(ctx, "team-1", "management")).toBe(false);
    expect(hasTeamRole(ctx, "team-2", "coach")).toBe(false);
  });
});

describe("isSelfPerson", () => {
  it("matches the viewer's person id or linked auth user", () => {
    expect(
      isSelfPerson(viewer({ personId: "person-1" }), {
        id: "person-1",
        auth_user_id: null,
      }),
    ).toBe(true);
    expect(
      isSelfPerson(viewer({ userId: "user-1" }), {
        id: "person-9",
        auth_user_id: "user-1",
      }),
    ).toBe(true);
    expect(
      isSelfPerson(viewer({ personId: "person-1", userId: "user-1" }), {
        id: "person-2",
        auth_user_id: "user-2",
      }),
    ).toBe(false);
  });
});

describe("canReadTeam / canEditTeam / canManageClub", () => {
  it("reads from visible and editable team lists", () => {
    const ctx = viewer({
      visibleTeams: [team({ id: "team-1", club_id: "club-1" })],
      editableTeamIds: ["team-1"],
      managementClubIds: ["club-1"],
    });
    expect(canReadTeam(ctx, "team-1")).toBe(true);
    expect(canReadTeam(ctx, "team-2")).toBe(false);
    expect(canEditTeam(ctx, "team-1")).toBe(true);
    expect(canEditTeam(ctx, "team-2")).toBe(false);
    expect(canManageClub(ctx, "club-1")).toBe(true);
    expect(canManageClub(ctx, "club-2")).toBe(false);
  });
});

describe("canEditMatchDay", () => {
  it("allows team editors and guardian assistants, not plain guardians", () => {
    expect(
      canEditMatchDay(viewer({ editableTeamIds: ["team-1"] }), "team-1"),
    ).toBe(true);
    expect(
      canEditMatchDay(
        viewer({ memberTeamRoles: { "team-1": ["guardian_assistant"] } }),
        "team-1",
      ),
    ).toBe(true);
    expect(
      canEditMatchDay(
        viewer({ memberTeamRoles: { "team-1": ["guardian"] } }),
        "team-1",
      ),
    ).toBe(false);
    expect(
      canEditMatchDay(
        viewer({ memberTeamRoles: { "team-1": ["guardian_assistant"] } }),
        "team-2",
      ),
    ).toBe(false);
  });

  it("is false for archived teams", () => {
    const archived = team({
      id: "team-1",
      club_id: "club-1",
      archived_at: "2026-05-01T00:00:00Z",
    });
    const ctx = viewer({
      visibleTeams: [archived],
      editableTeamIds: ["team-1"],
    });
    expect(canEditMatchDay(ctx, "team-1")).toBe(false);
    expect(canEditTeam(ctx, "team-1")).toBe(true);
    expect(canEditTeamHistory(ctx, "team-1")).toBe(false);
  });
});

describe("isClubStaff", () => {
  it("treats club managers as staff", () => {
    expect(
      isClubStaff(viewer({ managementClubIds: ["club-1"] }), "club-1"),
    ).toBe(true);
  });

  it("treats coaches and team managers in the club as staff", () => {
    const clubTeam = team({ id: "team-1", club_id: "club-1" });
    expect(
      isClubStaff(
        viewer({ visibleTeams: [clubTeam], coachTeamIds: ["team-1"] }),
        "club-1",
      ),
    ).toBe(true);
    expect(
      isClubStaff(
        viewer({
          visibleTeams: [clubTeam],
          managementTeamIds: ["team-1"],
        }),
        "club-1",
      ),
    ).toBe(true);
  });

  it("returns false for outsiders", () => {
    expect(
      isClubStaff(
        viewer({
          visibleTeams: [team({ id: "team-1", club_id: "club-2" })],
          coachTeamIds: ["team-1"],
        }),
        "club-1",
      ),
    ).toBe(false);
  });
});

describe("canEditPlayer / canViewPlayerContact", () => {
  it("allows club managers and coaches of the player's teams to edit", () => {
    expect(
      canEditPlayer(viewer({ managementClubIds: ["club-1"] }), "club-1", [
        "team-9",
      ]),
    ).toBe(true);
    expect(
      canEditPlayer(viewer({ editableTeamIds: ["team-1"] }), "club-1", [
        "team-1",
      ]),
    ).toBe(true);
    expect(
      canEditPlayer(viewer({ editableTeamIds: ["team-2"] }), "club-1", [
        "team-1",
      ]),
    ).toBe(false);
  });

  it("allows editors, linked guardians, and the player to view contact", () => {
    expect(
      canViewPlayerContact(
        viewer({ editableTeamIds: ["team-1"] }),
        "player-1",
        "club-1",
        ["team-1"],
      ),
    ).toBe(true);
    expect(
      canViewPlayerContact(
        viewer({ guardianPlayerIds: ["player-1"] }),
        "player-1",
        "club-1",
        ["team-1"],
      ),
    ).toBe(true);
    expect(
      canViewPlayerContact(
        viewer({ selfPlayerIds: ["player-1"] }),
        "player-1",
        "club-1",
        ["team-1"],
      ),
    ).toBe(true);
    expect(
      canViewPlayerContact(viewer(), "player-1", "club-1", ["team-1"]),
    ).toBe(false);
  });
});

describe("canEditPersonDetails / canEditLinkedPlayerProfile", () => {
  it("lets a person edit their own name and contact details", () => {
    expect(
      canEditPersonDetails(
        viewer({ personId: "person-1" }),
        { id: "person-1", auth_user_id: null },
        null,
        "club-1",
      ),
    ).toBe(true);
  });

  it("lets a club manager edit person details and linked player profile", () => {
    const ctx = viewer({ managementClubIds: ["club-1"], isManagement: true });
    expect(
      canEditPersonDetails(
        ctx,
        { id: "other", auth_user_id: null },
        "player-1",
        "club-1",
      ),
    ).toBe(true);
    expect(canEditLinkedPlayerProfile(ctx, "player-1", "club-1")).toBe(true);
    expect(
      canEditPersonDetails(
        viewer(),
        { id: "other", auth_user_id: null },
        null,
        null,
      ),
    ).toBe(false);
  });

  it("lets a guardian edit a linked player's person details and profile", () => {
    const ctx = viewer({ guardianPlayerIds: ["player-1"] });
    expect(
      canEditPersonDetails(
        ctx,
        { id: "kid", auth_user_id: null },
        "player-1",
        "club-1",
      ),
    ).toBe(true);
    expect(canEditLinkedPlayerProfile(ctx, "player-1", "club-1")).toBe(true);
    expect(
      canEditPersonDetails(
        ctx,
        { id: "other", auth_user_id: null },
        "player-2",
        "club-1",
      ),
    ).toBe(false);
    expect(canEditLinkedPlayerProfile(ctx, "player-2", "club-1")).toBe(false);
  });

  it("does not let a player edit their own DOB or school via the guardian path", () => {
    expect(
      canEditLinkedPlayerProfile(
        viewer({ personId: "person-1", selfPlayerIds: ["player-1"] }),
        "player-1",
        "club-1",
      ),
    ).toBe(false);
  });

  it("identifies guardians of a player", () => {
    expect(
      isGuardianOfPlayer(
        viewer({ guardianPlayerIds: ["player-1"] }),
        "player-1",
      ),
    ).toBe(true);
    expect(isGuardianOfPlayer(viewer(), "player-1")).toBe(false);
  });
});

describe("canManageGuardianPlayerLinks / canEditOwnGuardianPlayerLink", () => {
  it("lets club staff and team coaches manage guardian links", () => {
    expect(
      canManageGuardianPlayerLinks(
        viewer({ managementClubIds: ["club-1"], isManagement: true }),
        "club-1",
        [],
      ),
    ).toBe(true);
    expect(
      canManageGuardianPlayerLinks(
        viewer({ editableTeamIds: ["team-1"] }),
        "club-1",
        ["team-1"],
      ),
    ).toBe(true);
    expect(canManageGuardianPlayerLinks(viewer(), "club-1", ["team-1"])).toBe(
      false,
    );
  });

  it("lets a linked guardian edit their own link but not manage links", () => {
    const ctx = viewer({
      guardianPlayerIds: ["player-1"],
      guardianIds: ["guardian-1"],
    });
    expect(canManageGuardianPlayerLinks(ctx, "club-1", [])).toBe(false);
    expect(canEditOwnGuardianPlayerLink(ctx, "player-1", "guardian-1")).toBe(
      true,
    );
    expect(canEditOwnGuardianPlayerLink(ctx, "player-1", "guardian-2")).toBe(
      false,
    );
    expect(canEditOwnGuardianPlayerLink(ctx, "player-2", "guardian-1")).toBe(
      false,
    );
    expect(
      canUpdateGuardianPlayerLink(ctx, "player-1", "guardian-1", "club-1", []),
    ).toBe(true);
  });

  it("prefers staff manage permission over guardian self-edit", () => {
    expect(
      canUpdateGuardianPlayerLink(
        viewer({ managementClubIds: ["club-1"], isManagement: true }),
        "player-1",
        "guardian-9",
        "club-1",
        [],
      ),
    ).toBe(true);
  });

  it("does not let an unrelated viewer update a guardian link", () => {
    expect(
      canUpdateGuardianPlayerLink(
        viewer(),
        "player-1",
        "guardian-1",
        "club-1",
        ["team-1"],
      ),
    ).toBe(false);
    expect(
      canUpdateGuardianPlayerLink(
        viewer({
          guardianPlayerIds: ["player-2"],
          guardianIds: ["guardian-1"],
        }),
        "player-1",
        "guardian-1",
        "club-1",
        [],
      ),
    ).toBe(false);
  });
});

describe("canAccessClubAndPeople / canViewClubTeams", () => {
  it("allows club managers, coaches, and guardians", () => {
    expect(canAccessClubAndPeople(viewer({ isManagement: true }))).toBe(true);
    expect(canAccessClubAndPeople(viewer({ coachTeamIds: ["team-1"] }))).toBe(
      true,
    );
    expect(
      canAccessClubAndPeople(viewer({ guardianPlayerIds: ["player-1"] })),
    ).toBe(true);
    expect(
      canAccessClubAndPeople(
        viewer({ memberTeamRoles: { "team-1": ["guardian_assistant"] } }),
      ),
    ).toBe(true);
    expect(canAccessClubAndPeople(viewer())).toBe(false);
    expect(
      canAccessClubAndPeople(
        viewer({ memberTeamRoles: { "team-1": ["player"] } }),
      ),
    ).toBe(false);
  });

  it("shows the teams card to club managers and club staff, not guardians", () => {
    const clubTeam = team({ id: "team-1", club_id: "club-1" });
    expect(
      canViewClubTeams(viewer({ managementClubIds: ["club-1"] }), "club-1"),
    ).toBe(true);
    expect(
      canViewClubTeams(
        viewer({ visibleTeams: [clubTeam], coachTeamIds: ["team-1"] }),
        "club-1",
      ),
    ).toBe(true);
    expect(
      canViewClubTeams(viewer({ guardianPlayerIds: ["player-1"] }), "club-1"),
    ).toBe(false);
  });

  it("collects staff team ids from coach and team-management roles", () => {
    expect(
      staffTeamIds(
        viewer({
          coachTeamIds: ["team-1", "team-2"],
          managementTeamIds: ["team-2", "team-3"],
        }),
      ),
    ).toEqual(["team-1", "team-2", "team-3"]);
  });
});

describe("viewerRoleLabel", () => {
  it("prefers the highest available role label", () => {
    expect(viewerRoleLabel(viewer({ isManagement: true }))).toBe("Management");
    expect(viewerRoleLabel(viewer({ coachTeamIds: ["team-1"] }))).toBe("Coach");
    expect(viewerRoleLabel(viewer({ guardianPlayerIds: ["p1"] }))).toBe(
      "Guardian",
    );
    expect(viewerRoleLabel(viewer({ selfPlayerIds: ["p1"] }))).toBe("Player");
    expect(
      viewerRoleLabel(
        viewer({ memberTeamRoles: { "team-1": ["guardian_assistant"] } }),
      ),
    ).toBe("Guardian");
    expect(
      viewerRoleLabel(viewer({ memberTeamRoles: { "team-1": ["player"] } })),
    ).toBe("Player");
    expect(viewerRoleLabel(viewer())).toBe("Member");
  });
});
