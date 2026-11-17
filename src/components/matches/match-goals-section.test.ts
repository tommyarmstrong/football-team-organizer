import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: unknown; href: string }) =>
    createElement("a", { href, ...rest }, children as never),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  usePathname: () => "/",
}));
vi.mock("@/lib/goals/actions", () => ({
  deleteGoalAction: vi.fn(),
  createGoalAction: vi.fn(),
  updateGoalAction: vi.fn(),
}));
vi.mock("@/lib/match-periods/actions", () => ({}));

import {
  MatchGoalsSection,
  goalAssistPlayer,
  goalDeleteButtonFrameClassName,
  goalEventBodyClassName,
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

  it("lays a goal out as a compact flex row with its assist beneath, not a grid", () => {
    const row = goalEventRowClassName();
    expect(row).toContain("flex");
    expect(row).toContain("border-b");
    expect(row).not.toContain("grid");
    const body = goalEventBodyClassName();
    expect(body).toContain("flex-col");
    expect(body).toContain("min-h-11");
  });

  it("keeps the delete control beside the goal, vertically centred", () => {
    expect(goalScorerLineClassName()).toContain("items-center");
    expect(goalDeleteButtonFrameClassName()).toContain("items-center");
    expect(goalDeleteButtonFrameClassName()).toContain("shrink-0");
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

  it("opens edit goal in a dialog on the match page", () => {
    expect(source).toContain("Edit goal");
    expect(source).toContain("stayOnPage");
  });

  it("has Add goal as its only action: period options live on the match card", () => {
    expect(source).toContain("primaryActionButtonClassName");
    expect(source).not.toContain("MatchPeriodOptionsMenu");
    expect(source).not.toContain("Options");
    expect(source).not.toContain("addPeriod");
    expect(source).not.toContain("changeFormat");
    expect(source).not.toContain("stackedActionsRowClassName");
  });
});

const alex = {
  id: "player-1",
  person_id: "person-1",
  first_name: "Alex",
  last_name: "Smith",
};
const sam = {
  id: "player-2",
  person_id: "person-2",
  first_name: "Sam",
  last_name: "Lee",
};

const rosterPlayers = [] as never[];
function renderGoals(
  props: Partial<Parameters<typeof MatchGoalsSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(MatchGoalsSection, {
      matchId: "match-1",
      goals: [],
      canEdit: false,
      ...props,
    }),
  );
}

/** Table rows (one per period) as separate HTML strings, in display order. */
function periodRows(html: string): string[] {
  return html.split("<tr").slice(1);
}

describe("MatchGoalsSection rendering", () => {
  const halves = [
    { id: "h1", name: "1st Half" },
    { id: "h2", name: "2nd Half" },
  ];

  it("groups goals by half, in period order, with the running score", () => {
    const html = renderGoals({
      periods: halves,
      homeAway: "home",
      goals: [
        goalFixture({
          id: "g2",
          period: "2nd Half",
          period_id: "h2",
          is_opposition: true,
          player_id: null,
          scorer: null,
        }),
        goalFixture({ id: "g1", period: "1st Half", period_id: "h1" }),
      ],
    });
    const [first, second] = periodRows(html);
    expect(first).toContain("1st Half");
    expect(first).toContain("1–0");
    expect(first).toContain("Alex Smith");
    expect(first).not.toContain("Goal against");
    expect(second).toContain("2nd Half");
    expect(second).toContain("1–1");
    expect(second).toContain("Goal against");
    expect(second).not.toContain("Alex Smith");
  });

  it("lists quarters, extra time and empty periods", () => {
    const html = renderGoals({
      homeAway: "home",
      periods: [
        { id: "q1", name: "Quarter 1" },
        { id: "q2", name: "Quarter 2" },
        { id: "q3", name: "Quarter 3" },
        { id: "q4", name: "Quarter 4" },
        { id: "et1", name: "Extra time 1" },
      ],
      goals: [
        goalFixture({ id: "g1", period: "Quarter 3", period_id: "q3" }),
        goalFixture({
          id: "g2",
          period: "Extra time 1",
          period_id: "et1",
          scorer: sam,
          player_id: "player-2",
        }),
      ],
    });
    const rows = periodRows(html);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toContain("No goals");
    expect(rows[1]).toContain("No goals");
    expect(rows[2]).toContain("Alex Smith");
    expect(rows[3]).toContain("No goals");
    expect(rows[4]).toContain("Sam Lee");
    expect(rows[4]).toContain("Extra time 1");
  });

  it("distinguishes goals for and against by text, not colour alone", () => {
    const html = renderGoals({
      periods: halves,
      goals: [
        goalFixture({ id: "g1", period: "1st Half", period_id: "h1" }),
        goalFixture({
          id: "g2",
          period: "1st Half",
          period_id: "h1",
          is_opposition: true,
          player_id: null,
          scorer: null,
        }),
      ],
    });
    // Both kinds use the supplied football graphic.
    expect(html.match(/src="\/football-icon\.svg"/g)?.length).toBe(2);
    expect(html).not.toContain("lucide-goal");
    expect(html).not.toContain("lucide-shield-alert");
    expect(html).toContain("Goal by");
    expect(html).toContain("Goal against");
    expect(html).toContain("text-red-600");
    // Icons are decorative; the visible/sr-only text carries the meaning.
    expect(html).toContain('aria-hidden="true"');
  });

  it("sets an assist directly under its own goal and not under others", () => {
    const html = renderGoals({
      periods: halves,
      goals: [
        goalFixture({
          id: "g1",
          period: "1st Half",
          period_id: "h1",
          assist: sam,
          assist_player_id: "player-2",
        }),
        goalFixture({
          id: "g2",
          period: "1st Half",
          period_id: "h1",
          scorer: {
            ...alex,
            id: "player-3",
            first_name: "Jo",
            last_name: "Ng",
          },
          player_id: "player-3",
        }),
      ],
    });
    const firstHalf = periodRows(html)[0] ?? "";
    const goalBlocks = firstHalf.split("/football-icon.svg").slice(1);
    expect(goalBlocks).toHaveLength(2);
    const [withAssist = "", withoutAssist = ""] = goalBlocks;
    // First goal: scorer then assist, in the same event block.
    expect(withAssist.indexOf("Alex Smith")).toBeLessThan(
      withAssist.indexOf("Sam Lee"),
    );
    expect(withAssist).toContain("lucide-handshake");
    expect(withAssist).toContain("Assist by");
    // Second goal has no assist.
    expect(withoutAssist).toContain("Jo Ng");
    expect(withoutAssist).not.toContain("Sam Lee");
    expect(withoutAssist).not.toContain("lucide-handshake");
  });

  it("hides assists for penalties and own goals", () => {
    const html = renderGoals({
      periods: halves,
      goals: [
        goalFixture({
          id: "g1",
          period: "1st Half",
          period_id: "h1",
          is_penalty: true,
          assist: sam,
          assist_player_id: "player-2",
        }),
      ],
    });
    expect(html).toContain("(P)");
    expect(html).not.toContain("Sam Lee");
  });

  it("shows no edit, delete or Add goal controls when read-only", () => {
    const html = renderGoals({
      periods: halves,
      goals: [goalFixture({ id: "g1", period: "1st Half", period_id: "h1" })],
    });
    expect(html).not.toContain("Delete goal");
    expect(html).not.toContain("Add goal");
    expect(html).not.toContain("Options");
    // Read-only goals link to the goal page.
    expect(html).toContain('href="/matches/match-1/goals/g1"');
  });

  it("keeps edit, delete and Add goal for editors, with no period options", () => {
    const html = renderGoals({
      canEdit: true,
      periods: halves,
      addGoal: {
        players: rosterPlayers,
        teamName: "MGA",
        opponentName: "Rose",
      },
      goals: [goalFixture({ id: "g1", period: "1st Half", period_id: "h1" })],
    });
    // Editing opens a dialog rather than navigating.
    expect(html).not.toContain('href="/matches/match-1/goals/g1"');
    expect(html).toContain('aria-label="Delete goal by Alex Smith"');
    expect(html).toContain("Add goal");
    expect(html).not.toContain("Options");
    expect(html).not.toContain("Add period");
    expect(html).not.toContain("Change to");
  });

  it("falls back to the add-goal page link without an inline dialog", () => {
    const html = renderGoals({
      canEdit: true,
      periods: halves,
      periodId: "h1",
    });
    expect(html).toContain('href="/matches/match-1/goals/new?period_id=h1"');
  });

  it("shows an empty state when there are no goals and the viewer cannot edit", () => {
    const html = renderGoals();
    expect(html).toContain("No goals recorded");
  });

  it("keeps long scorer and assist names inside the row", () => {
    const longName = {
      ...alex,
      first_name: "Bartholomew-Maximilian",
      last_name: "Featherstonehaugh-Cholmondeley",
    };
    const html = renderGoals({
      periods: halves,
      goals: [
        goalFixture({
          id: "g1",
          period: "1st Half",
          period_id: "h1",
          scorer: longName,
          assist: longName,
          assist_player_id: "player-1",
        }),
      ],
    });
    expect(html).toContain("Bartholomew-Maximilian Featherstonehaugh");
    expect(html.match(/class="truncate"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("min-w-0");
  });
});
