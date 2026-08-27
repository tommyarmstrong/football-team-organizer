import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import {
  matchFixture,
  plainMatchFixture,
  teamFixture,
  viewerFixture,
} from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  getActiveTeamMock,
  createMatchMock,
  updateMatchMock,
  deleteMatchMock,
  getMatchMock,
  listVenuesMock,
  listMatchPlayersMock,
  listRosterForTeamMock,
  createPeriodsWithStartersMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
  createMatchMock: vi.fn(),
  updateMatchMock: vi.fn(),
  deleteMatchMock: vi.fn(),
  getMatchMock: vi.fn(),
  listVenuesMock: vi.fn(),
  listMatchPlayersMock: vi.fn(),
  listRosterForTeamMock: vi.fn(),
  createPeriodsWithStartersMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));
vi.mock("@/lib/data/matches", () => ({
  createMatch: createMatchMock,
  updateMatch: updateMatchMock,
  deleteMatch: deleteMatchMock,
  getMatch: getMatchMock,
}));
vi.mock("@/lib/data/venues", () => ({ listVenues: listVenuesMock }));
vi.mock("@/lib/data/match-players", () => ({
  listMatchPlayers: listMatchPlayersMock,
}));
vi.mock("@/lib/data/players", () => ({
  listRosterForTeam: listRosterForTeamMock,
}));
vi.mock("@/lib/data/match-periods", () => ({
  createPeriodsWithStarters: createPeriodsWithStartersMock,
}));

import {
  createMatchAction,
  deleteMatchAction,
  updateMatchAction,
  updateMatchPlayersOfTheMatchAction,
  updateMatchStatusAction,
} from "@/lib/matches/actions";

function validCreateForm(overrides: Record<string, string> = {}): FormData {
  return formDataFrom({
    opponent_name: "Rivals FC",
    date: "2025-09-01",
    home_away: "home",
    status: "scheduled",
    competition_id: "__friendly__",
    periods: "halves",
    ...overrides,
  });
}

describe("createMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    getViewerContextMock.mockResolvedValue(viewerFixture());
    listVenuesMock.mockResolvedValue({ data: [], error: null });
    listMatchPlayersMock.mockResolvedValue({ data: [], error: null });
    listRosterForTeamMock.mockResolvedValue({ data: [], error: null });
    createPeriodsWithStartersMock.mockResolvedValue({ error: null });
  });

  it("requires opponent and date", async () => {
    const result = await createMatchAction(
      {},
      formDataFrom({ home_away: "home", status: "scheduled" }),
    );
    expect(result.error).toMatch(/opponent and date/i);
    expect(createMatchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid home/away", async () => {
    const result = await createMatchAction(
      {},
      validCreateForm({ home_away: "sideways" }),
    );
    expect(result.error).toMatch(/home\/away/i);
  });

  it("rejects when no team is selected", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    const result = await createMatchAction({}, validCreateForm());
    expect(result.error).toMatch(/no team selected/i);
  });

  it("rejects without match-day permission", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: [], memberTeamRoles: {} }),
    );
    const result = await createMatchAction({}, validCreateForm());
    expect(result.error).toMatch(/permission/i);
  });

  it("rejects an invalid venue for the club", async () => {
    listVenuesMock.mockResolvedValue({
      data: [{ id: "venue-other", club_id: "club-1", name: "Other" }],
      error: null,
    });
    const result = await createMatchAction(
      {},
      validCreateForm({ venue_id: "venue-missing" }),
    );
    expect(result.error).toMatch(/invalid venue/i);
  });

  it("creates the match, default periods, and redirects", async () => {
    createMatchMock.mockResolvedValue({
      data: plainMatchFixture({ id: "match-new" }),
      error: null,
    });
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-1" }],
      error: null,
    });

    await expect(createMatchAction({}, validCreateForm())).rejects.toThrow(
      "redirect:/matches/match-new",
    );

    expect(createMatchMock).toHaveBeenCalled();
    expect(createPeriodsWithStartersMock).toHaveBeenCalledWith(
      "match-new",
      expect.any(Array),
      ["player-1"],
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/matches");
  });
});

describe("updateMatchStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
  });

  it("rejects invalid status values", async () => {
    const result = await updateMatchStatusAction("match-1", "nope" as never);
    expect(result.error).toMatch(/invalid status/i);
  });

  it("rejects illegal transitions from played", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "played" }),
      error: null,
    });
    const result = await updateMatchStatusAction("match-1", "in_progress");
    expect(result.error).toMatch(/not available/i);
    expect(updateMatchMock).not.toHaveBeenCalled();
  });

  it("allows scheduled → in_progress", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    updateMatchMock.mockResolvedValue({ data: {}, error: null });

    const result = await updateMatchStatusAction("match-1", "in_progress");
    expect(result).toEqual({});
    expect(updateMatchMock).toHaveBeenCalledWith(
      "match-1",
      expect.objectContaining({ status: "in_progress" }),
    );
  });

  it("clears potm fields when cancelling", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    updateMatchMock.mockResolvedValue({ data: {}, error: null });

    await updateMatchStatusAction("match-1", "cancelled");
    expect(updateMatchMock).toHaveBeenCalledWith(
      "match-1",
      expect.objectContaining({
        status: "cancelled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    );
  });
});

describe("updateMatchPlayersOfTheMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
  });

  it("requires team-edit permission", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "played" }),
      error: null,
    });
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian_assistant"] },
      }),
    );

    const result = await updateMatchPlayersOfTheMatchAction(
      "match-1",
      {},
      formDataFrom({ player_of_the_match_id: "player-1" }),
    );
    expect(result.error).toMatch(/only coaches and management/i);
  });

  it("blocks potm when the match does not allow events", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    const result = await updateMatchPlayersOfTheMatchAction(
      "match-1",
      {},
      formDataFrom({ player_of_the_match_id: "player-1" }),
    );
    expect(result.error).toMatch(/in progress or played/i);
  });

  it("saves potm when allowed", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "played" }),
      error: null,
    });
    updateMatchMock.mockResolvedValue({ data: {}, error: null });

    const result = await updateMatchPlayersOfTheMatchAction(
      "match-1",
      {},
      formDataFrom({
        player_of_the_match_id: "player-1",
        players_player_of_the_match_id: "player-2",
      }),
    );
    expect(result.success).toMatch(/saved/i);
    expect(updateMatchMock).toHaveBeenCalledWith(
      "match-1",
      expect.objectContaining({
        player_of_the_match_id: "player-1",
        players_player_of_the_match_id: "player-2",
      }),
    );
  });
});

describe("updateMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getMatchMock.mockResolvedValue({
      data: matchFixture(),
      error: null,
    });
    listVenuesMock.mockResolvedValue({ data: [], error: null });
    updateMatchMock.mockResolvedValue({ data: {}, error: null });
  });

  it("returns not found when the match is missing", async () => {
    getMatchMock.mockResolvedValue({ data: null, error: null });
    const result = await updateMatchAction(
      "missing",
      {},
      validCreateForm({ status: "scheduled" }),
    );
    expect(result.error).toMatch(/not found/i);
  });

  it("updates and redirects on success", async () => {
    await expect(
      updateMatchAction(
        "match-1",
        {},
        validCreateForm({ status: "scheduled", opponent_name: "Updated" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(updateMatchMock).toHaveBeenCalled();
  });
});

describe("deleteMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getMatchMock.mockResolvedValue({
      data: matchFixture(),
      error: null,
    });
    deleteMatchMock.mockResolvedValue({ error: null });
  });

  it("deletes and redirects to the matches list", async () => {
    await expect(deleteMatchAction("match-1")).rejects.toThrow(
      "redirect:/matches",
    );
    expect(deleteMatchMock).toHaveBeenCalledWith("match-1");
  });

  it("denies delete without permission", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: [], memberTeamRoles: {} }),
    );
    const result = await deleteMatchAction("match-1");
    expect(result.error).toMatch(/permission/i);
    expect(deleteMatchMock).not.toHaveBeenCalled();
  });
});
