import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getTopScorersMock,
  getTopAssistsMock,
  getTopPlayersOfTheMatchMock,
  listPlayerOfTheMonthMock,
} = vi.hoisted(() => ({
  getTopScorersMock: vi.fn(),
  getTopAssistsMock: vi.fn(),
  getTopPlayersOfTheMatchMock: vi.fn(),
  listPlayerOfTheMonthMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: "a",
    props: { href, children },
  }),
}));

vi.mock("@/lib/data/stats", () => ({
  getTopScorers: getTopScorersMock,
  getTopAssists: getTopAssistsMock,
  getTopPlayersOfTheMatch: getTopPlayersOfTheMatchMock,
}));
vi.mock("@/lib/data/player-of-the-month", () => ({
  listPlayerOfTheMonth: listPlayerOfTheMonthMock,
}));

import { DashboardLeaderboards } from "@/components/dashboard/dashboard-sections";

describe("DashboardLeaderboards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTopScorersMock.mockResolvedValue({ data: [], error: null });
    getTopAssistsMock.mockResolvedValue({ data: [], error: null });
    getTopPlayersOfTheMatchMock.mockResolvedValue({ data: [], error: null });
    listPlayerOfTheMonthMock.mockResolvedValue({ data: [], error: null });
  });

  it("lists player of the match names without shirt numbers", async () => {
    getTopPlayersOfTheMatchMock.mockResolvedValue({
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
    });

    const tree = await DashboardLeaderboards({ teamId: "team-1" });
    const html = JSON.stringify(tree);
    expect(html).toContain("Maya Hall");
    expect(html).not.toContain("7 Maya Hall");
    expect(html).toContain("3 awards");
  });
});
