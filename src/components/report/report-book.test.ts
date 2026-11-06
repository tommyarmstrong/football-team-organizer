import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportBook } from "@/components/report/report-book";
import { emptySeasonAwards } from "@/lib/report/season-awards";
import { sampleReportData } from "@/lib/report/sample";
import type { ReportContent } from "@/lib/report/types";

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
      "Back cover",
    ];
    const positions = order.map(first);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("ends with Notes then the back cover, on an even page count", () => {
    const labels = pageLabels(render());
    expect(labels.at(-1)).toBe("Back cover");
    expect(labels.at(-2)).toBe("Notes");
    expect(labels.length % 2).toBe(0);
  });

  it("still ends with a Notes page for a brand-new team", () => {
    const labels = pageLabels(render({ empty: true }));
    expect(labels.at(-2)).toBe("Notes");
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

describe("season at a glance page", () => {
  const html = render();
  const page = between(
    html,
    'aria-label="Season at a glance"',
    'aria-label="The season in numbers"',
  );

  it("calls the form box Results", () => {
    expect(page).toContain("Results · every match, in order");
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
