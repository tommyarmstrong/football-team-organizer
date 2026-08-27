import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  createGoal,
  deleteGoal,
  getGoal,
  listGoalsForMatch,
  updateGoal,
} from "@/lib/data/goals";

const goalRow = {
  id: "goal-1",
  match_id: "match-1",
  player_id: "player-1",
  assist_player_id: null,
  period: "First half",
  period_id: null,
  minute: 12,
  is_penalty: false,
  is_freekick: false,
  from_setpiece: false,
  is_opposition: false,
  is_own_goal: false,
  created_at: "2025-01-01T00:00:00Z",
  scorer: {
    id: "player-1",
    person_id: "person-1",
    person: { first_name: "Sam", last_name: "Striker" },
  },
  assist: null,
};

describe("goals data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and gets goals", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ goals: okResult([goalRow]) }),
    );
    expect(
      (await listGoalsForMatch("match-1")).data[0]?.scorer?.first_name,
    ).toBe("Sam");

    createClientMock.mockResolvedValue(
      mockFromClient({ goals: okResult(goalRow) }),
    );
    expect((await getGoal("goal-1")).data?.minute).toBe(12);
  });

  it("creates goals only for in-progress/played matches", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "match-1", status: "scheduled" }),
      }),
    );
    expect(
      await createGoal({ match_id: "match-1", player_id: "player-1" }),
    ).toMatchObject({
      error: expect.stringMatching(/in progress or played/i),
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "match-1", status: "in_progress" }),
        goals: okResult({ id: "goal-1" }),
      }),
    );
    expect(
      (await createGoal({ match_id: "match-1", player_id: "player-1" })).data
        ?.id,
    ).toBe("goal-1");
  });

  it("maps friendly goal errors and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: errResult("goals_assist_not_scorer"),
      }),
    );
    expect(
      await updateGoal("goal-1", { assist_player_id: "player-1" }),
    ).toMatchObject({
      error: expect.stringMatching(/assist player/i),
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ goals: okResult(null) }),
    );
    expect(await deleteGoal("goal-1")).toEqual({ error: null });
  });
});
