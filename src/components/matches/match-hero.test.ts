import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () =>
  (await import("@/components/matches/match-card-test-utils")).nextLinkMock(),
);

import {
  dateRowHtml,
  expectInOrder,
  expectSharedCardLayout,
  metaStackHtml,
  renderCard,
  visibleText,
} from "@/components/matches/match-card-test-utils";
import { matchSummaryLines } from "@/lib/format";

import {
  MatchHero,
  matchHeroAriaLabel,
  matchHeroDigitClassName,
  matchHeroFrameClassName,
  matchHeroGroupClassName,
  matchHeroNameClassName,
  matchHeroRailClassName,
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
  it("scales digits by surface, smaller on phones", () => {
    expect(matchHeroDigitClassName("hero")).toBe("text-4xl sm:text-6xl");
    expect(matchHeroDigitClassName("card")).toBe("text-4xl sm:text-5xl");
    expect(matchHeroDigitClassName("compact")).toBe("text-4xl");
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

describe("matchHero row layout helpers", () => {
  it("is one home | score | away row at every breakpoint", () => {
    const group = matchHeroGroupClassName();
    expect(group).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    // No breakpoint-specific regrouping: desktop matches mobile.
    expect(group).not.toMatch(/\b(sm|md|lg):/);
  });

  it("aligns each name towards the score", () => {
    expect(matchHeroSideClassName("home")).toContain("text-right");
    expect(matchHeroSideClassName("away")).toContain("text-left");
  });

  it("wraps long names to two lines on every size", () => {
    for (const size of ["hero", "card", "compact"] as const) {
      expect(matchHeroNameClassName(size)).toContain("line-clamp-2");
      expect(matchHeroNameClassName(size)).toContain("break-words");
    }
  });
});

const scheduledProps = {
  ...playedHome,
  status: "scheduled" as const,
  goalsFor: 0,
  goalsAgainst: 0,
  date: "2026-03-15",
  kickoffTime: "10:00",
  meetupTime: "09:30",
  venueName: "Wembley",
  competitionName: "Premier League",
};

const sizes = ["hero", "card", "compact"] as const;

describe("MatchHero", () => {
  it("renders home-first digits for a played home win", () => {
    const html = renderCard(createElement(MatchHero, playedHome));
    expect(html).toContain("MGA Select 2-1 Rose FC");
    expect(visibleText(html)).toContain("MGA Select 2 – 1 Rose FC");
    expect(html).not.toContain(">vs<");
  });

  it("puts the opponent first and swaps the digits when we are away", () => {
    const html = renderCard(
      createElement(MatchHero, { ...playedHome, homeAway: "away" }),
    );
    expect(html).toContain("Rose FC 1-2 MGA Select");
    expect(visibleText(html)).toContain("Rose FC 1 – 2 MGA Select");
  });

  it("shows vs with no digits for scheduled hero matches", () => {
    const html = renderCard(
      createElement(MatchHero, { ...scheduledProps, size: "hero" }),
    );
    expect(html).toContain(">vs<");
    expect(html).not.toContain("font-display");
    expect(html).not.toContain(">LIVE<");
  });

  it("shows a static scheduled chip instead of vs on summary cards", () => {
    for (const size of ["card", "compact"] as const) {
      const html = renderCard(
        createElement(MatchHero, { ...scheduledProps, size }),
      );
      expect(html).toContain(">Scheduled<");
      expect(html).not.toContain(">vs<");
    }
  });

  it("shows status text instead of a score for postponed and cancelled", () => {
    for (const status of ["postponed", "cancelled"] as const) {
      const html = renderCard(
        createElement(MatchHero, { ...playedHome, status }),
      );
      expect(html).toContain(">vs<");
      expect(html).toContain(
        status === "postponed" ? "Postponed" : "Cancelled",
      );
      expect(html).toContain("text-destructive");
      expect(html).toContain("col-span-full");
    }
  });

  it("uses a paper masthead with a result-coloured rail instead of a solid club fill", () => {
    const html = renderCard(createElement(MatchHero, playedHome));
    expect(html).toContain("bg-card");
    expect(html).toContain("border-l-[3px]");
    expect(html).not.toContain("border-hero-rail");
    expect(html).not.toContain("bg-hero");
    expect(html).not.toContain("text-header-foreground");
  });

  it("keeps the full name in the title and wraps it on every size", () => {
    const opponentName = "Upper Wolverhampton Athletic Youth Development Squad";
    for (const size of sizes) {
      const html = renderCard(
        createElement(MatchHero, { ...playedHome, size, opponentName }),
      );
      expect(html).toContain(`title="${opponentName}"`);
      expect(html).toContain("line-clamp-2");
    }
  });

  it("puts share/edit/delete under the card with a 44px row", () => {
    for (const size of sizes) {
      const html = renderCard(
        createElement(MatchHero, { ...playedHome, size, actions: "ACTIONS" }),
      );
      expect(html.indexOf("ACTIONS")).toBeGreaterThan(
        html.indexOf("font-display"),
      );
      expect(html).toContain("min-h-11");
    }
  });

  it("uses tighter phone padding but the original desktop padding on the hero", () => {
    const html = renderCard(
      createElement(MatchHero, { ...playedHome, size: "hero" }),
    );
    expect(html).toContain("px-4 py-3 sm:px-6 sm:py-6");
  });

  it("links the whole card when given an href, and the venue only on the hero", () => {
    const card = renderCard(
      createElement(MatchHero, {
        ...scheduledProps,
        size: "card",
        href: "/matches/1",
        venueId: "venue-1",
      }),
    );
    expect(card).toContain('href="/matches/1"');
    expect(card).not.toContain("/venues/venue-1");

    const hero = renderCard(
      createElement(MatchHero, {
        ...scheduledProps,
        size: "hero",
        venueId: "venue-1",
      }),
    );
    expect(hero).toContain('href="/venues/venue-1"');
  });
});

describe("MatchHero layout is identical on every size", () => {
  for (const size of sizes) {
    it(`${size}: names flank the score, no HOME/AWAY text`, () => {
      expectSharedCardLayout(
        renderCard(createElement(MatchHero, { ...scheduledProps, size })),
        { homeName: "MGA Select", awayName: "Rose FC" },
      );
      expectSharedCardLayout(
        renderCard(
          createElement(MatchHero, {
            ...scheduledProps,
            size,
            homeAway: "away",
          }),
        ),
        { homeName: "Rose FC", awayName: "MGA Select" },
      );
    });
  }

  it("never renders HOME or AWAY, even with a home/away value set", () => {
    for (const homeAway of ["home", "away", null] as const) {
      const html = renderCard(
        createElement(MatchHero, { ...scheduledProps, homeAway }),
      );
      expect(visibleText(html)).not.toMatch(/\b(Home|Away)\b/i);
    }
  });

  it("puts the LIVE pill directly above the score on every size", () => {
    for (const size of sizes) {
      const html = renderCard(
        createElement(MatchHero, {
          ...scheduledProps,
          status: "in_progress",
          goalsFor: 1,
          goalsAgainst: 0,
          size,
        }),
      );
      expectSharedCardLayout(html, {
        homeName: "MGA Select",
        awayName: "Rose FC",
        live: true,
      });
      expect(html).toContain("live-throb");
      // The pill is a sibling above the names/score row, not inside the meta.
      expect(metaStackHtml(html)).not.toContain(">LIVE<");
      expect(html.indexOf(">LIVE<")).toBeLessThan(html.indexOf("font-display"));
      // Scheduled-only times are not shown while live.
      expect(html).not.toContain("Kick off");
    }
  });

  it("shows no LIVE pill unless in progress", () => {
    for (const status of ["scheduled", "played", "postponed"] as const) {
      expect(
        renderCard(createElement(MatchHero, { ...playedHome, status })),
      ).not.toContain(">LIVE<");
    }
  });
});

describe("MatchHero meta under the score", () => {
  for (const size of sizes) {
    it(`${size}: competition (bold), venue, then date · meet up · kick off`, () => {
      const html = renderCard(
        createElement(MatchHero, { ...scheduledProps, size }),
      );
      const stack = metaStackHtml(html);
      const lines = matchSummaryLines({
        competitionName: "Premier League",
        date: "2026-03-15",
        kickoffTime: "10:00",
        meetupTime: "09:30",
        venueName: "Wembley",
        status: "scheduled",
      });
      expectInOrder(stack, [
        "Premier League",
        "Wembley",
        lines.dateTime,
        "Meet up: 09:30",
        "Kick off: 10:00",
      ]);
      // Competition is the only bold line; venue and date are regular weight.
      expect(stack.match(/font-bold/g)?.length).toBe(1);
      expect(stack).toMatch(
        /<p class="text-foreground font-bold">Premier League<\/p>/,
      );
      expect(stack).not.toContain("font-medium");
      expect(stack).not.toContain("font-semibold");
    });

    it(`${size}: date, meet up and kick off share one centred row with dots`, () => {
      const row = dateRowHtml(
        renderCard(createElement(MatchHero, { ...scheduledProps, size })),
      );
      const lines = matchSummaryLines({
        date: "2026-03-15",
        kickoffTime: "10:00",
        meetupTime: "09:30",
        status: "scheduled",
      });
      expect(row).toBe(
        `<span>${lines.dateTime}</span><span aria-hidden="true">·</span>` +
          `<span>Meet up: 09:30</span><span aria-hidden="true">·</span>` +
          `<span>Kick off: 10:00</span>`,
      );
      expect(
        renderCard(createElement(MatchHero, { ...scheduledProps, size })),
      ).toContain("flex flex-wrap items-center justify-center");
    });
  }

  it("uses one font size for every meta line", () => {
    const html = renderCard(createElement(MatchHero, scheduledProps));
    const stack = metaStackHtml(html);
    // Size is set once on the container; no line overrides it.
    expect(stack).toContain("text-xs");
    expect(stack).toContain("sm:text-sm");
    expect(stack.match(/(?<![:\w-])text-(xs|sm|base|lg)\b/g)?.length).toBe(1);
  });

  it("shows only the date for played matches and omits missing fields", () => {
    const played = renderCard(
      createElement(MatchHero, { ...scheduledProps, status: "played" }),
    );
    const row = dateRowHtml(played);
    expect(row).not.toContain("Meet up");
    expect(row).not.toContain("·");

    const sparse = renderCard(
      createElement(MatchHero, {
        ...scheduledProps,
        venueName: null,
        competitionName: null,
        kickoffTime: null,
        meetupTime: null,
      }),
    );
    const stack = metaStackHtml(sparse);
    expect(stack).not.toContain("Wembley");
    expect(stack).not.toContain("Premier League");
    expect(stack).not.toContain("font-bold");
    expect(dateRowHtml(sparse)).not.toContain("·");
  });

  it("renders no meta block without a date", () => {
    const html = renderCard(
      createElement(MatchHero, {
        ...playedHome,
        size: "hero",
        date: undefined,
        venueName: "Wembley",
      }),
    );
    expect(html).not.toContain("match-card-stack");
    expect(html).toContain("MGA Select 2-1 Rose FC");
  });
});

/** The masthead's own classes, where the rail colour lives (not the Scheduled chip's). */
function mastheadClasses(html: string): string {
  const match = html.match(/class="(bg-card text-foreground [^"]*)"/);
  expect(match, "masthead present").not.toBeNull();
  return match?.[1] ?? "";
}

describe("match card rail colour", () => {
  const cases = [
    ["win", { goalsFor: 2, goalsAgainst: 1 }, "text-win", "border-win"],
    ["draw", { goalsFor: 1, goalsAgainst: 1 }, "text-draw", "border-draw"],
    ["loss", { goalsFor: 0, goalsAgainst: 3 }, "text-loss", "border-loss"],
  ] as const;

  it("maps each result to its rail colour", () => {
    expect(matchHeroRailClassName("W")).toBe("border-win");
    expect(matchHeroRailClassName("D")).toBe("border-draw");
    expect(matchHeroRailClassName("L")).toBe("border-loss");
    expect(matchHeroRailClassName(null)).toContain("border-muted-foreground");
  });

  for (const size of sizes) {
    for (const [name, goals, scoreClass, railClass] of cases) {
      for (const status of ["played", "in_progress"] as const) {
        it(`${size} ${status} ${name}: rail matches the score colour`, () => {
          const html = renderCard(
            createElement(MatchHero, { ...playedHome, ...goals, status, size }),
          );
          expect(html).toContain(scoreClass);
          const rail = mastheadClasses(html);
          expect(rail).toContain(railClass);
          // Exactly one rail colour.
          expect(rail.match(/border-(win|draw|loss)\b/g)?.length).toBe(1);
        });
      }
    }

    it(`${size}: rail follows the result for an away team too`, () => {
      // Away win 1-2: our goals_for is 2.
      const html = renderCard(
        createElement(MatchHero, {
          ...playedHome,
          homeAway: "away",
          goalsFor: 2,
          goalsAgainst: 1,
          size,
        }),
      );
      expect(mastheadClasses(html)).toContain("border-win");
    });

    it(`${size}: rail is grey for scheduled, postponed and cancelled`, () => {
      for (const status of ["scheduled", "postponed", "cancelled"] as const) {
        const html = renderCard(
          createElement(MatchHero, {
            ...playedHome,
            status,
            goalsFor: 5,
            goalsAgainst: 0,
            size,
          }),
        );
        const rail = mastheadClasses(html);
        expect(rail).toContain("border-muted-foreground/40");
        expect(rail).not.toMatch(/border-(win|draw|loss)\b/);
        expect(html).not.toContain("border-hero-rail");
      }
    });
  }
});
