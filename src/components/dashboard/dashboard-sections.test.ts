import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDashboardDataMock } = vi.hoisted(() => ({
  getDashboardDataMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: "a",
    props: { href, children },
  }),
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
});

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
