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
  matchHeroFrameClassName,
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

describe("matchHeroFrameClassName", () => {
  it("caps width so desktop cards stay as dense as mobile", () => {
    expect(matchHeroFrameClassName("compact")).toContain("max-w-lg");
    expect(matchHeroFrameClassName("hero")).toContain("max-w-lg");
    expect(matchHeroFrameClassName("compact")).toContain("rounded-2xl");
    expect(matchHeroFrameClassName("hero")).toContain("rounded-3xl");
  });
});

function renderTree(node: unknown): string {
  return JSON.stringify(node, (_key, value) =>
    typeof value === "function" ? value.name || "Function" : value,
  );
}

function stackMarkup(node: unknown): string {
  const html = renderTree(node);
  const start = html.indexOf('"data-slot":"match-card-stack"');
  expect(start).toBeGreaterThan(-1);
  return html.slice(start);
}

function expectStackOrder(html: string, parts: string[]) {
  let from = 0;
  for (const part of parts) {
    const index = html.indexOf(part, from);
    expect(index, part).toBeGreaterThan(-1);
    from = index + part.length;
  }
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

  it("stacks home/away, venue, LIVE, competition, date, then scheduled times", () => {
    const scheduled = stackMarkup(
      MatchHero({
        ...playedHome,
        status: "scheduled",
        date: "2026-03-15",
        kickoffTime: "10:00",
        meetupTime: "09:30",
        venueName: "Wembley",
        competitionName: "Premier League",
      }),
    );
    expectStackOrder(scheduled, [
      "Home",
      "Wembley",
      "Premier League",
      "Meet up: 09:30",
      "Kick off: 10:00",
    ]);
    expect(scheduled).toContain("font-bold");
    expect(scheduled).not.toContain("LiveIndicator");
    expect(scheduled).not.toContain("Meet up: 09:30 · Kick off: 10:00");
    expect(scheduled).not.toContain("Scheduled");
    expect(scheduled).not.toContain("Squad:");
  });

  it("keeps the same stack on compact, card, and hero sizes", () => {
    const props = {
      ...playedHome,
      status: "scheduled" as const,
      date: "2026-03-15",
      kickoffTime: "10:00",
      meetupTime: "09:30",
      venueName: "Wembley",
      competitionName: "Premier League",
    };
    for (const size of ["compact", "card", "hero"] as const) {
      const scheduled = stackMarkup(MatchHero({ ...props, size }));
      expectStackOrder(scheduled, [
        "Home",
        "Wembley",
        "Premier League",
        "Meet up: 09:30",
        "Kick off: 10:00",
      ]);
      expect(scheduled).not.toContain("Squad:");
      expect(scheduled).not.toContain('aria-label":"Cards"');
    }
  });

  it("omits missing venue, competition, and times", () => {
    const scheduled = stackMarkup(
      MatchHero({
        ...playedHome,
        status: "scheduled",
        date: "2026-03-15",
        kickoffTime: null,
        meetupTime: null,
        venueName: null,
        competitionName: null,
      }),
    );
    expect(scheduled).toContain("Home");
    expect(scheduled).not.toContain("Wembley");
    expect(scheduled).not.toContain("Premier League");
    expect(scheduled).not.toContain("Meet up:");
    expect(scheduled).not.toContain("Kick off:");
  });

  it("puts the LIVE chip after the venue and before competition", () => {
    const live = stackMarkup(
      MatchHero({
        ...playedHome,
        status: "in_progress",
        date: "2026-03-15",
        kickoffTime: "10:00",
        meetupTime: "09:30",
        venueName: "Wembley",
        competitionName: "Premier League",
      }),
    );
    expectStackOrder(live, [
      "Home",
      "Wembley",
      "LiveIndicator",
      "Premier League",
    ]);
    expect(live).not.toContain("Kick off: 10:00");
    expect(live).not.toContain("Meet up: 09:30");
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

  it("uses a paper masthead with a hero rail instead of a solid club fill", () => {
    const html = JSON.stringify(MatchHero(playedHome));
    expect(html).toContain("bg-card");
    expect(html).toContain("text-foreground");
    expect(html).toContain("border-hero-rail");
    expect(html).not.toContain("bg-hero");
    expect(html).not.toContain("text-header-foreground");
  });

  it("uses destructive text for cancelled and postponed on paper", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        status: "postponed",
      }),
    );
    expect(html).toContain("text-destructive");
    expect(html).not.toContain("text-red-300");
  });

  it("can put a share control under the score on a last-result card", () => {
    const html = JSON.stringify(
      MatchHero({ ...playedHome, size: "card", actions: "Share" }),
    );
    expect(html).toContain("Share");
    expect(html.indexOf("Share")).toBeGreaterThan(html.indexOf("text-5xl"));
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

  it("does not include a share slot on compact size", () => {
    const compact = JSON.stringify(
      MatchHero({ ...playedHome, size: "compact", actions: "Share" }),
    );
    expect(compact).not.toContain("Share");
  });
});
