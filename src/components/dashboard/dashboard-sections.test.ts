import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDashboardDataMock } = vi.hoisted(() => ({
  getDashboardDataMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => createElement("a", { href, className }, children),
}));

vi.mock("@/lib/data/dashboard", () => ({
  getDashboardData: getDashboardDataMock,
}));

vi.mock("@/lib/data/venues", () => ({
  listVenues: vi.fn(async () => ({ data: [], error: null })),
}));

import {
  DashboardCompetitions,
  DashboardForm,
  DashboardOverviewAndForm,
  DashboardPlayers,
  DashboardSeasonTiles,
} from "@/components/dashboard/dashboard-sections";
import { AWARD_TONE_CLASS } from "@/components/shared/award-badge";
import { Section } from "@/components/shared/section";
import { SeasonTiles } from "@/components/stats/season-tiles";
import type { Team } from "@/lib/supabase/database.types";

describe("DashboardPlayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        next: { data: null, error: null },
        last: { data: null, error: null },
        canEditMatch: false,
        form: { form: [], error: null },
        competitions: { data: [], error: null },
        canEditTeam: false,
        scorers: { data: [], error: null },
        assists: { data: [], error: null },
        potm: { data: [], error: null },
        potMonth: { data: [], error: null },
        squadSize: { count: 0, error: null },
        stats: { resultsOverTime: [], form: [], error: null },
      }),
    );
  });

  it("lists squad size and every tied leader with a gold award", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        squadSize: { count: 18, error: null },
        scorers: {
          data: [
            playerStat("player-2", "person-2", "Bea", "Best", 5),
            playerStat("player-1", "person-1", "Ada", "Ace", 5),
          ],
          error: null,
        },
        assists: {
          data: [countStat("player-5", "person-5", "Eve", "East", 2)],
          error: null,
        },
        potm: {
          data: [
            countStat("player-1", "person-1", "Ada", "Ace", 4),
            countStat("player-3", "person-3", "Cleo", "Cross", 4),
          ],
          error: null,
        },
        potMonth: {
          data: [
            monthlyAward("award-old", "2025-01-01", "person-2", "Bea", "Best"),
            monthlyAward("award-new", "2025-03-01", "person-9", "Nia", "North"),
          ],
          error: null,
        },
      }),
    );

    const html = renderToStaticMarkup(
      await DashboardPlayers({ teamId: "team-1" }),
    );
    expect(html).toContain(">Players<");
    expect(html).toContain(">Squad size<");
    expect(html).toContain(">18<");
    expect(html).not.toContain(">Leaderboards<");
    expect(awardTonesIn(html)).toEqual([
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
    ]);
    expect(namesIn(html, "Most goals")).toEqual(["Bea Best", "Ada Ace"]);
    expect(namesIn(html, "Most assists")).toEqual(["Eve East"]);
    expect(namesIn(html, "Player of the match")).toEqual([
      "Ada Ace",
      "Cleo Cross",
    ]);
    expect(namesIn(html, "Player of the month")).toEqual(["Nia North"]);
    expect(html).toContain("March 2025");
    expect(html).not.toContain("January 2025");
    expect(html).not.toContain("February 2025");
    expect(html).toContain("5 goals");
    expect(html).toContain("2 assists");
    expect(html).toContain("4 awards");
    expect(html).toContain('href="/people/person-1"');
    expect(html).not.toContain("7 Ada Ace");
    expect(html).not.toContain("text-[#8E979F]");
    expect(html).not.toContain("text-[#CD7F32]");
  });

  it("shows a dash when a highlight has nobody yet", async () => {
    const html = renderToStaticMarkup(
      await DashboardPlayers({ teamId: "team-1" }),
    );
    expect(html).toContain(">0<");
    expect(html).toContain(">—<");
    expect(awardTonesIn(html)).toEqual([]);
  });

  it("keeps an earlier player of the month off the list when a later month exists", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        squadSize: { count: 2, error: null },
        potMonth: {
          data: [
            monthlyAward("award-2", "2025-02-01", "person-2", "Bea", "Best"),
            monthlyAward("award-3", "2025-03-01", "person-1", "Ada", "Ace"),
            monthlyAward("award-3b", "2025-03-01", "person-9", "Nia", "North"),
          ],
          error: null,
        },
      }),
    );

    const html = renderToStaticMarkup(
      await DashboardPlayers({ teamId: "team-1" }),
    );
    expect(namesIn(html, "Player of the month")).toEqual([
      "Ada Ace",
      "Nia North",
    ]);
    expect(html).not.toContain("Bea Best");
    expect(awardTonesIn(html)).toEqual(["gold", "gold"]);
  });
});

function countStat(
  id: string,
  personId: string,
  firstName: string,
  lastName: string,
  count: number,
) {
  return {
    playerId: id,
    personId,
    name: `${firstName} ${lastName}`,
    count,
  };
}

function playerStat(
  id: string,
  personId: string,
  firstName: string,
  lastName: string,
  count: number,
) {
  return countStat(id, personId, firstName, lastName, count);
}

/** The dashboard data as started promises, with defaults for everything. */
function dashboardData(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    next: { data: null, error: null },
    last: { data: null, error: null },
    canEditMatch: false,
    form: { form: [], error: null },
    competitions: { data: [], error: null },
    canEditTeam: false,
    scorers: { data: [], error: null },
    assists: { data: [], error: null },
    potm: { data: [], error: null },
    potMonth: { data: [], error: null },
    squadSize: { count: 0, error: null },
    stats: { resultsOverTime: [], form: [], error: null },
  };
  return Object.fromEntries(
    Object.entries({ ...defaults, ...overrides }).map(([key, value]) => [
      key,
      Promise.resolve(value),
    ]),
  );
}

function monthlyAward(
  id: string,
  month: string,
  personId: string,
  firstName: string,
  lastName: string,
) {
  return {
    id,
    month,
    player: {
      id: `player-${id}`,
      person_id: personId,
      first_name: firstName,
      last_name: lastName,
    },
  };
}

function categoryHtml(html: string, label: string): string {
  const start = html.indexOf(`>${label}<`);
  const nextLabels = [
    "Squad size",
    "Player of the month",
    "Player of the match",
    "Most goals",
    "Most assists",
  ]
    .map((next) => html.indexOf(`>${next}<`, start + 1))
    .filter((index) => index > start);
  const next = nextLabels.length === 0 ? -1 : Math.min(...nextLabels);
  return html.slice(start, next === -1 ? undefined : next);
}

function awardTonesIn(section: string): string[] {
  return [...section.matchAll(/text-\[(#[A-Fa-f0-9]+)\]/g)].map((match) => {
    const colour = match[1] ?? "";
    const tone = (
      Object.entries(AWARD_TONE_CLASS) as Array<[string, string]>
    ).find(([, className]) => className === `text-[${colour}]`);
    return tone?.[0] ?? colour;
  });
}

function namesIn(html: string, label: string): string[] {
  return [
    ...categoryHtml(html, label).matchAll(
      /<span class="truncate font-medium">([^<]+)<\/span>/g,
    ),
  ].map((match) => match[1] ?? "");
}

describe("DashboardSeasonTiles", () => {
  it("omits tiles when getAllTeamStats errors", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: {
          resultsOverTime: [
            {
              matchId: "m1",
              date: "2026-01-01",
              label: "Rivals",
              goalsFor: 2,
              goalsAgainst: 1,
              result: "W",
              competitionId: "c1",
              competitionKind: "league",
              competitionName: "League",
              isFriendly: false,
            },
          ],
          form: ["W"],
          error: "boom",
        },
      }),
    );

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(tree).toBeNull();
  });

  it("renders tiles from played results", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: {
          resultsOverTime: [
            {
              matchId: "m1",
              date: "2026-01-01",
              label: "Rivals",
              goalsFor: 2,
              goalsAgainst: 1,
              result: "W",
              competitionId: "c1",
              competitionKind: "league",
              competitionName: "League",
              isFriendly: false,
            },
          ],
          form: ["W"],
          error: null,
        },
      }),
    );

    const tiles = glanceTiles(await DashboardSeasonTiles({ teamId: "team-1" }));
    expect(tiles.results).toHaveLength(1);
    expect(tiles.variant).toBe("glance");
  });

  it("counts league and cup matches and drops friendlies, tournaments, and other competitions", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: {
          resultsOverTime: [
            result("league-win", "league", false),
            result("cup-draw", "cup", false),
            result("friendly", null, true),
            result("tournament", "tournament", false),
            result("other", "other", false),
          ],
          form: [],
          error: null,
        },
      }),
    );

    const tiles = glanceTiles(await DashboardSeasonTiles({ teamId: "team-1" }));
    expect(
      tiles.results.map((row: { matchId: string }) => row.matchId),
    ).toEqual(["league-win", "cup-draw"]);
  });

  it("omits the section when every played match is outside league and cup matches", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: {
          resultsOverTime: [
            result("friendly", null, true),
            result("tournament", "tournament", false),
          ],
          form: ["W"],
          error: null,
        },
      }),
    );

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(tree).toBeNull();
  });

  it("puts overview beside form, and lets form fill the row when overview is absent", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: { resultsOverTime: [], form: [], error: null },
        form: { form: ["W"], error: null },
      }),
    );
    const empty = renderToStaticMarkup(
      await DashboardOverviewAndForm({ teamId: "team-1" }),
    );
    expect(empty).not.toContain(">Overview<");
    expect(empty).toContain(">Form<");
    expect(empty).toContain("lg:col-span-2");
    expect(empty).toContain("lg:grid-cols-2");

    getDashboardDataMock.mockReturnValue(
      dashboardData({
        stats: {
          resultsOverTime: [result("league-win", "league", false)],
          form: ["W"],
          error: null,
        },
        form: { form: ["W"], error: null },
      }),
    );
    const both = renderToStaticMarkup(
      await DashboardOverviewAndForm({ teamId: "team-1" }),
    );
    expect(both.indexOf(">Overview<")).toBeLessThan(both.indexOf(">Form<"));
    expect(both).not.toContain("lg:col-span-2");
  });

  it("does not offer a competition filter on the dashboard", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "dashboard-sections.tsx"),
      "utf8",
    );
    expect(source).toContain("ALL_LEAGUE_AND_CUP");
    expect(source).toContain('title="Overview"');
    expect(source).toContain('variant="glance"');
    expect(source).not.toContain("ALL_COMPETITIVE");
    expect(source).not.toContain("competitive");
    expect(source).not.toContain("StatsCompetitionFilters");
    expect(source).not.toContain("onCompetitionKindChange");
    expect(source).not.toContain("setCompetitionKind");
  });
});

function glanceTiles(tree: unknown) {
  const section = tree as {
    type: unknown;
    props: {
      title: string;
      children: {
        type: unknown;
        props: { results: Array<{ matchId: string }>; variant?: string };
      };
    };
  };
  expect(section.type).toBe(Section);
  expect(section.props.title).toBe("Overview");
  expect(section.props.children.type).toBe(SeasonTiles);
  return section.props.children.props;
}

function result(
  matchId: string,
  competitionKind: "league" | "cup" | "tournament" | "other" | null,
  isFriendly: boolean,
) {
  return {
    matchId,
    date: "2026-01-01",
    label: matchId,
    goalsFor: 1,
    goalsAgainst: 0,
    result: "W" as const,
    competitionId: competitionKind ? `c-${matchId}` : null,
    competitionKind,
    competitionName: isFriendly ? "Friendly" : competitionKind,
    isFriendly,
  };
}

describe("DashboardFixtures last result share", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "dashboard-sections.tsx"),
    "utf8",
  );

  it("places the shared summary card on the next fixture and the last result", () => {
    expect(source).toContain("MatchSummaryCard");
    expect(source).toContain('title="Next fixture"');
    expect(source).toContain('title="Last result"');
    expect(source).not.toContain("Schedule the next match.");
    expect(source).toContain("Played matches will show here.");
    expect(source).not.toContain("Most recent");
    expect(source).not.toContain("oldest → newest");
    expect(source).not.toContain("Leagues, cups, and other competitions");
    expect(source).toContain("showAddForm={false}");
    expect(source).toContain("compact");
    expect(source).toContain('title="Players"');
    expect(source).toContain('title="Overview"');
    expect(source).not.toContain('title="Leaderboards"');
    expect(source).not.toContain('title="Season at a glance"');
    expect(source).not.toContain('title="Awards"');
    expect(source).toContain('tone="gold"');
    expect(source).not.toContain("MatchHero");
    expect(source).not.toContain("scheduledBadge");
    expect(source).not.toContain("SharePostcardButton");
    expect(source).not.toContain("matchDaySquadCount");
    expect(source).not.toContain("cards=");
  });

  it("opens new fixture in an inline dialog instead of /matches/new", () => {
    expect(source).toContain("NewFixtureDialog");
    expect(source).not.toContain('href="/matches/new"');
  });

  it("pairs next fixture and last result from the large screen up", () => {
    expect(source).toContain("grid gap-8 lg:grid-cols-2 lg:items-start");
    expect(source).not.toContain("sm:grid-cols-2");
    expect(source).toContain("lg:col-span-2");
  });

  it("renders form without the match-count caption", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({ form: { form: ["W", "D"], error: null } }),
    );
    const html = renderToStaticMarkup(
      await DashboardForm({ teamId: "team-1" }),
    );
    expect(html).toContain(">Form<");
    expect(html).toContain(">W<");
    expect(html).not.toContain("Most recent");
    expect(html).not.toContain("oldest");
  });

  it("shows Completed and Upcoming badges, and leaves Ongoing and Add off the list", async () => {
    getDashboardDataMock.mockReturnValue(
      dashboardData({
        competitions: {
          data: [
            {
              id: "league",
              name: "League",
              display_name: null,
              result: "ongoing",
              date: "2000-01-01",
            },
            {
              id: "cup",
              name: "County Cup",
              display_name: null,
              result: "completed",
              date: null,
            },
            {
              id: "summer",
              name: "Summer Cup",
              display_name: null,
              result: "ongoing",
              date: "2099-06-01",
            },
          ],
          error: null,
        },
        canEditTeam: true,
      }),
    );
    const html = renderToStaticMarkup(
      await DashboardCompetitions({
        team: {
          id: "team-1",
          club_id: "club-1",
          season_label: "2025/26",
        } as Team,
      }),
    );
    expect(html).toContain(">Competitions<");
    expect(html).toContain(">League<");
    expect(html).not.toContain(">Ongoing<");
    expect(html).toContain(">Completed<");
    expect(html).toContain(">Upcoming<");
    expect(html).not.toContain(">Add<");
    expect(html).toContain("min-h-9");
    expect(html).not.toContain("Leagues, cups");
  });

  it("omits initials on player rows and keeps a display-font count", () => {
    expect(source).not.toContain("InitialsAvatar");
    expect(source).toContain("font-display text-foreground text-lg");
    expect(source).not.toContain("showAvatar={false}");
    expect(source).not.toContain("text-primary text-sm font-semibold");
  });
});
