import { describe, expect, it } from "vitest";
import type { ViewerContext } from "@/lib/authz/context";
import type { Team } from "@/lib/supabase/database.types";
import {
  directoryDescription,
  filterPeopleDirectory,
  isPersonVisibleInDirectory,
  redactDirectoryEmergencyContact,
  type PersonDirectoryVisibility,
} from "@/lib/people/directory";

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
    selfPlayerIds: [],
    personId: null,
    visibleTeams: [],
    editableTeamIds: [],
    isManagement: false,
    ...overrides,
  };
}

function person(
  overrides: Partial<PersonDirectoryVisibility> & { id?: string } = {},
): PersonDirectoryVisibility & {
  id: string;
  emergency_contact: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
} {
  const { id = "person-1", ...rest } = overrides;
  return {
    id,
    auth_user_id: null,
    roles: {
      player: false,
      guardian: false,
      coach: false,
      manager: false,
    },
    playerIds: [],
    playerTeamIds: [],
    linkedPlayerIds: [],
    linkedPlayerTeamIds: [],
    emergency_contact: null,
    ...rest,
  };
}

describe("isPersonVisibleInDirectory", () => {
  it("lets club managers see everyone", () => {
    const ctx = viewer({ managementClubIds: ["club-1"] });
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: true,
            guardian: false,
            coach: false,
            manager: false,
          },
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
  });

  it("lets guardians see themselves and linked players only", () => {
    const ctx = viewer({
      userId: "guardian-user",
      personId: "guardian-person",
      guardianPlayerIds: ["player-1"],
    });
    expect(
      isPersonVisibleInDirectory(
        person({ id: "guardian-person", auth_user_id: null }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({ auth_user_id: "guardian-user" }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          id: "kid",
          roles: {
            player: true,
            guardian: false,
            coach: false,
            manager: false,
          },
          playerIds: ["player-1"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          id: "teammate",
          roles: {
            player: true,
            guardian: false,
            coach: false,
            manager: false,
          },
          playerIds: ["player-2"],
          playerTeamIds: ["team-1"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(false);
    expect(
      isPersonVisibleInDirectory(
        person({
          id: "coach",
          roles: {
            player: false,
            guardian: false,
            coach: true,
            manager: false,
          },
        }),
        ctx,
        "club-1",
      ),
    ).toBe(false);
  });

  it("lets coaches see self, coaches, managers, own-team players, and their guardians", () => {
    const ctx = viewer({
      userId: "coach-user",
      coachTeamIds: ["team-1"],
      visibleTeams: [team({ id: "team-1", club_id: "club-1" })],
    });

    expect(
      isPersonVisibleInDirectory(
        person({ auth_user_id: "coach-user" }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: false,
            guardian: false,
            coach: true,
            manager: false,
          },
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: false,
            guardian: false,
            coach: false,
            manager: true,
          },
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: true,
            guardian: false,
            coach: false,
            manager: false,
          },
          playerIds: ["player-1"],
          playerTeamIds: ["team-1"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: true,
            guardian: false,
            coach: false,
            manager: false,
          },
          playerIds: ["player-9"],
          playerTeamIds: ["team-other"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(false);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: false,
            guardian: true,
            coach: false,
            manager: false,
          },
          linkedPlayerIds: ["player-1"],
          linkedPlayerTeamIds: ["team-1"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(true);
    expect(
      isPersonVisibleInDirectory(
        person({
          roles: {
            player: false,
            guardian: true,
            coach: false,
            manager: false,
          },
          linkedPlayerIds: ["player-9"],
          linkedPlayerTeamIds: ["team-other"],
        }),
        ctx,
        "club-1",
      ),
    ).toBe(false);
  });
});

describe("filterPeopleDirectory", () => {
  it("keeps the union of coach and guardian visibility for dual-role viewers", () => {
    const ctx = viewer({
      userId: "dual-user",
      coachTeamIds: ["team-1"],
      guardianPlayerIds: ["player-home"],
    });
    const people = [
      person({ id: "self", auth_user_id: "dual-user" }),
      person({
        id: "own-kid",
        roles: { player: true, guardian: false, coach: false, manager: false },
        playerIds: ["player-home"],
      }),
      person({
        id: "squad-player",
        roles: { player: true, guardian: false, coach: false, manager: false },
        playerIds: ["player-squad"],
        playerTeamIds: ["team-1"],
      }),
      person({
        id: "other-kid",
        roles: { player: true, guardian: false, coach: false, manager: false },
        playerIds: ["player-other"],
        playerTeamIds: ["team-other"],
      }),
    ];
    expect(
      filterPeopleDirectory(people, ctx, "club-1").map((row) => row.id),
    ).toEqual(["self", "own-kid", "squad-player"]);
  });
});

describe("redactDirectoryEmergencyContact", () => {
  it("keeps emergency contact only when the viewer may see player contact", () => {
    const contact = {
      first_name: "Pat",
      last_name: "Parent",
      phone: "07123",
    };
    const row = person({
      roles: { player: true, guardian: false, coach: false, manager: false },
      playerIds: ["player-1"],
      playerTeamIds: ["team-1"],
      emergency_contact: contact,
    });
    expect(
      redactDirectoryEmergencyContact(
        row,
        viewer({ guardianPlayerIds: ["player-1"] }),
        "club-1",
      ).emergency_contact,
    ).toEqual(contact);
    expect(
      redactDirectoryEmergencyContact(row, viewer(), "club-1")
        .emergency_contact,
    ).toBeNull();
  });
});

describe("directoryDescription", () => {
  it("describes the directory for each viewer type", () => {
    expect(
      directoryDescription(
        viewer({ managementClubIds: ["club-1"] }),
        "club-1",
        "Riverside",
      ),
    ).toBe("All players, coaches, guardians, and managers at Riverside.");
    expect(
      directoryDescription(
        viewer({ coachTeamIds: ["team-1"] }),
        "club-1",
        "Riverside",
      ),
    ).toBe("Coaches, managers, and people linked to your teams at Riverside.");
    expect(
      directoryDescription(
        viewer({ guardianPlayerIds: ["player-1"] }),
        "club-1",
        "Riverside",
      ),
    ).toBe("Your account and linked players at Riverside.");
  });
});
