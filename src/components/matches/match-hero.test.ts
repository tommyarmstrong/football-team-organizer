import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: "a",
    props: { href, children },
  }),
}));

import {
  MatchHero,
  matchHeroAriaLabel,
  matchHeroDigitClassName,
  matchHeroShowsScore,
  matchHeroSides,
} from "@/components/matches/match-hero";

const playedHome = {
  teamName: "MGA Select",
  opponentName: "Rose FC",
  homeAway: "home" as const,
  status: "played" as const,
  goalsFor: 2,
  goalsAgainst: 1,
};

describe("matchHeroSides", () => {
  it("puts our team on the left at home", () => {
    expect(matchHeroSides("MGA Select", "Rose FC", "home")).toEqual({
      homeName: "MGA Select",
      awayName: "Rose FC",
    });
  });

  it("puts the opponent on the left when we are away", () => {
    expect(matchHeroSides("MGA Select", "Rose FC", "away")).toEqual({
      homeName: "Rose FC",
      awayName: "MGA Select",
    });
  });
});

describe("matchHeroShowsScore", () => {
  it("shows digits for played and in-progress matches only", () => {
    expect(matchHeroShowsScore("played")).toBe(true);
    expect(matchHeroShowsScore("in_progress")).toBe(true);
    expect(matchHeroShowsScore("scheduled")).toBe(false);
    expect(matchHeroShowsScore("postponed")).toBe(false);
    expect(matchHeroShowsScore("cancelled")).toBe(false);
  });
});

describe("matchHeroAriaLabel", () => {
  it("includes both names and the home-first score for a played 2–1", () => {
    expect(matchHeroAriaLabel(playedHome)).toBe("MGA Select 2-1 Rose FC");
  });

  it("keeps the full names when the visible labels truncate", () => {
    expect(
      matchHeroAriaLabel({
        teamName: "A Very Long Team Name United",
        opponentName: "Even Longer Opposition Wanderers",
        homeAway: "home",
        status: "played",
        goalsFor: 2,
        goalsAgainst: 1,
      }),
    ).toContain("A Very Long Team Name United");
  });
});

describe("matchHeroDigitClassName", () => {
  it("scales digits by surface", () => {
    expect(matchHeroDigitClassName("hero")).toContain("text-6xl");
    expect(matchHeroDigitClassName("card")).toContain("text-5xl");
    expect(matchHeroDigitClassName("compact")).toContain("text-4xl");
  });
});

function renderTree(node: unknown): string {
  return JSON.stringify(node, (_key, value) =>
    typeof value === "function" ? value.name || "Function" : value,
  );
}

describe("MatchHero", () => {
  it("renders home-first digits for a played home win", () => {
    const html = JSON.stringify(MatchHero(playedHome));
    expect(html).toContain("MGA Select");
    expect(html).toContain("Rose FC");
    expect(html).toContain("MGA Select 2-1 Rose FC");
    expect(html).toContain('"2"');
    expect(html).toContain('"1"');
    expect(html).not.toContain('"vs"');
  });

  it("swaps score digits when we are away", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        homeAway: "away",
      }),
    );
    expect(html).toContain("Rose FC");
    expect(html).toMatch(/"1"[\s\S]*"2"/);
  });

  it("shows vs with no digits for scheduled matches", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        status: "scheduled",
        goalsFor: 0,
        goalsAgainst: 0,
      }),
    );
    expect(html).toContain("vs");
    expect(html).not.toContain("LIVE");
    expect(html).not.toMatch(/font-display[^"]*text-6xl/);
  });

  it("shows digits and LIVE only when in progress", () => {
    const live = renderTree(
      MatchHero({
        ...playedHome,
        status: "in_progress",
        goalsFor: 0,
        goalsAgainst: 0,
      }),
    );
    expect(live).toContain("LiveIndicator");
    expect(live).toContain('"0"');

    const played = renderTree(MatchHero(playedHome));
    expect(played).not.toContain("LiveIndicator");
  });

  it("puts share/edit/delete under the score on the hero", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        size: "hero",
        actions: "Share",
      }),
    );
    const scoreIndex = html.indexOf("text-6xl");
    const actionsIndex = html.indexOf("Share");
    expect(scoreIndex).toBeGreaterThan(-1);
    expect(actionsIndex).toBeGreaterThan(scoreIndex);
  });

  it("shows vs and status for postponed matches", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        status: "postponed",
      }),
    );
    expect(html).toContain("vs");
    expect(html).toContain("Postponed");
    expect(html).not.toContain("LIVE");
  });

  it("does not include a share slot on card or compact sizes", () => {
    const card = JSON.stringify(
      MatchHero({ ...playedHome, size: "card", actions: "Share" }),
    );
    expect(card).not.toContain("Share");
  });
});
