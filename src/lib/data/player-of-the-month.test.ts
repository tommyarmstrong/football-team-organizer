import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture } from "@/test/fixtures";

const { createClientMock, getActiveTeamMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/team", () => ({
  getActiveTeam: getActiveTeamMock,
}));

import {
  createPlayerOfTheMonth,
  deletePlayerOfTheMonth,
  getPlayerOfTheMonth,
  listPlayerOfTheMonth,
  updatePlayerOfTheMonth,
} from "@/lib/data/player-of-the-month";

const potmRow = {
  id: "potm-1",
  team_id: "team-1",
  player_id: "player-1",
  month: "2025-09-01",
  notes: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  player: {
    id: "player-1",
    person_id: "person-1",
    person: { first_name: "Sam", last_name: "Striker" },
  },
};

describe("player of the month data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
  });

  it("requires an active team", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await listPlayerOfTheMonth()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
  });

  it("lists, gets, creates, updates, and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ player_of_the_month: okResult([potmRow]) }),
    );
    expect(
      (await listPlayerOfTheMonth("team-1", 3)).data[0]?.player.first_name,
    ).toBe("Sam");

    createClientMock.mockResolvedValue(
      mockFromClient({ player_of_the_month: okResult(potmRow) }),
    );
    expect((await getPlayerOfTheMonth("potm-1")).data?.id).toBe("potm-1");
    expect(
      (
        await createPlayerOfTheMonth({
          player_id: "player-1",
          month: "2025-09-01",
        })
      ).data?.id,
    ).toBe("potm-1");
    expect(
      (await updatePlayerOfTheMonth("potm-1", { notes: "Great" })).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ player_of_the_month: okResult(null) }),
    );
    expect(await deletePlayerOfTheMonth("potm-1")).toEqual({ error: null });
  });

  it("maps errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ player_of_the_month: errResult("fail") }),
    );
    expect(await listPlayerOfTheMonth()).toEqual({ data: [], error: "fail" });
  });
});
