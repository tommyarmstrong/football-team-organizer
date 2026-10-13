import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture } from "@/test/fixtures";

const {
  createClientMock,
  getCurrentTeamMock,
  seedDefaultTournamentSquadMock,
  ensureTournamentSquadMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCurrentTeamMock: vi.fn(),
  seedDefaultTournamentSquadMock: vi.fn(
    async (): Promise<{ error: string | null }> => ({ error: null }),
  ),
  ensureTournamentSquadMock: vi.fn(
    async (): Promise<{ error: string | null }> => ({ error: null }),
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createClientMock(),
}));
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends unknown[], R>(fn: (...args: T) => Promise<R>) =>
    (...args: T) =>
      fn(...args),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/data/team", () => ({
  getCurrentTeam: getCurrentTeamMock,
}));
vi.mock("@/lib/data/competition-players", () => ({
  seedDefaultTournamentSquad: seedDefaultTournamentSquadMock,
  ensureTournamentSquad: ensureTournamentSquadMock,
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
    seedDefaultTournamentSquadMock.mockResolvedValue({ error: null });
    ensureTournamentSquadMock.mockResolvedValue({ error: null });
  });

  it("requires a team", async () => {
    getCurrentTeamMock.mockResolvedValue(null);
    expect(await listCompetitions()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
  });

  it("lists, gets, creates, updates, and deletes", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ competitions: okResult([competition]) }),
    );
    expect((await listCompetitions()).data).toHaveLength(1);

    createClientMock.mockReturnValue(
      mockFromClient({ competitions: okResult(competition) }),
    );
    expect((await getCompetition("comp-1")).data?.name).toBe("League");
    expect(
      (await createCompetition({ name: "Cup", kind: "cup" })).data?.id,
    ).toBe("comp-1");
    expect(
      (await updateCompetition("comp-1", { name: "League 2" })).error,
    ).toBeNull();

    createClientMock.mockReturnValue(
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

  it("seeds a new tournament with the team squad", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({
        competitions: okResult({
          ...competition,
          id: "comp-t",
          kind: "tournament",
        }),
      }),
    );

    const result = await createCompetition({
      name: "Summer Cup",
      kind: "tournament",
    });
    expect(result.data?.id).toBe("comp-t");
    expect(seedDefaultTournamentSquadMock).toHaveBeenCalledWith(
      "comp-t",
      "team-1",
    );
    expect(ensureTournamentSquadMock).not.toHaveBeenCalled();
  });

  it("does not seed a squad for other competition kinds", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ competitions: okResult(competition) }),
    );
    await createCompetition({ name: "League", kind: "league" });
    expect(seedDefaultTournamentSquadMock).not.toHaveBeenCalled();
  });

  it("removes a new tournament when the default squad cannot be saved", async () => {
    seedDefaultTournamentSquadMock.mockResolvedValue({ error: "squad fail" });
    createClientMock.mockReturnValue(
      mockFromClient({
        competitions: okResult({
          ...competition,
          id: "comp-t",
          kind: "tournament",
        }),
      }),
    );

    expect(
      await createCompetition({ name: "Summer Cup", kind: "tournament" }),
    ).toEqual({ data: null, error: "squad fail" });
  });

  it("seeds a squad when a competition becomes a tournament", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({
        competitions: [
          okResult({ kind: "cup" }),
          okResult({ ...competition, id: "comp-t", kind: "tournament" }),
        ],
      }),
    );

    const result = await updateCompetition("comp-t", { kind: "tournament" });
    expect(result.error).toBeNull();
    expect(ensureTournamentSquadMock).toHaveBeenCalledWith("comp-t", "team-1");
  });

  it("maps query errors", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ competitions: errResult("fail") }),
    );
    expect(await listCompetitions("team-1")).toEqual({
      data: [],
      error: "fail",
    });
  });
});
