import { describe, expect, it } from "vitest";
import { groupGoalsByPeriod } from "@/components/matches/match-goals-section";
import type { GoalWithPlayers } from "@/lib/data/goals";

function goalFixture(
  overrides: Partial<GoalWithPlayers> & Pick<GoalWithPlayers, "id">,
): GoalWithPlayers {
  return {
    match_id: "match-1",
    player_id: "player-1",
    assist_player_id: null,
    period: null,
    period_id: null,
    minute: null,
    is_penalty: false,
    is_freekick: false,
    from_setpiece: false,
    is_opposition: false,
    is_own_goal: false,
    created_at: "2025-01-01T00:00:00Z",
    scorer: {
      id: "player-1",
      person_id: "person-1",
      first_name: "Alex",
      last_name: "Smith",
    },
    assist: null,
    ...overrides,
  };
}

describe("groupGoalsByPeriod", () => {
  it("groups goals by period and keeps insertion order", () => {
    const goals = [
      goalFixture({
        id: "g1",
        period: "1st Half",
        period_id: "p1",
        is_penalty: true,
      }),
      goalFixture({
        id: "g2",
        period: "1st Half",
        period_id: "p1",
        assist: {
          id: "player-2",
          person_id: "person-2",
          first_name: "Sam",
          last_name: "Lee",
        },
        assist_player_id: "player-2",
      }),
      goalFixture({
        id: "g3",
        period: "2nd Half",
        period_id: "p2",
      }),
    ];

    expect(groupGoalsByPeriod(goals)).toEqual([
      {
        key: "p1",
        label: "1st Half",
        goals: [goals[0], goals[1]],
      },
      {
        key: "p2",
        label: "2nd Half",
        goals: [goals[2]],
      },
    ]);
  });

  it("falls back to an em dash when period is missing", () => {
    const goals = [goalFixture({ id: "g1" })];
    expect(groupGoalsByPeriod(goals)).toEqual([
      { key: "label:—", label: "—", goals },
    ]);
  });

  it("groups by period label when period_id is missing", () => {
    const goals = [
      goalFixture({ id: "g1", period: "Extra Time" }),
      goalFixture({ id: "g2", period: "Extra Time" }),
      goalFixture({ id: "g3", period: "Penalties" }),
    ];

    expect(groupGoalsByPeriod(goals).map((group) => group.key)).toEqual([
      "label:Extra Time",
      "label:Penalties",
    ]);
    expect(groupGoalsByPeriod(goals)[0]?.goals).toHaveLength(2);
  });
});
