import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDashboardDataMock } = vi.hoisted(() => ({
  getDashboardDataMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));

vi.mock("@/lib/data/dashboard", () => ({
  getDashboardData: getDashboardDataMock,
}));

import {
  DashboardLeaderboards,
  DashboardSeasonTiles,
} from "@/components/dashboard/dashboard-sections";
import { AWARD_TONE_CLASS } from "@/components/shared/award-badge";
import { SeasonTiles } from "@/components/stats/season-tiles";

describe("DashboardLeaderboards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardDataMock.mockResolvedValue({
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
      stats: { resultsOverTime: [], form: [], error: null },
    });
  });

  it("lists player of the match names without shirt numbers", async () => {
    getDashboardDataMock.mockResolvedValue({
      next: { data: null, error: null },
      last: { data: null, error: null },
      canEditMatch: false,
      form: { form: [], error: null },
      competitions: { data: [], error: null },
      canEditTeam: false,
      scorers: { data: [], error: null },
      assists: { data: [], error: null },
      potm: {
        data: [
          {
            player: {
              id: "player-1",
              person_id: "person-1",
              first_name: "Maya",
              last_name: "Hall",
              shirt_number: 7,
            },
            count: 3,
          },
        ],
        error: null,
      },
      potMonth: { data: [], error: null },
    });

    const tree = await DashboardLeaderboards({ teamId: "team-1" });
    const html = JSON.stringify(tree);
    expect(html).toContain("Maya Hall");
    expect(html).not.toContain("7 Maya Hall");
    expect(html).toContain("3 awards");
  });

  it("colours ribbons gold, silver, bronze, then black, and monthly awards gold", async () => {
    getDashboardDataMock.mockResolvedValue({
      next: { data: null, error: null },
      last: { data: null, error: null },
      canEditMatch: false,
      form: { form: [], error: null },
      competitions: { data: [], error: null },
      canEditTeam: false,
      scorers: {
        data: [
          playerStat("player-1", "person-1", "Ada", "Ace", 5),
          playerStat("player-2", "person-2", "Bea", "Best", 5),
          playerStat("player-3", "person-3", "Cleo", "Cross", 3),
        ].map((player) => ({ player, goals: player.goals })),
        error: null,
      },
      assists: {
        data: [
          countStat("player-1", "person-1", "Ada", "Ace", 4),
          countStat("player-2", "person-2", "Bea", "Best", 2),
          countStat("player-5", "person-5", "Eve", "East", 2),
        ],
        error: null,
      },
      potm: {
        data: [
          countStat("player-1", "person-1", "Ada", "Ace", 4),
          countStat("player-2", "person-2", "Bea", "Best", 3),
          countStat("player-3", "person-3", "Cleo", "Cross", 3),
        ],
        error: null,
      },
      potMonth: {
        data: [
          {
            id: "award-1",
            month: "2025-03",
            player: {
              id: "player-9",
              person_id: "person-9",
              first_name: "Nia",
              last_name: "North",
            },
          },
        ],
        error: null,
      },
      stats: { resultsOverTime: [], form: [], error: null },
    });

    const html = renderToStaticMarkup(
      await DashboardLeaderboards({ teamId: "team-1" }),
    );
    expect(awardTonesInSection(html, "Goals leaderboard")).toEqual([
      "gold",
      "gold",
      "bronze",
    ]);
    expect(awardTonesInSection(html, "Assists leaderboard")).toEqual([
      "gold",
      "silver",
      "silver",
    ]);
    expect(
      awardTonesInSection(html, "Player of the match leaderboard"),
    ).toEqual(["gold", "silver", "silver"]);
    expect(awardTonesInSection(html, "Player of the month")).toEqual(["gold"]);
    expect(sectionHtml(html, "Player of the month")).not.toContain(
      "text-primary",
    );
    expect(sectionHtml(html, "Goals leaderboard")).not.toContain(
      "bg-[#F5C518]",
    );
    expect(sectionTitles(html)).toEqual([
      "Player of the month",
      "Player of the match leaderboard",
      "Goals leaderboard",
      "Assists leaderboard",
    ]);
    expect(html).toContain("March 2025");
    expect(html).toContain("4 awards");
  });

  it("lists monthly awards in month order with a ribbon, not a rank", async () => {
    getDashboardDataMock.mockResolvedValue({
      next: { data: null, error: null },
      last: { data: null, error: null },
      canEditMatch: false,
      form: { form: [], error: null },
      competitions: { data: [], error: null },
      canEditTeam: false,
      scorers: { data: [], error: null },
      assists: { data: [], error: null },
      potm: { data: [], error: null },
      potMonth: {
        data: [
          monthlyAward("award-1", "2025-03", "person-1", "Nia", "North"),
          monthlyAward("award-2", "2025-02", "person-2", "Bea", "Best"),
          monthlyAward("award-3", "2025-01", "person-3", "Cleo", "Cross"),
        ],
        error: null,
      },
    });

    const html = renderToStaticMarkup(
      await DashboardLeaderboards({ teamId: "team-1" }),
    );
    expect(awardTonesInSection(html, "Player of the month")).toEqual([
      "gold",
      "gold",
      "gold",
    ]);
    expect(html.indexOf("March 2025")).toBeLessThan(
      html.indexOf("February 2025"),
    );
    expect(html.indexOf("February 2025")).toBeLessThan(
      html.indexOf("January 2025"),
    );
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
    player: {
      id,
      person_id: personId,
      first_name: firstName,
      last_name: lastName,
      shirt_number: null,
    },
    count,
  };
}

function playerStat(
  id: string,
  personId: string,
  firstName: string,
  lastName: string,
  goals: number,
) {
  return {
    id,
    person_id: personId,
    first_name: firstName,
    last_name: lastName,
    shirt_number: null,
    goals,
  };
}

function sectionTitles(html: string): string[] {
  return [
    "Player of the month",
    "Player of the match leaderboard",
    "Goals leaderboard",
    "Assists leaderboard",
  ].sort((a, b) => html.indexOf(`>${a}<`) - html.indexOf(`>${b}<`));
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

function sectionHtml(html: string, title: string): string {
  const start = html.indexOf(`>${title}<`);
  const next = html.indexOf("<h2", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

function awardTonesInSection(html: string, title: string): string[] {
  const section = sectionHtml(html, title);
  return [...section.matchAll(/text-\[(#[A-Fa-f0-9]+)\]/g)].map((match) => {
    const colour = match[1] ?? "";
    const tone = (
      Object.entries(AWARD_TONE_CLASS) as Array<[string, string]>
    ).find(([, className]) => className === `text-[${colour}]`);
    return tone?.[0] ?? colour;
  });
}

describe("DashboardSeasonTiles", () => {
  it("omits tiles when getAllTeamStats errors", async () => {
    getDashboardDataMock.mockResolvedValue({
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
    });

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(tree).toBeNull();
  });

  it("renders tiles from played results", async () => {
    getDashboardDataMock.mockResolvedValue({
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
    });

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(tree?.type).toBe(SeasonTiles);
    expect(tree?.props.results).toHaveLength(1);
  });

  it("counts league and cup matches and drops friendlies, tournaments, and other competitions", async () => {
    getDashboardDataMock.mockResolvedValue({
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
    });

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(
      tree?.props.results.map((row: { matchId: string }) => row.matchId),
    ).toEqual(["league-win", "cup-draw"]);
  });

  it("passes no results when every played match is outside league and cup matches", async () => {
    getDashboardDataMock.mockResolvedValue({
      stats: {
        resultsOverTime: [
          result("friendly", null, true),
          result("tournament", "tournament", false),
        ],
        form: ["W"],
        error: null,
      },
    });

    const tree = await DashboardSeasonTiles({ teamId: "team-1" });
    expect(tree?.props.results).toEqual([]);
  });

  it("does not offer a competition filter on the dashboard", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "dashboard-sections.tsx"),
      "utf8",
    );
    expect(source).toContain("ALL_LEAGUE_AND_CUP");
    expect(source).toContain("league and cup matches");
    expect(source).not.toContain("ALL_COMPETITIVE");
    expect(source).not.toContain("competitive");
    expect(source).not.toContain("StatsCompetitionFilters");
    expect(source).not.toContain("onCompetitionKindChange");
    expect(source).not.toContain("setCompetitionKind");
  });
});

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

  it("places a share postcard control on the last-result card", () => {
    expect(source).toContain("SharePostcardButton");
    expect(source).toContain('title="Last result"');
    expect(source).toContain("actions={share}");
  });

  it("passes dashboard match cards the same stack fields as the matches list", () => {
    expect(source).toContain("MatchHero");
    expect(source).toContain("meetupTime={match.meetup_time}");
    expect(source).toContain("kickoffTime={match.kickoff_time}");
    expect(source).toContain("venueName={match.venue?.name ?? null}");
    expect(source).toContain("competitionName={matchCompetitionLabel(match)}");
    expect(source).not.toContain("matchDaySquadCount");
    expect(source).not.toContain("cards=");
  });

  it("opens new fixture in an inline dialog instead of /matches/new", () => {
    expect(source).toContain("NewFixtureDialog");
    expect(source).not.toContain('href="/matches/new"');
  });

  it("stacks next fixture and last result in the narrow page column", () => {
    expect(source).toContain("grid gap-8");
    expect(source).not.toContain("sm:grid-cols-2");
  });

  it("omits initials on dashboard leaderboard rows and keeps a display-font count", () => {
    expect(source).not.toContain("InitialsAvatar");
    expect(source).toContain("font-display text-foreground text-lg");
    expect(source).not.toContain("showAvatar={false}");
    expect(source).not.toContain("text-primary text-sm font-semibold");
  });
});
