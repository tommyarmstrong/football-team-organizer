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
  it("groups goals by period and keeps insertion order for unknown labels", () => {
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
        periodId: "p1",
        goals: [goals[0], goals[1]],
      },
      {
        key: "p2",
        label: "2nd Half",
        periodId: "p2",
        goals: [goals[2]],
      },
    ]);
  });

  it("falls back to an em dash when period is missing", () => {
    const goals = [goalFixture({ id: "g1" })];
    expect(groupGoalsByPeriod(goals)).toEqual([
      { key: "label:—", label: "—", periodId: null, goals },
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

  it("orders known period names numerically even when goals arrive out of order", () => {
    const goals = [
      goalFixture({
        id: "g1",
        period: "Penalty Shootout",
        period_id: "p-pen",
      }),
      goalFixture({
        id: "g2",
        period: "Quarter 4",
        period_id: "p-q4",
      }),
      goalFixture({
        id: "g3",
        period: "Quarter 1",
        period_id: "p-q1",
      }),
      goalFixture({
        id: "g4",
        period: "Extra time 1",
        period_id: "p-et1",
      }),
    ];

    expect(groupGoalsByPeriod(goals).map((group) => group.label)).toEqual([
      "Quarter 1",
      "Quarter 4",
      "Extra time 1",
      "Penalty Shootout",
    ]);
  });

  it("lists every supplied period in order and marks empty periods", () => {
    const periods = [
      { id: "q1", name: "Quarter 1" },
      { id: "q2", name: "Quarter 2" },
      { id: "q3", name: "Quarter 3" },
      { id: "q4", name: "Quarter 4" },
      { id: "et1", name: "Extra time 1" },
      { id: "et2", name: "Extra time 2" },
      { id: "pen", name: "Penalty Shootout" },
    ];
    const goals = [
      goalFixture({
        id: "g-q4",
        period: "Quarter 4",
        period_id: "q4",
      }),
      goalFixture({
        id: "g-q1",
        period: "Quarter 1",
        period_id: "q1",
      }),
    ];

    const groups = groupGoalsByPeriod(goals, periods);

    expect(groups.map((group) => group.label)).toEqual([
      "Quarter 1",
      "Quarter 2",
      "Quarter 3",
      "Quarter 4",
      "Extra time 1",
      "Extra time 2",
      "Penalty Shootout",
    ]);
    expect(groups[0]?.goals).toEqual([goals[1]]);
    expect(groups[1]?.goals).toEqual([]);
    expect(groups[2]?.goals).toEqual([]);
    expect(groups[3]?.goals).toEqual([goals[0]]);
    expect(groups[4]?.goals).toEqual([]);
    expect(groups[5]?.goals).toEqual([]);
    expect(groups[6]?.goals).toEqual([]);
  });

  it("appends unmatched goals after the supplied periods", () => {
    const periods = [{ id: "q1", name: "Quarter 1" }];
    const goals = [
      goalFixture({
        id: "orphan",
        period: "First half",
        period_id: "old-half",
      }),
      goalFixture({
        id: "linked",
        period: "Quarter 1",
        period_id: "q1",
      }),
    ];

    const groups = groupGoalsByPeriod(goals, periods);
    expect(groups.map((group) => group.label)).toEqual([
      "Quarter 1",
      "First half",
    ]);
    expect(groups[0]?.goals).toEqual([goals[1]]);
    expect(groups[1]?.periodId).toBe("old-half");
    expect(groups[1]?.goals).toEqual([goals[0]]);
  });
});
