import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  goalAssistPlayer,
  goalDeleteButtonFrameClassName,
  goalEventRowClassName,
  goalScorerLineClassName,
  goalScorerNameClassName,
  goalsTableClassName,
  goalsTablePeriodCellClassName,
  goalsTableShellClassName,
  groupGoalsByPeriod,
  periodEndScores,
  playerEventNameClassName,
} from "@/components/matches/match-goals-section";
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

describe("goalAssistPlayer", () => {
  it("returns the assister when assists are allowed", () => {
    const assist = {
      id: "player-2",
      person_id: "person-2",
      first_name: "Sam",
      last_name: "Lee",
    };
    expect(
      goalAssistPlayer(
        goalFixture({
          id: "g1",
          assist,
          assist_player_id: "player-2",
        }),
      ),
    ).toEqual(assist);
  });

  it("returns null when there is no assist so the row can end after the scorer", () => {
    expect(goalAssistPlayer(goalFixture({ id: "g1" }))).toBeNull();
  });

  it("returns null for penalties even when an assist is stored", () => {
    expect(
      goalAssistPlayer(
        goalFixture({
          id: "g1",
          is_penalty: true,
          assist_player_id: "player-2",
          assist: {
            id: "player-2",
            person_id: "person-2",
            first_name: "Sam",
            last_name: "Lee",
          },
        }),
      ),
    ).toBeNull();
  });
});

describe("playerEventNameClassName", () => {
  it("uses plain text styles without chip chrome", () => {
    const className = playerEventNameClassName();
    expect(className).toContain("text-sm");
    expect(className).not.toContain("rounded-lg");
    expect(className).not.toContain("border");
    expect(className).not.toContain("px-2");
  });
});

describe("goalScorerNameClassName", () => {
  it("colours opposition goals red", () => {
    const className = goalScorerNameClassName({ is_opposition: true });
    expect(className).toContain("text-red-600");
    expect(className).toContain("dark:text-red-400");
  });

  it("leaves our goals and own goals uncoloured", () => {
    expect(goalScorerNameClassName({ is_opposition: false })).not.toContain(
      "text-red-600",
    );
  });
});

describe("goals table layout", () => {
  it("uses a shared table column so period labels align", () => {
    expect(goalsTableShellClassName()).toContain("rounded-2xl");
    expect(goalsTableClassName()).toContain("w-full");
    expect(goalsTableClassName()).toContain("border-collapse");
    expect(goalsTablePeriodCellClassName()).toContain("whitespace-nowrap");
    expect(goalsTablePeriodCellClassName()).toContain("align-top");
  });

  it("does not reserve a second row when a goal has no assist", () => {
    const withoutAssist = goalEventRowClassName(false);
    const withAssist = goalEventRowClassName(true);
    expect(withoutAssist).not.toContain("grid-rows-[auto_auto]");
    expect(withoutAssist).not.toContain("gap-y-1.5");
    expect(withAssist).toContain("grid-rows-[auto_auto]");
    expect(withAssist).toContain("gap-y-1.5");
  });

  it("places the delete control on the scorer line", () => {
    expect(goalScorerLineClassName()).toContain("items-center");
    expect(goalDeleteButtonFrameClassName()).toContain("row-start-1");
    expect(goalDeleteButtonFrameClassName()).toContain("items-center");
  });
});

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

describe("periodEndScores", () => {
  it("accumulates a home-first score after each period", () => {
    const periods = [
      { id: "q1", name: "Quarter 1" },
      { id: "q2", name: "Quarter 2" },
      { id: "q3", name: "Quarter 3" },
      { id: "q4", name: "Quarter 4" },
    ];
    const goals = [
      goalFixture({
        id: "g1",
        period: "Quarter 1",
        period_id: "q1",
      }),
      goalFixture({
        id: "g2",
        period: "Quarter 1",
        period_id: "q1",
        is_opposition: true,
        player_id: null,
        scorer: null,
      }),
      goalFixture({
        id: "g3",
        period: "Quarter 2",
        period_id: "q2",
      }),
      goalFixture({
        id: "g4",
        period: "Quarter 4",
        period_id: "q4",
        is_opposition: true,
        player_id: null,
        scorer: null,
      }),
    ];
    const groups = groupGoalsByPeriod(goals, periods);

    expect(periodEndScores(groups, "home")).toEqual([
      "1–1",
      "2–1",
      "2–1",
      "2–2",
    ]);
    expect(periodEndScores(groups, "away")).toEqual([
      "1–1",
      "1–2",
      "1–2",
      "2–2",
    ]);
  });

  it("shows 0–0 when no goals have been scored yet", () => {
    const groups = groupGoalsByPeriod(
      [],
      [
        { id: "q1", name: "Quarter 1" },
        { id: "q2", name: "Quarter 2" },
      ],
    );
    expect(periodEndScores(groups, "home")).toEqual(["0–0", "0–0"]);
  });
});

describe("MatchGoalsSection add goal", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "match-goals-section.tsx"),
    "utf8",
  );

  it("opens an inline dialog instead of navigating to /goals/new", () => {
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).not.toContain("AddGoalDialog");
  });

  it("opens add period and edit goal in dialogs on the match page", () => {
    expect(source).toContain("addPeriod");
    expect(source).toContain("MatchPeriodCreateSection");
    expect(source).toContain("Edit goal");
    expect(source).toContain("stayOnPage");
  });

  it("keeps add goal and add period narrow and equal width when stacked", () => {
    expect(source).toContain("stackedActionsClassName");
    expect(source).toContain("stackedActionButtonClassName");
    expect(source).not.toContain("sm:w-auto");
  });
});
