import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture } from "@/test/fixtures";

const { createClientMock, getCurrentTeamMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCurrentTeamMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/team", () => ({
  getCurrentTeam: getCurrentTeamMock,
}));

import {
  createCompetition,
  deleteCompetition,
  getCompetition,
  listCompetitions,
  updateCompetition,
} from "@/lib/data/competitions";

const competition = {
  id: "comp-1",
  team_id: "team-1",
  name: "League",
  kind: "league",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("competitions data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentTeamMock.mockResolvedValue(teamFixture());
  });

  it("requires a team", async () => {
    getCurrentTeamMock.mockResolvedValue(null);
    expect(await listCompetitions()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
  });

  it("lists, gets, creates, updates, and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ competitions: okResult([competition]) }),
    );
    expect((await listCompetitions()).data).toHaveLength(1);

    createClientMock.mockResolvedValue(
      mockFromClient({ competitions: okResult(competition) }),
    );
    expect((await getCompetition("comp-1")).data?.name).toBe("League");
    expect(
      (await createCompetition({ name: "Cup", kind: "cup" })).data?.id,
    ).toBe("comp-1");
    expect(
      (await updateCompetition("comp-1", { name: "League 2" })).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ competitions: okResult(null) }),
    );
    expect(await deleteCompetition("comp-1")).toEqual({ error: null });
  });

  it("rejects writes when the active team is archived", async () => {
    getCurrentTeamMock.mockResolvedValue(
      teamFixture({ archived_at: "2026-05-01T00:00:00Z" }),
    );
    expect(await createCompetition({ name: "Cup", kind: "cup" })).toMatchObject(
      {
        error: expect.stringMatching(/read-only/i),
      },
    );
  });

  it("maps query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ competitions: errResult("fail") }),
    );
    expect(await listCompetitions("team-1")).toEqual({
      data: [],
      error: "fail",
    });
  });
});
