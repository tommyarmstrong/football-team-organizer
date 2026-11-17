import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: "a",
    props: { href, children },
  }),
}));

import { ScheduledIndicator } from "@/components/matches/match-header-meta";
import {
  MatchHero,
  matchHeroAriaLabel,
  matchHeroDigitClassName,
  matchHeroFrameClassName,
  matchHeroGroupClassName,
  matchHeroMetaClassName,
  matchHeroMetaItemClassName,
  matchHeroNameClassName,
  matchHeroScoreCellClassName,
  matchHeroShowsScore,
  matchHeroSideClassName,
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

  it("includes a share slot on compact size", () => {
    const compact = JSON.stringify(
      MatchHero({ ...playedHome, size: "compact", actions: "Share" }),
    );
    expect(compact).toContain("Share");
  });

  it("colours the scheduled chip with the win green and leaves it still", () => {
    const html = renderToStaticMarkup(createElement(ScheduledIndicator));
    expect(html).toContain("Scheduled");
    expect(html).toContain("text-win");
    expect(html).toContain("border-win");
    expect(html).not.toContain("scheduled-throb");
    expect(html).not.toContain("animate-");
    expect(html).not.toContain("text-red-600");
  });

  it("replaces vs with a static scheduled chip on summary cards", () => {
    for (const size of ["card", "compact"] as const) {
      const html = renderTree(
        MatchHero({
          ...playedHome,
          status: "scheduled",
          size,
          goalsFor: 0,
          goalsAgainst: 0,
        }),
      );
      expect(html).toContain("ScheduledIndicator");
      expect(html).not.toContain('"vs"');
    }
  });

  it("keeps vs on the match detail hero", () => {
    const html = JSON.stringify(
      MatchHero({
        ...playedHome,
        status: "scheduled",
        size: "hero",
        goalsFor: 0,
        goalsAgainst: 0,
      }),
    );
    expect(html).toContain("vs");
    expect(html).not.toContain("ScheduledIndicator");
  });
});

describe("MatchHero compact phone layout (detail hero)", () => {
  const props = {
    ...playedHome,
    size: "hero" as const,
    date: "2026-03-15",
    kickoffTime: "10:00",
    meetupTime: "09:30",
    venueName: "Wembley",
    venueId: "venue-1",
    competitionName: "Premier League",
  };

  it("puts home, score and away on one phone row and restores two columns from sm", () => {
    expect(matchHeroGroupClassName("hero")).toContain(
      "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    );
    expect(matchHeroGroupClassName("hero")).toContain("sm:grid-cols-2");
    expect(matchHeroScoreCellClassName("hero")).toContain("sm:col-span-2");
    expect(matchHeroScoreCellClassName("hero")).toContain("sm:row-start-2");
    expect(matchHeroSideClassName("hero", "home")).toContain("sm:col-start-1");
    expect(matchHeroSideClassName("hero", "away")).toContain("sm:col-start-2");
  });

  it("renders home, score, then away in document order when we are home", () => {
    const html = renderTree(MatchHero({ ...props, status: "played" }));
    const home = html.indexOf("MGA Select");
    const score = html.indexOf('"2"');
    const away = html.indexOf("Rose FC", score);
    expect(home).toBeGreaterThan(-1);
    expect(score).toBeGreaterThan(home);
    expect(away).toBeGreaterThan(score);
  });

  it("puts the opponent first and swaps the digits when MGA are away", () => {
    const html = renderTree(MatchHero({ ...props, homeAway: "away" }));
    const opponent = html.indexOf("Rose FC");
    const homeDigits = html.indexOf('"1"');
    const awayDigits = html.indexOf('"2"');
    const us = html.indexOf("MGA Select", awayDigits);
    expect(opponent).toBeGreaterThan(-1);
    expect(homeDigits).toBeGreaterThan(opponent);
    expect(awayDigits).toBeGreaterThan(homeDigits);
    expect(us).toBeGreaterThan(awayDigits);
    expect(html).toContain("Rose FC 1-2 MGA Select");
  });

  it("drops the redundant HOME/AWAY labels on phones only, and only on the hero", () => {
    const hero = renderTree(MatchHero(props));
    expect(hero.match(/max-sm:hidden/g)?.length).toBe(3);
    // Still present (hidden below sm) so the desktop layout is unchanged.
    expect(hero).toContain('"Home"');
    for (const size of ["card", "compact"] as const) {
      const html = renderTree(MatchHero({ ...props, size }));
      expect(html).not.toContain("max-sm:");
      expect(html).toContain('"Home"');
    }
  });

  it("scales the score down on phones and back up from sm", () => {
    expect(matchHeroDigitClassName("hero")).toBe("text-4xl sm:text-6xl");
  });

  it("wraps long names to two lines on phones, truncating on desktop, and keeps the full name", () => {
    const html = renderTree(
      MatchHero({
        ...props,
        opponentName: "Upper Wolverhampton Athletic Youth Development Squad",
      }),
    );
    expect(matchHeroNameClassName("hero")).toContain("max-sm:line-clamp-2");
    expect(matchHeroNameClassName("hero")).toContain("sm:truncate");
    expect(matchHeroNameClassName("hero")).toContain("break-words");
    expect(html).toContain(
      '"title":"Upper Wolverhampton Athletic Youth Development Squad"',
    );
    expect(html).toContain("Upper Wolverhampton Athletic Youth");
    expect(html).toContain("min-w-0");
  });

  it("flows venue, competition and date inline on phones with separators", () => {
    expect(matchHeroMetaClassName("hero")).toContain("flex-wrap");
    expect(matchHeroMetaClassName("hero")).toContain("sm:block");
    expect(matchHeroMetaItemClassName("hero")).toContain(
      String.raw`after:content-['\00b7']`,
    );
    expect(matchHeroMetaItemClassName("card")).toBe("");
    expect(matchHeroMetaClassName("card")).toBe(
      "text-muted-foreground mt-4 space-y-1 text-center text-sm",
    );
  });

  it("keeps every meta field, in order, on the compact hero", () => {
    const scheduled = stackMarkup(MatchHero({ ...props, status: "scheduled" }));
    expectStackOrder(scheduled, [
      "Wembley",
      "Premier League",
      "Meet up: 09:30",
      "Kick off: 10:00",
    ]);
    expect(scheduled).toContain("/venues/venue-1");
  });

  it("omits missing metadata without leaving empty items", () => {
    const html = renderTree(
      MatchHero({
        ...playedHome,
        size: "hero",
        homeAway: null,
        date: undefined,
        venueName: null,
        competitionName: null,
      }),
    );
    expect(html).not.toContain("match-card-stack");
    expect(html).toContain("MGA Select 2-1 Rose FC");
  });

  it("still shows vs with no scheduled badge, and status text for cancelled", () => {
    const scheduled = renderTree(
      MatchHero({
        ...props,
        status: "scheduled",
        goalsFor: 0,
        goalsAgainst: 0,
      }),
    );
    expect(scheduled).toContain('"vs"');
    expect(scheduled).not.toContain("ScheduledIndicator");

    const cancelled = renderTree(MatchHero({ ...props, status: "cancelled" }));
    expect(cancelled).toContain("Cancelled");
    expect(cancelled).toContain("col-span-full");
    expect(cancelled).toContain("text-destructive");
  });

  it("keeps the share, edit and delete slot under the hero with a 44px row", () => {
    const html = renderTree(MatchHero({ ...props, actions: "ACTIONS" }));
    expect(html).toContain("ACTIONS");
    expect(html).toContain("min-h-11");
    expect(html.indexOf("ACTIONS")).toBeGreaterThan(html.indexOf("text-4xl"));
  });

  it("uses tighter phone padding but the original desktop padding", () => {
    const html = renderTree(MatchHero(props));
    expect(html).toContain("px-4 py-3 sm:px-6 sm:py-6");
    const live = renderTree(MatchHero({ ...props, status: "in_progress" }));
    expect(live).toContain("px-4 py-3 sm:px-6 sm:py-4");
  });
});
