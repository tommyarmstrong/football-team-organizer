import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult } from "@/test/supabase-mock";
import type { RosterPlayer } from "@/lib/data/players";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  listMatchPlayers,
  listMatchSquad,
  setMatchSquad,
} from "@/lib/data/match-players";

const roster: RosterPlayer[] = [
  {
    id: "player-1",
    person_id: "person-1",
    team_player_id: "tp-1",
    first_name: "Sam",
    last_name: "One",
    position: null,
    shirt_number: 7,
    active: true,
  },
  {
    id: "player-2",
    person_id: "person-2",
    team_player_id: "tp-2",
    first_name: "Alex",
    last_name: "Two",
    position: null,
    shirt_number: 9,
    active: true,
  },
];

describe("match-players data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists match players", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_players: okResult([
          { id: "mp-1", match_id: "m1", player_id: "player-1" },
        ]),
      }),
    );
    const result = await listMatchPlayers("m1");
    expect(result.data).toHaveLength(1);
  });

  it("enriches squad rows from the roster", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_players: okResult([
          { id: "mp-1", match_id: "m1", player_id: "player-1" },
          { id: "mp-2", match_id: "m1", player_id: "player-missing" },
        ]),
      }),
    );
    const result = await listMatchSquad("m1", roster);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.match_player_id).toBe("mp-1");
    expect(result.data[0]?.shirt_number).toBe(7);
  });

  it("adds and removes squad members", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
        match_players: [
          okResult([{ id: "mp-old", player_id: "player-1" }]),
          okResult(null),
          okResult(null),
        ],
      }),
    );

    const result = await setMatchSquad("m1", ["player-2", "player-2"]);
    expect(result.error).toBeNull();
  });
});
