import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  createPeriod,
  createPeriodsWithStarters,
  deletePeriod,
  getPeriod,
  listPeriodsForMatch,
  setPeriodStarters,
  updatePeriod,
} from "@/lib/data/match-periods";

const periodRow = {
  id: "period-1",
  match_id: "match-1",
  name: "First half",
  sort_order: 1,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  starters: [
    {
      id: "s1",
      player_id: "player-1",
      player: {
        id: "player-1",
        person_id: "person-1",
        person: { first_name: "Sam", last_name: "Striker" },
      },
    },
  ],
};

describe("match periods data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and gets periods with starters", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ match_periods: okResult([periodRow]) }),
    );
    const listed = await listPeriodsForMatch("match-1");
    expect(listed.data[0]?.starter_player_ids).toEqual(["player-1"]);

    createClientMock.mockResolvedValue(
      mockFromClient({ match_periods: okResult(periodRow) }),
    );
    expect((await getPeriod("period-1")).data?.name).toBe("First half");
  });

  it("creates periods and with starters", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_periods: okResult({ id: "period-1", name: "Extra time 1" }),
      }),
    );
    expect(
      (
        await createPeriod({
          match_id: "match-1",
          name: "Extra time 1",
          sort_order: 10,
        })
      ).data?.id,
    ).toBe("period-1");

    createClientMock.mockResolvedValue(
      mockFromClient({
        match_periods: okResult([{ id: "p1" }, { id: "p2" }]),
        match_period_starters: okResult(null),
      }),
    );
    expect(
      await createPeriodsWithStarters(
        "match-1",
        ["First half", "Second half"],
        ["player-1"],
      ),
    ).toEqual({ error: null });

    expect(await createPeriodsWithStarters("match-1", [], [])).toEqual({
      error: null,
    });
  });

  it("updates period names and syncs goals", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_periods: okResult({ id: "period-1", name: "Extra time 2" }),
        goals: okResult(null),
      }),
    );
    expect(
      (await updatePeriod("period-1", { name: "Extra time 2" })).error,
    ).toBeNull();
  });

  it("sets period starters by diffing current ids", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_period_starters: [
          okResult([
            { id: "s-old", player_id: "player-old" },
            { id: "s-keep", player_id: "player-keep" },
          ]),
          okResult(null),
          okResult(null),
        ],
      }),
    );
    expect(
      await setPeriodStarters("period-1", ["player-keep", "player-new"]),
    ).toEqual({ error: null });
  });

  it("deletes periods and maps errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ match_periods: okResult(null) }),
    );
    expect(await deletePeriod("period-1")).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ match_periods: errResult("fail") }),
    );
    expect(await listPeriodsForMatch("match-1")).toEqual({
      data: [],
      error: "fail",
    });
  });
});
