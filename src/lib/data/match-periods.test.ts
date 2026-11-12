import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { planFormatChange } from "@/lib/match-periods/format-change";
import {
  changeMatchPeriodFormat,
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
        matches: okResult({ team_id: "team-1", team: { archived_at: null } }),
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
        matches: okResult({ team_id: "team-1", team: { archived_at: null } }),
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

  describe("changeMatchPeriodFormat", () => {
    function planFor(names: string[], target: "halves" | "quarters") {
      const sort: Record<string, number> = {
        "Quarter 1": 10,
        "Quarter 2": 20,
        "Quarter 3": 30,
        "Quarter 4": 40,
        "First half": 50,
        "Second half": 60,
      };
      const result = planFormatChange(
        names.map((name) => ({
          id: `id:${name}`,
          name,
          sort_order: sort[name] ?? 0,
        })),
        target,
      );
      if (!result.ok) throw new Error(result.error);
      return result.plan;
    }

    function clientWithRpc(rpcResult: { error: { message: string } | null }) {
      const rpc = vi.fn().mockResolvedValue({ data: null, ...rpcResult });
      return {
        rpc,
        client: {
          ...mockFromClient({
            matches: okResult({
              team_id: "team-1",
              team: { archived_at: null },
            }),
          }),
          rpc,
        },
      };
    }

    it("sends the plan to the change_match_period_format function", async () => {
      const { client, rpc } = clientWithRpc({ error: null });
      createClientMock.mockResolvedValue(client);

      const plan = planFor(
        ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
        "halves",
      );
      expect(await changeMatchPeriodFormat("match-1", plan)).toEqual({
        error: null,
      });

      expect(rpc).toHaveBeenCalledWith("change_match_period_format", {
        p_match_id: "match-1",
        p_keep: [
          {
            period_id: "id:Quarter 1",
            from_name: "Quarter 1",
            name: "First half",
            sort_order: 50,
          },
          {
            period_id: "id:Quarter 2",
            from_name: "Quarter 2",
            name: "Second half",
            sort_order: 60,
          },
        ],
        p_merge: [
          {
            period_id: "id:Quarter 3",
            into_period_id: "id:Quarter 2",
            from_name: "Quarter 3",
          },
          {
            period_id: "id:Quarter 4",
            into_period_id: "id:Quarter 2",
            from_name: "Quarter 4",
          },
        ],
        p_create: [],
        p_copy_starters_from: "id:Quarter 2",
      });
    });

    it("sends the periods to create and where to copy starters from", async () => {
      const { client, rpc } = clientWithRpc({ error: null });
      createClientMock.mockResolvedValue(client);

      await changeMatchPeriodFormat(
        "match-1",
        planFor(["First half", "Second half"], "quarters"),
      );

      const args = rpc.mock.calls[0]?.[1];
      expect(args?.p_create).toEqual([
        { name: "Quarter 3", sort_order: 30 },
        { name: "Quarter 4", sort_order: 40 },
      ]);
      expect(args?.p_merge).toEqual([]);
      expect(args?.p_copy_starters_from).toBe("id:Second half");
    });

    it("returns the database error", async () => {
      const { client } = clientWithRpc({ error: { message: "rpc failed" } });
      createClientMock.mockResolvedValue(client);

      expect(
        await changeMatchPeriodFormat(
          "match-1",
          planFor(["First half", "Second half"], "quarters"),
        ),
      ).toEqual({ error: "rpc failed" });
    });

    it("does not call the database for an archived team", async () => {
      const rpc = vi.fn();
      createClientMock.mockResolvedValue({
        ...mockFromClient({
          matches: okResult({
            team_id: "team-1",
            team: { archived_at: "2025-01-01T00:00:00Z" },
          }),
        }),
        rpc,
      });

      const result = await changeMatchPeriodFormat(
        "match-1",
        planFor(["First half", "Second half"], "quarters"),
      );
      expect(result.error).toEqual(expect.any(String));
      expect(rpc).not.toHaveBeenCalled();
    });
  });
});
