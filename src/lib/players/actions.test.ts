import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { teamFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getActiveTeamMock,
  resolveStaffClubIdMock,
  createPlayerMock,
  updatePlayerMock,
  deletePlayerMock,
  getPlayerMock,
  addPlayerToTeamMock,
  removePlayerFromTeamMock,
  updateRosterEntryMock,
  upsertPlayerContactMock,
  syncEmergencyMock,
  createPlayerObjectiveMock,
  updatePlayerObjectiveMock,
  deletePlayerObjectiveMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getActiveTeamMock: vi.fn(),
  resolveStaffClubIdMock: vi.fn(),
  createPlayerMock: vi.fn(),
  updatePlayerMock: vi.fn(),
  deletePlayerMock: vi.fn(),
  getPlayerMock: vi.fn(),
  addPlayerToTeamMock: vi.fn(),
  removePlayerFromTeamMock: vi.fn(),
  updateRosterEntryMock: vi.fn(),
  upsertPlayerContactMock: vi.fn(),
  syncEmergencyMock: vi.fn(),
  createPlayerObjectiveMock: vi.fn(),
  updatePlayerObjectiveMock: vi.fn(),
  deletePlayerObjectiveMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));
vi.mock("@/lib/data/clubs", () => ({
  resolveStaffClubId: resolveStaffClubIdMock,
}));
vi.mock("@/lib/data/players", () => ({
  createPlayer: createPlayerMock,
  updatePlayer: updatePlayerMock,
  deletePlayer: deletePlayerMock,
  getPlayer: getPlayerMock,
  addPlayerToTeam: addPlayerToTeamMock,
  removePlayerFromTeam: removePlayerFromTeamMock,
  updateRosterEntry: updateRosterEntryMock,
  upsertPlayerContact: upsertPlayerContactMock,
}));
vi.mock("@/lib/data/guardians", () => ({
  syncEmergencyContactFlagFromGuardianId: syncEmergencyMock,
}));
vi.mock("@/lib/data/player-objectives", () => ({
  createPlayerObjective: createPlayerObjectiveMock,
  updatePlayerObjective: updatePlayerObjectiveMock,
  deletePlayerObjective: deletePlayerObjectiveMock,
}));

import {
  addPlayerToTeamAction,
  addRosterPlayerAction,
  createPlayerAction,
  createRosterPlayerAction,
  deletePlayerAction,
  savePlayerContactAction,
  updatePlayerAction,
  updateRosterEntryAction,
} from "@/lib/players/actions";

describe("createPlayerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    resolveStaffClubIdMock.mockResolvedValue("club-1");
  });

  it("requires a club", async () => {
    resolveStaffClubIdMock.mockResolvedValue(null);
    const result = await createPlayerAction(
      {},
      formDataFrom({ first_name: "Sam", last_name: "Striker" }),
    );
    expect(result.error).toMatch(/no club/i);
  });

  it("requires names", async () => {
    const result = await createPlayerAction(
      {},
      formDataFrom({ first_name: "Sam" }),
    );
    expect(result.error).toMatch(/first and last name/i);
  });

  it("creates and redirects to the person page", async () => {
    createPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1" },
      error: null,
    });
    await expect(
      createPlayerAction(
        {},
        formDataFrom({ first_name: "Sam", last_name: "Striker" }),
      ),
    ).rejects.toThrow("redirect:/people/person-1");
  });
});

describe("updatePlayerAction / deletePlayerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1" },
      error: null,
    });
    updatePlayerMock.mockResolvedValue({ error: null });
    deletePlayerMock.mockResolvedValue({ error: null });
  });

  it("updates a player", async () => {
    const result = await updatePlayerAction(
      "player-1",
      {},
      formDataFrom({ first_name: "Sam", last_name: "Striker" }),
    );
    expect(result.success).toMatch(/saved/i);
  });

  it("deletes and redirects to the person", async () => {
    await expect(deletePlayerAction("player-1")).rejects.toThrow(
      "redirect:/people/person-1",
    );
  });
});

describe("savePlayerContactAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertPlayerContactMock.mockResolvedValue({ error: null });
    syncEmergencyMock.mockResolvedValue({ error: null });
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1" },
      error: null,
    });
  });

  it("saves contact details and syncs emergency flag", async () => {
    const result = await savePlayerContactAction(
      "player-1",
      {},
      formDataFrom({
        phone: "07111",
        email: "sam@example.com",
        emergency_guardian_id: "guardian-1",
      }),
    );
    expect(result.success).toMatch(/saved/i);
    expect(syncEmergencyMock).toHaveBeenCalledWith("player-1", "guardian-1");
  });
});

describe("roster actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addPlayerToTeamMock.mockResolvedValue({ error: null });
    updateRosterEntryMock.mockResolvedValue({ error: null });
    removePlayerFromTeamMock.mockResolvedValue({ error: null });
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1" },
      error: null,
    });
    resolveStaffClubIdMock.mockResolvedValue("club-1");
    createPlayerMock.mockResolvedValue({
      data: { id: "player-new", person_id: "person-new" },
      error: null,
    });
  });

  it("validates shirt numbers when adding to a team", async () => {
    const result = await addPlayerToTeamAction(
      "player-1",
      {},
      formDataFrom({ team_id: "team-1", shirt_number: "abc" }),
    );
    expect(result.error).toMatch(/shirt/i);
  });

  it("adds an existing player to the roster", async () => {
    const result = await addRosterPlayerAction(
      "team-1",
      {},
      formDataFrom({ player_id: "player-1", shirt_number: "7" }),
    );
    expect(result.success).toMatch(/added/i);
  });

  it("creates a roster player in one step", async () => {
    const result = await createRosterPlayerAction(
      "team-1",
      "club-1",
      {},
      formDataFrom({
        first_name: "Sam",
        last_name: "Striker",
        shirt_number: "9",
      }),
    );
    expect(result.success).toMatch(/added/i);
    expect(addPlayerToTeamMock).toHaveBeenCalledWith("team-1", "player-new", 9);
  });

  it("updates roster entry shirt numbers", async () => {
    const result = await updateRosterEntryAction(
      "team-player-1",
      "player-1",
      {},
      formDataFrom({ shirt_number: "10", active: "true" }),
    );
    expect(result.success).toBe("ok");
    expect(updateRosterEntryMock).toHaveBeenCalledWith(
      "team-player-1",
      expect.objectContaining({ shirt_number: 10, active: true }),
    );
  });
});
