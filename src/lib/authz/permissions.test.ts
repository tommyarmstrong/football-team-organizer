import { describe, expect, it } from "vitest";
import {
  canEditPlayer,
  canEditTeam,
  canManageClub,
  canReadTeam,
  canViewPlayerContact,
  hasTeamRole,
  isClubStaff,
  viewerRoleLabel,
  type ViewerContext,
} from "@/lib/authz/context";
import type { Team } from "@/lib/supabase/database.types";

function team(overrides: Partial<Team> & Pick<Team, "id" | "club_id">): Team {
  return {
    name: "U12 Blues",
    age_group: "U12",
    gender: "mixed",
    home_venue_id: null,
    training_venue_id: null,
    training_days: null,
    season_label: "2025/26",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function viewer(overrides: Partial<ViewerContext> = {}): ViewerContext {
  return {
    userId: "user-1",
    email: "alex@example.com",
    displayName: "Alex",
    managementClubIds: [],
    coachTeamIds: [],
    managementTeamIds: [],
    memberTeamRoles: {},
    guardianPlayerIds: [],
    selfPlayerIds: [],
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
