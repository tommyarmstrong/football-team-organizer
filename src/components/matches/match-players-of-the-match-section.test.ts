import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) =>
    createElement("a", { href }, children as never),
}));
vi.mock("@/lib/matches/actions", () => ({
  updateMatchPlayersOfTheMatchAction: vi.fn(),
}));
vi.mock("@/lib/goals/actions", () => ({ deleteGoalAction: vi.fn() }));
vi.mock("@/lib/match-periods/actions", () => ({}));

import type { RosterPlayer } from "@/lib/data/players";
import {
  COACH_POTM_LABEL,
  MatchPlayersOfTheMatchSection,
  PLAYERS_POTM_LABEL,
  playerOfTheMatchLabel,
  playerOfTheMatchName,
  playerOfTheMatchOptions,
} from "@/components/matches/match-players-of-the-match-section";

function rosterPlayer(
  id: string,
  first: string,
  last: string,
  shirt: number | null,
  active = true,
): RosterPlayer {
  return {
    id,
    person_id: `person-${id}`,
    first_name: first,
    last_name: last,
    shirt_number: shirt,
    active,
  } as RosterPlayer;
}

const roster = [
  rosterPlayer("p1", "Alex", "Smith", 7),
  rosterPlayer("p2", "Sam", "Lee", null),
  rosterPlayer("p3", "Jo", "Ng", 12, false),
];

describe("playerOfTheMatchName", () => {
  const players = [
    {
      id: "p1",
      first_name: "Alex",
      last_name: "Smith",
    },
    {
      id: "p2",
      first_name: "Sam",
      last_name: "Lee",
    },
  ];

  it("returns the player name without a shirt number", () => {
    expect(playerOfTheMatchName(players, "p2")).toBe("Sam Lee");
  });

  it("returns null when no player is selected", () => {
    expect(playerOfTheMatchName(players, null)).toBeNull();
    expect(playerOfTheMatchName(players, "missing")).toBeNull();
  });
});

describe("playerOfTheMatchLabel", () => {
  it("includes the shirt number when there is one", () => {
    expect(playerOfTheMatchLabel(roster, "p1")).toBe("7 Alex Smith");
  });

  it("falls back to the name alone without a shirt number", () => {
    expect(playerOfTheMatchLabel(roster, "p2")).toBe("Sam Lee");
  });

  it("returns null for no selection or an unknown player", () => {
    expect(playerOfTheMatchLabel(roster, null)).toBeNull();
    expect(playerOfTheMatchLabel(roster, "missing")).toBeNull();
  });
});

describe("playerOfTheMatchOptions", () => {
  it("submits player ids and labels with shirt number and inactive marker", () => {
    expect(playerOfTheMatchOptions(roster)).toEqual([
      { value: "p1", label: "7 Alex Smith" },
      { value: "p2", label: "Sam Lee" },
      { value: "p3", label: "12 Jo Ng (inactive)" },
    ]);
  });
});

/** `renderToStaticMarkup` escapes apostrophes. */
const esc = (text: string) => text.replace(/'/g, "&#x27;");

function render(props: {
  canEdit?: boolean;
  coach?: string | null;
  players?: string | null;
}) {
  return renderToStaticMarkup(
    createElement(MatchPlayersOfTheMatchSection, {
      matchId: "match-1",
      players: roster,
      coachPlayerOfTheMatchId: props.coach ?? null,
      playersPlayerOfTheMatchId: props.players ?? null,
      canEdit: props.canEdit,
    }),
  );
}

describe("MatchPlayersOfTheMatchSection (editors)", () => {
  it("is one combined section with both awards labelled", () => {
    const html = render({ canEdit: true });
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain("Player of the Match");
    expect(html).toContain(`>${esc(COACH_POTM_LABEL)}</label>`);
    expect(html).toContain(`>${esc(PLAYERS_POTM_LABEL)}</label>`);
    expect(html).toContain('for="coach-potm-player"');
    expect(html).toContain('for="players-potm-player"');
  });

  it("has a single selector per award and no separate selected-player display above it", () => {
    const html = render({ canEdit: true, coach: "p1", players: "p2" });
    expect(html.match(/<input[^>]*role="combobox"/g)).toHaveLength(2);
    // The old layout rendered the trophy name above each selector.
    expect(html).not.toContain("lucide-trophy");
  });

  it("shows existing selections, with shirt number, inside the selectors", () => {
    const html = render({ canEdit: true, coach: "p1", players: "p2" });
    expect(html).toContain('value="7 Alex Smith"');
    expect(html).toContain('value="Sam Lee"');
  });

  it("submits the chosen player ids under the existing field names", () => {
    const html = render({ canEdit: true, coach: "p1", players: "p2" });
    expect(html).toMatch(/name="player_of_the_match_id"[^>]*value="p1"/);
    expect(html).toMatch(
      /name="players_player_of_the_match_id"[^>]*value="p2"/,
    );
  });

  it("renders empty selectors when nothing is selected", () => {
    const html = render({ canEdit: true });
    expect(html).not.toContain('value="7 Alex Smith"');
    expect(html).toContain('placeholder="Add player…"');
  });

  it("keeps an explicit Save button (persistence is unchanged)", () => {
    const html = render({ canEdit: true });
    expect(html).toContain('type="submit"');
    expect(html).toContain(">Save<");
  });

  it("uses touch-sized controls with 16px input text on phones", () => {
    const html = render({ canEdit: true });
    expect(html).toContain("h-11 sm:h-8");
    expect(html).toContain("text-base");
    expect(html).toContain("md:text-sm");
  });
});

describe("MatchPlayersOfTheMatchSection (read-only)", () => {
  it("shows both awards with shirt numbers in one section", () => {
    const html = render({ canEdit: false, coach: "p1", players: "p2" });
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain(esc(COACH_POTM_LABEL));
    expect(html).toContain(esc(PLAYERS_POTM_LABEL));
    expect(html).toContain("7 Alex Smith");
    expect(html).toContain("Sam Lee");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Save");
  });

  it("shows Not selected for an empty award", () => {
    const html = render({ canEdit: false, coach: "p1" });
    expect(html).toContain("Not selected");
  });
});

describe("awards persistence wiring", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "match-players-of-the-match-section.tsx"),
    "utf8",
  );

  it("still posts to the same server action and field names", () => {
    expect(source).toContain(
      "updateMatchPlayersOfTheMatchAction.bind(null, matchId)",
    );
    expect(source).toContain('name="player_of_the_match_id"');
    expect(source).toContain('name="players_player_of_the_match_id"');
    expect(source).toContain('{pending ? "Saving…" : "Save"}');
  });
});
