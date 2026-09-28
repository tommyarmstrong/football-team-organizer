import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDashboardDataMock } = vi.hoisted(() => ({
  getDashboardDataMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) =>
    createElement("a", { href }, children),
}));

vi.mock("@/lib/data/dashboard", () => ({
  getDashboardData: getDashboardDataMock,
}));

import {
  DashboardLeaderboards,
  DashboardSeasonTiles,
} from "@/components/dashboard/dashboard-sections";
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

  it("ranks equal goal counts 1, 1, then 3 and leaves monthly awards unranked", async () => {
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
      assists: { data: [], error: null },
      potm: { data: [], error: null },
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
    expect(rankBadgesInSection(html, "Top scorers")).toEqual(["1", "1", "3"]);
    expect(rankBadgesInSection(html, "Player of the month")).toEqual([]);
    expect(html).toContain("March 2025");
    expect(html).toContain("coach&#x27;s player of the match");
  });
});

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

function rankBadgesInSection(html: string, title: string): string[] {
  const start = html.indexOf(`>${title}<`);
  const next = html.indexOf("<h2", start + 1);
  const section = html.slice(start, next === -1 ? undefined : next);
  return [...section.matchAll(/rounded-full[^>]*>(\d+)</g)].map(
    (match) => match[1] ?? "",
  );
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
});

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
