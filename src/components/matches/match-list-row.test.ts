import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () =>
  (await import("@/components/matches/match-card-test-utils")).nextLinkMock(),
);
vi.mock("@/components/postcards/match-card-share", async () => {
  const { createElement } = await import("react");
  return {
    MatchCardShare: ({ matchId }: { matchId: string }) =>
      createElement("button", {
        type: "button",
        "aria-label": "Share postcard",
        "data-share-for": matchId,
      }),
  };
});

import { createElement } from "react";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { MatchStatus } from "@/lib/supabase/database.types";
import {
  expectInOrder,
  renderCard,
  visibleText,
} from "@/components/matches/match-card-test-utils";
import {
  MatchListRow,
  matchListContainerClassName,
  matchListMetaLine,
  matchListRowNameClassName,
} from "@/components/matches/match-list-row";

function match(
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    id: "match-1",
    opponent_name: "France",
    home_away: "home",
    status: "played",
    goals_for: 3,
    goals_against: 1,
    date: "2026-11-15",
    kickoff_time: "20:08:00",
    meetup_time: "19:08:00",
    is_friendly: false,
    stage: null,
    venue: { id: "venue-1", name: "Anfield" },
    competition: {
      id: "comp-1",
      name: "North London League",
      display_name: "North London League",
      kind: "league",
    },
    ...overrides,
  } as MatchWithRelations;
}

function row(overrides: Partial<MatchWithRelations> = {}): string {
  return renderCard(
    createElement(MatchListRow, {
      match: match(overrides),
      teamName: "MGA Select",
    }),
  );
}

describe("MatchListRow layout", () => {
  it("orders date, names and score, then competition · venue", () => {
    const html = row();
    expectInOrder(html, [
      'data-slot="match-list-row-date"',
      "MGA Select",
      'data-slot="match-list-row-score"',
      "France",
      'data-slot="match-list-row-meta"',
    ]);
  });

  it("puts the date alone on the top line, with no meet up or kick off times", () => {
    const html = row({ status: "scheduled" });
    const date = html.match(
      /<p[^>]*data-slot="match-list-row-date"[^>]*>(.*?)<\/p>/,
    );
    expect(date?.[1]).toBe("Sun, 15 Nov 2026");
    expect(visibleText(html)).not.toMatch(/meet up|kick off|20:08|19:08/i);
  });

  it("joins competition and venue with a middle dot on one line", () => {
    const html = row();
    expect(html).toContain(">North London League · Anfield<");
    expect(html).toContain("truncate");
    expect(html).toContain('title="North London League · Anfield"');
  });

  it("includes the stage in the competition and drops a missing venue", () => {
    const html = row({ stage: "group", venue: null });
    const text = visibleText(html);
    expect(text).toContain("North London League · Group");
    expect(text).not.toContain("Anfield");
  });

  it("omits the meta line when there is no competition or venue", () => {
    const html = row({ competition: null, venue: null });
    expect(html).not.toContain('data-slot="match-list-row-meta"');
  });

  it("has no left stripe, individual card radius or per-row shadow", () => {
    const html = row();
    expect(html).not.toMatch(/border-l-|rounded-(2xl|3xl)|shadow-md|ring-1/);
  });

  it("keeps a three-column grid that wraps long names without overlapping the score", () => {
    const html = row({
      opponent_name: "Afc Wimbledon Under Elevens Development Academy Orange",
    });
    expect(html).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(matchListRowNameClassName).toContain("line-clamp-2");
    expect(matchListRowNameClassName).toContain("min-w-0");
    expect(matchListRowNameClassName).toContain("break-words");
    expect(html).toContain(
      'title="Afc Wimbledon Under Elevens Development Academy Orange"',
    );
  });
});

describe("MatchListRow home/away order and score", () => {
  it("puts our team first and shows the score home first when at home", () => {
    const html = row();
    expect(html.indexOf("MGA Select")).toBeLessThan(html.indexOf("France"));
    expect(visibleText(html)).toContain("MGA Select 3 – 1 France");
  });

  it("swaps the names and flips the score when we are away", () => {
    const html = row({ home_away: "away" });
    expect(html.indexOf("France")).toBeLessThan(html.indexOf("MGA Select"));
    expect(visibleText(html)).toContain("France 1 – 3 MGA Select");
  });

  it("keeps the result colours", () => {
    expect(row({ goals_for: 2, goals_against: 1 })).toContain("text-win");
    expect(row({ goals_for: 1, goals_against: 1 })).toContain("text-draw");
    expect(row({ goals_for: 0, goals_against: 1 })).toContain("text-loss");
  });

  it("shows vs rather than a score for a scheduled fixture", () => {
    const html = row({ status: "scheduled", goals_for: 0, goals_against: 0 });
    expect(visibleText(html)).toContain("MGA Select vs France");
    expect(html).not.toMatch(/text-(win|draw|loss)/);
  });
});

describe("MatchListRow status badges", () => {
  it("shows the red LIVE badge only for a match in progress", () => {
    const live = row({ status: "in_progress" });
    expect(live).toContain(">LIVE<");
    expect(live).toContain("border-red-500");
    expectInOrder(live, [
      'data-slot="match-list-row-date"',
      ">LIVE<",
      "MGA Select",
    ]);
    expect(row({ status: "played" })).not.toContain(">LIVE<");
    expect(row({ status: "scheduled" })).not.toContain(">LIVE<");
  });

  const statuses: MatchStatus[] = [
    "scheduled",
    "played",
    "postponed",
    "cancelled",
  ];
  for (const status of statuses) {
    it(`${status}: shows no status text or badge`, () => {
      const text = visibleText(row({ status }));
      expect(text).not.toMatch(
        /full time|scheduled|upcoming|cancelled|postponed|in progress/i,
      );
    });
  }

  it("still tells screen readers when a fixture is cancelled or postponed", () => {
    expect(row({ status: "cancelled" })).toContain(", cancelled");
    expect(row({ status: "postponed" })).toContain(", postponed");
    expect(row({ status: "played" })).not.toContain(", cancelled");
  });
});

describe("MatchListRow navigation and share", () => {
  it("makes the row a link to the match details", () => {
    const html = row();
    expect(html).toContain('href="/matches/match-1"');
    expect(html).toContain(
      'aria-label="MGA Select 3-1 France, Sun, 15 Nov 2026"',
    );
  });

  it("shows a decorative right-facing chevron", () => {
    const html = row();
    expect(html).toContain("lucide-chevron-right");
    expect(html).toMatch(
      /<svg[^>]*lucide-chevron-right[^>]*aria-hidden="true"/,
    );
  });

  for (const status of ["played", "scheduled"] as const) {
    it(`${status}: keeps the labelled share control`, () => {
      const html = row({ status });
      expect(html).toContain('aria-label="Share postcard"');
      expect(html).toContain('data-share-for="match-1"');
    });
  }

  it("keeps the share control outside the row link, above it", () => {
    const html = row();
    // The link is an empty overlay, so share is never a descendant of it.
    expect(html).toMatch(/<a [^>]*href="\/matches\/match-1"[^>]*><\/a>/);
    const shareSlot = html.indexOf('data-slot="match-list-row-share"');
    expect(shareSlot).toBeGreaterThan(html.indexOf("</a>"));
    expect(html.slice(shareSlot - 80, shareSlot + 60)).toContain("z-10");
  });

  it("reserves the share slot when a status has no postcard so rows align", () => {
    const html = row({ status: "in_progress" });
    expect(html).not.toContain('aria-label="Share postcard"');
    expect(html).toContain('data-slot="match-list-row-share"');
    expect(html).toContain("size-11");
  });
});

describe("matchListContainerClassName", () => {
  it("is one rounded container with thin separators on phones only", () => {
    expect(matchListContainerClassName).toContain("max-sm:rounded-xl");
    expect(matchListContainerClassName).toContain("max-sm:divide-y");
    expect(matchListContainerClassName).toContain("max-sm:overflow-hidden");
    expect(matchListContainerClassName).toContain("max-sm:shadow-sm");
  });

  it("restores the stacked-card spacing from sm up", () => {
    expect(matchListContainerClassName).toContain("sm:space-y-3");
  });
});

describe("matchListMetaLine", () => {
  it("labels friendlies and ignores blank venue names", () => {
    expect(
      matchListMetaLine({ is_friendly: true, venue: { name: "  " } }),
    ).toBe("Friendly");
  });

  it("is null with nothing to show", () => {
    expect(matchListMetaLine({ competition: null, venue: null })).toBeNull();
  });
});
