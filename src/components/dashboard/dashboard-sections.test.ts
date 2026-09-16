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

import { DashboardLeaderboards } from "@/components/dashboard/dashboard-sections";

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
