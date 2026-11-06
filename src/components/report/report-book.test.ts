import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportBook } from "@/components/report/report-book";
import { emptySeasonAwards } from "@/lib/report/season-awards";
import { sampleReportData } from "@/lib/report/sample";
import type {
  ReportContent,
  ReportData,
  ReportMatch,
} from "@/lib/report/types";

const content: ReportContent = {
  coachNotes: { expectedPath: "a", markdown: null },
  lookingAhead: { expectedPath: "b", markdown: null },
  seasonAwards: emptySeasonAwards("c"),
};

function render(
  options: Parameters<typeof sampleReportData>[1] = {},
  overrides: Partial<ReportContent> = {},
): string {
  const data = sampleReportData({ ...content, ...overrides }, options);
  return renderToStaticMarkup(createElement(ReportBook, { data }));
}

/** The aria-label of every page, in printed order. */
function pageLabels(html: string): string[] {
  return [
    ...html.matchAll(
      /<section class="report-sheet[^"]*" aria-label="([^"]*)"/g,
    ),
  ].map((m) => m[1]!);
}

/** The markup from the first `start` up to the next `end`. */
function between(html: string, start: string, end: string): string {
  const from = html.indexOf(start);
  expect(from).toBeGreaterThanOrEqual(0);
  const to = html.indexOf(end, from + start.length);
  return html.slice(from, to === -1 ? undefined : to);
}

describe("report book page order", () => {
  it("prints the sections in the requested order", () => {
    const labels = pageLabels(render());
    const first = (label: string) => labels.indexOf(label);
    const order = [
      "Cover",
      "Inside cover",
      // The team info page is labelled with the team name.
      "Rangers U10 Lions",
      "Coach&#x27;s notes",
      "Season at a glance",
      "The season in numbers",
      "Player Gallery",
      "Competitions",
      "Venues",
      "Results",
      "Awards",
      "Looking ahead",
      "Autographs",
      "Notes",
      "Inside back cover",
      "Back cover",
    ];
    const positions = order.map(first);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("ends with Notes, a blank inside back cover, then the back cover", () => {
    const labels = pageLabels(render());
    expect(labels.at(-1)).toBe("Back cover");
    expect(labels.at(-2)).toBe("Inside back cover");
    expect(labels.at(-3)).toBe("Notes");
    expect(labels.length % 2).toBe(0);
  });

  it("still ends with the same pages for a brand-new team", () => {
    const labels = pageLabels(render({ empty: true }));
    expect(labels.slice(-3)).toEqual([
      "Notes",
      "Inside back cover",
      "Back cover",
    ]);
    expect(labels.length % 2).toBe(0);
  });
});

describe("cover pages", () => {
  it("puts a blank cover page as page 2 and the team info on page 3", () => {
    const labels = pageLabels(render());
    expect(labels.slice(0, 3)).toEqual([
      "Cover",
      "Inside cover",
      "Rangers U10 Lions",
    ]);
  });

  it("keeps the inside covers blank: no text, heading or footer", () => {
    const html = render();
    for (const label of ["Inside cover", "Inside back cover"]) {
      const start = html.indexOf(`aria-label="${label}"`);
      expect(start).toBeGreaterThanOrEqual(0);
      const page = html.slice(start, html.indexOf("</section>", start));
      expect(page).not.toMatch(/<h[1-6]/);
      expect(page).not.toContain("<footer");
      expect(page).not.toMatch(/<p[\s>]/);
      expect(
        page
          .replace(/<[^>]*>/g, "")
          .replace(/^[^>]*>/, "")
          .trim(),
      ).toBe("");
      expect(page).toContain("bg-(--club)");
    }
  });

  it("puts the blank page straight before the back cover with the thank you", () => {
    const html = render();
    const blank = html.indexOf('aria-label="Inside back cover"');
    const back = html.indexOf('aria-label="Back cover"');
    expect(blank).toBeGreaterThan(0);
    expect(back).toBeGreaterThan(blank);
    expect(html.slice(blank, back)).not.toContain("Thank you");
    expect(html.slice(back)).toContain("Thank you");
  });

  it("keeps the front and back covers on odd and even sheets", () => {
    const labels = pageLabels(render());
    // The cover is page 1 (right-hand); the back cover is the last, even page.
    expect(labels.indexOf("Cover") + 1).toBe(1);
    expect(labels.length % 2).toBe(0);
  });
});

describe("team info page", () => {
  it("leaves out the photo and its placeholder when there is no team photo", () => {
    const html = render({ withPhoto: false });
    const page = between(
      html,
      'aria-label="Rangers U10 Lions"',
      'aria-label="Coach',
    );
    expect(page).not.toContain("team photo");
    expect(page).not.toContain("Team photo");
    expect(page).toContain("Head coach");
  });

  it("shows the team photo when there is one", () => {
    const html = render({ withPhoto: true });
    const page = between(
      html,
      'aria-label="Rangers U10 Lions"',
      'aria-label="Coach',
    );
    expect(page).toContain("team photo");
  });
});

describe("player gallery page", () => {
  it("lays the cards out three across", () => {
    const html = render();
    const gallery = between(
      html,
      'aria-label="Player Gallery"',
      'aria-label="Competitions"',
    );
    expect(gallery).toContain("grid-template-columns:repeat(3, 1fr)");
  });

  it("puts at most nine cards on a page", () => {
    const html = render();
    const pages = html.split('aria-label="Player Gallery"').slice(1);
    for (const page of pages) {
      const body = page.split("</section>")[0]!;
      const cards = body.match(/data-report-card=/g) ?? [];
      expect(cards.length).toBeLessThanOrEqual(9);
    }
  });
});

describe("player gallery card text", () => {
  const html = render();
  const gallery = between(
    html,
    'aria-label="Player Gallery"',
    'aria-label="Competitions"',
  );

  it("leaves the club name off every card", () => {
    // The page footer still carries the club name; only the cards must not.
    const cards = gallery.split("<footer")[0]!;
    const data = sampleReportData(content);
    expect(cards).toContain("data-report-card=");
    expect(cards).not.toContain(data.club.name);
  });

  it("prints the team name and year in bold, larger than before", () => {
    const data = sampleReportData(content);
    const teamLine = `${data.players[0]!.card.teamName} · ${data.team.seasonLabel}`;
    const at = gallery.indexOf(teamLine);
    expect(at).toBeGreaterThan(0);
    const open = gallery.lastIndexOf("<div", at);
    const style = gallery.slice(open, at);
    expect(style).toContain("font-weight:700");
    const size = Number(/font-size:(\d+)px/.exec(style)![1]);
    expect(size).toBeGreaterThan(30);
  });

  it("sets the goals, assists and POTM line larger than before", () => {
    const at = gallery.indexOf("Goals ");
    expect(at).toBeGreaterThan(0);
    const open = gallery.lastIndexOf("<div", at);
    const size = Number(/font-size:(\d+)px/.exec(gallery.slice(open, at))![1]);
    expect(size).toBeGreaterThan(30);
    expect(gallery).toContain("POTM");
  });

  it("applies to every card, coaches included", () => {
    const cards = gallery.match(/data-report-card=/g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    const bold = gallery.match(/font-weight:700;[^"]*"[^>]*>[^<]* · 2025\/26/g);
    expect(bold?.length ?? 0).toBeGreaterThanOrEqual(cards.length);
  });
});

describe("venues page", () => {
  const html = render();
  const page = between(html, 'aria-label="Venues"', 'aria-label="Results"');

  it("no longer shows addresses, parking or food and drink", () => {
    for (const text of [
      "Mill Lane",
      "Kingsfield Road",
      "Parking",
      "Food and drink",
      "Cafe",
      "Ice cream",
    ]) {
      expect(page).not.toContain(text);
    }
  });

  it("shows the venue photo under the name and above the results", () => {
    const card = between(page, "Riverside Park", "Kingsfield Astro");
    const photo = card.indexOf("<img");
    expect(photo).toBeGreaterThan(0);
    expect(card).toContain("Photo of Riverside Park");
    expect(card).toContain("/player-card-photo.jpg");
    expect(photo).toBeGreaterThan(card.indexOf("Riverside Park"));
    expect(photo).toBeLessThan(card.indexOf("Played 12"));
  });

  it("leaves the photo out when the venue has none", () => {
    const card = between(page, "Kingsfield Astro", "Oakwood Sports Ground");
    expect(card).not.toContain("<img");
    expect(card).toContain("Played 5");
  });

  it("keeps the results section for every venue", () => {
    expect(page).toContain("Played 12");
    expect(page).toContain("W8 D2 L2");
    expect(page).toContain("Goals 31");
    expect(page).toContain("Biggest win 6–0 v Harbour Town");
    expect(page.match(/Played \d+/g)).toHaveLength(4);
  });
});

describe("notes page", () => {
  const html = render();
  const page = between(
    html,
    'aria-label="Notes"',
    'aria-label="Inside back cover"',
  );

  it("is a solid white box with a club colour border, like Autographs", () => {
    expect(page).toContain("bg-white");
    expect(page).toContain("border-(--club)");
    expect(page).toContain("rounded-[7mm]");
    const autographs = between(
      html,
      'aria-label="Autographs"',
      'aria-label="Notes"',
    );
    expect(autographs).toContain("bg-white");
    expect(autographs).toContain("border-(--club)");
  });

  it("keeps the ruled lines inside the box", () => {
    expect(page).toContain("overflow-hidden");
    expect(page.match(/data-notes-line=""/g)!.length).toBeGreaterThanOrEqual(
      24,
    );
    expect(page).toContain("border-(--club-line)");
  });
});

describe("season at a glance page", () => {
  const html = render();
  const page = between(
    html,
    'aria-label="Season at a glance"',
    'aria-label="The season in numbers"',
  );

  it("calls the form box Results", () => {
    expect(page).toContain("Results · every league and cup match, in order");
    expect(page).not.toContain("Form ·");
  });

  it("calls the last chart Results through the season", () => {
    expect(page).toContain("Results through the season");
    expect(page).not.toContain("3 for a win");
  });

  it("gives Goals scored the same dark tile as Played", () => {
    const tile = (label: string) => {
      const at = page.indexOf(label);
      const open = page.lastIndexOf('<div class="', at);
      return page.slice(open, at);
    };
    const played = tile("Played");
    const scored = tile("Goals scored");
    expect(played).toContain("bg-(--club)");
    expect(scored).toContain("bg-(--club)");
    expect(scored).toContain("text-(--club-fg)");
    // Won and conceded stay on the pale tile.
    expect(tile("Won")).not.toContain("bg-(--club) ");
    expect(tile("Goals conceded")).toContain("bg-(--club-soft)");
  });
});

describe("season in numbers page", () => {
  it("no longer carries the date order caption", () => {
    const html = render();
    expect(html).not.toContain("Numbered in date order");
  });
});

describe("league and cup data", () => {
  // The sample season plus a tournament game and a friendly that only the
  // Results pages may show.
  const tournament: ReportMatch = {
    id: "extra-tournament",
    date: "2026-05-02",
    opponent: "Tournament Tigers",
    homeAway: "neutral",
    competitionId: "sample-tournament",
    competitionKind: "tournament",
    competitionLabel: "Summer Cup",
    isFriendly: false,
    goalsFor: 9,
    goalsAgainst: 0,
    result: "W",
  };
  const friendly: ReportMatch = {
    ...tournament,
    id: "extra-friendly",
    opponent: "Friendly Foxes",
    competitionId: null,
    competitionKind: null,
    competitionLabel: "Friendly",
    isFriendly: true,
  };

  const base = sampleReportData(content);
  const data: ReportData = {
    ...base,
    matches: [...base.matches, tournament, friendly],
  };
  const html = renderToStaticMarkup(createElement(ReportBook, { data }));

  it("lists every game, including tournaments and friendlies, on Results", () => {
    const results = between(
      html,
      'aria-label="Results"',
      'aria-label="Awards"',
    );
    expect(results).toContain("Tournament Tigers");
    expect(results).toContain("Friendly Foxes");
  });

  it("leaves tournaments and friendlies out of Season at a glance", () => {
    const page = between(
      html,
      'aria-label="Season at a glance"',
      'aria-label="The season in numbers"',
    );
    expect(page).not.toContain("Tournament Tigers");
    expect(page).not.toContain("Friendly Foxes");
    expect(page).toContain(
      `<p class="font-display text-[22mm] leading-[0.9] font-semibold">${base.leagueCupMatches.length}</p>`,
    );
    expect(page).toContain("League and cup matches only");
  });

  it("leaves them out of the goals chart on The season in numbers", () => {
    const page = between(
      html,
      'aria-label="The season in numbers"',
      'aria-label="Player Gallery"',
    );
    expect(page).not.toContain("Tournament Tigers");
    expect(page).not.toContain("Friendly Foxes");
    expect(page).toContain("Goals in every league and cup match");
  });

  it("shows a league and cup message when only other games were played", () => {
    const onlyOther = renderToStaticMarkup(
      createElement(ReportBook, {
        data: {
          ...data,
          matches: [tournament, friendly],
          leagueCupMatches: [],
        },
      }),
    );
    const page = between(
      onlyOther,
      'aria-label="Season at a glance"',
      'aria-label="The season in numbers"',
    );
    expect(page).toContain("No league or cup matches have been played yet.");
  });

  it("names the competitions page for league and cups", () => {
    const page = between(
      html,
      'aria-label="Competitions"',
      'aria-label="Venues"',
    );
    expect(page).toContain("League and cups");
    expect(page).not.toContain("League, cups and tournaments");
  });
});

describe("awards page", () => {
  const awards = {
    seasonAwards: {
      expectedPath: "c",
      playerOfTheSeason: "Isaac",
      playersPlayer: "Finn",
      mostImproved: "George",
    },
  };

  it("is called Awards, not Records", () => {
    const labels = pageLabels(render());
    expect(labels).toContain("Awards");
    expect(labels).not.toContain("Records");
  });

  it("shows the three season award boxes above the coaching team", () => {
    const html = render({}, awards);
    const page = between(
      html,
      'aria-label="Awards"',
      'aria-label="Looking ahead"',
    );
    const player = page.indexOf("Player of the season");
    const playersPlayer = page.indexOf("Player&#x27;s player of the season");
    const improved = page.indexOf("Most improved player of the season");
    const thanks = page.indexOf("Thank you to the coaching team");
    expect(player).toBeGreaterThan(0);
    expect(playersPlayer).toBeGreaterThan(player);
    expect(improved).toBeGreaterThan(playersPlayer);
    expect(thanks).toBeGreaterThan(improved);
    expect(page).toContain(">Isaac<");
    expect(page).toContain(">Finn<");
    expect(page).toContain(">George<");
  });

  it("prints blank write-in lines when no winner is chosen", () => {
    const page = between(
      render(),
      'aria-label="Awards"',
      'aria-label="Looking ahead"',
    );
    expect(page.match(/Blank line to write the winner/g)).toHaveLength(3);
  });

  it("puts the season awards between the player of the month and the coaches", () => {
    const page = between(
      render({}, awards),
      'aria-label="Awards"',
      'aria-label="Looking ahead"',
    );
    expect(page.indexOf("Player of the month")).toBeLessThan(
      page.indexOf("Player of the season"),
    );
  });

  it("sets the player of the month in small text", () => {
    const page = between(
      render(),
      'aria-label="Awards"',
      'aria-label="Looking ahead"',
    );
    const list = between(page, "Player of the month", "Awards for the season");
    expect(list).toContain("text-[10.5pt]");
    expect(list).not.toContain("text-[15pt]");
    // Names are first names only.
    expect(list).toContain(">Finn<");
    expect(list).not.toContain("Gallagher");
  });
});

describe("first names only", () => {
  it("prints no player surname anywhere, but keeps coaches' full names", () => {
    const html = render();
    for (const surname of [
      "Harper",
      "Okafor",
      "Gallagher",
      "Moreau",
      "Nwosu",
    ]) {
      expect(html).not.toContain(surname);
    }
    expect(html).toContain("Sam Whitfield");
  });
});

describe("back cover", () => {
  it("thanks the coaches too", () => {
    const html = render();
    const back = between(html, 'aria-label="Back cover"', "</section>");
    expect(back.replace(/<!-- -->/g, "")).toContain(
      "To every player, coach, parent, guardian and volunteer who made 2025/26 possible.",
    );
  });
});
