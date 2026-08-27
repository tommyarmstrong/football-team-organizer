import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";

const { createClientMock, createPersonMock, updatePersonMock } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    createPersonMock: vi.fn(),
    updatePersonMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  updatePerson: updatePersonMock,
}));

import {
  addCoachToTeam,
  createCoach,
  deleteCoach,
  getCoach,
  getCoachTeams,
  listCoaches,
  listCoachesNotOnTeam,
  listTeamCoaches,
  removeCoachFromTeam,
  setTeamHeadCoach,
  updateCoach,
  updateCoachText,
} from "@/lib/data/coaches";

const coachRow = {
  id: "coach-1",
  club_id: "club-1",
  person_id: "person-1",
  joined_date: "2024-01-01",
  date_of_birth: null,
  notes: null,
  biography: null,
  philosophy: null,
  dbs_checked: false,
  fa_level_1: false,
  fa_level_2: false,
  active_role: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  person: personFixture({ first_name: "Casey", last_name: "Coach" }),
  team_coaches: [
    {
      id: "tc-1",
      team_id: "team-1",
      role: "assistant",
      team: { name: "U12 Blues", season_label: "2025/26" },
    },
  ],
};

describe("coaches data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    updatePersonMock.mockResolvedValue({ error: null });
  });

  it("lists coaches with teams and gets a coach", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ coaches: okResult([coachRow]) }),
    );
    const listed = await listCoaches();
    expect(listed.data[0]?.teams[0]?.team_name).toBe("U12 Blues");

    createClientMock.mockResolvedValue(
      mockFromClient({ coaches: okResult(coachRow) }),
    );
    expect((await getCoach("coach-1")).data?.first_name).toBe("Casey");
  });

  it("creates and updates coaches", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ coaches: okResult(coachRow) }),
    );
    expect(
      (
        await createCoach({
          club_id: "club-1",
          first_name: "Casey",
          second_name: "Coach",
          joined_date: "2024-01-01",
          date_of_birth: null,
          phone: null,
          email: null,
          notes: null,
          biography: null,
          philosophy: null,
          dbs_checked: false,
          fa_level_1: false,
          fa_level_2: false,
        })
      ).data?.id,
    ).toBe("coach-1");

    createClientMock.mockResolvedValue(
      mockFromClient({
        coaches: [okResult(coachRow), okResult(coachRow)],
      }),
    );
    expect(
      (
        await updateCoach("coach-1", {
          first_name: "Casey",
          second_name: "Coach",
          joined_date: "2024-01-01",
          date_of_birth: null,
          phone: null,
          email: null,
          notes: "n",
          biography: null,
          philosophy: null,
          dbs_checked: true,
          fa_level_1: false,
          fa_level_2: false,
        })
      ).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ coaches: okResult(coachRow) }),
    );
    expect(
      (
        await updateCoachText("coach-1", {
          biography: "Bio",
          philosophy: "Phil",
        })
      ).error,
    ).toBeNull();
  });

  it("lists team coaches and assigns/removes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_coaches: okResult([
          {
            id: "tc-1",
            coach_id: "coach-1",
            role: null,
            coach: {
              person_id: "person-1",
              active_role: true,
              person: { first_name: "Casey", last_name: "Coach" },
            },
          },
        ]),
      }),
    );
    expect((await listTeamCoaches("team-1")).data[0]?.name).toBe("Casey Coach");

    createClientMock.mockResolvedValue(
      mockFromClient({ team_coaches: okResult(null) }),
    );
    expect(await addCoachToTeam("team-1", "coach-1", null)).toEqual({
      error: null,
    });
    expect(await removeCoachFromTeam("tc-1")).toEqual({ error: null });
  });

  it("sets head coach and lists coaches not on team", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_coaches: [
          okResult([
            { id: "tc-1", coach_id: "coach-old", role: "Head Coach" },
            { id: "tc-2", coach_id: "coach-1", role: null },
          ]),
          okResult(null),
          okResult(null),
        ],
      }),
    );
    expect(await setTeamHeadCoach("team-1", "coach-1")).toEqual({
      error: null,
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        coaches: okResult([
          {
            ...coachRow,
            id: "coach-free",
            person: personFixture({
              id: "p2",
              first_name: "Free",
              last_name: "Agent",
            }),
          },
          {
            ...coachRow,
            id: "coach-busy",
          },
        ]),
        team_coaches: okResult([{ coach_id: "coach-busy" }]),
      }),
    );
    const free = await listCoachesNotOnTeam("club-1", "team-1");
    expect(free.data.map((c) => c.id)).toContain("coach-free");
    expect(free.data.map((c) => c.id)).not.toContain("coach-busy");
  });

  it("gets coach teams and soft-deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        { coaches: okResult(null) },
        {
          rpcResults: {
            list_visible_coach_teams: okResult([
              {
                team_coach_id: "tc-1",
                team_id: "team-1",
                team_name: "U12 Blues",
                team_season_label: "2025/26",
                role: null,
              },
            ]),
          },
        },
      ),
    );
    expect((await getCoachTeams("coach-1")).data[0]?.team_id).toBe("team-1");
    expect(await deleteCoach("coach-1")).toEqual({ error: null });
  });

  it("maps unique assignment errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_coaches: errResult("team_coaches_team_coach_unique"),
      }),
    );
    expect(await addCoachToTeam("team-1", "coach-1", null)).toMatchObject({
      error: expect.stringMatching(/already assigned/i),
    });
  });
});
