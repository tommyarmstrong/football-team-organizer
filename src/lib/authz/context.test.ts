import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Team } from "@/lib/supabase/database.types";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

function team(overrides: Partial<Team> & Pick<Team, "id" | "club_id">): Team {
  return {
    name: "U12 Blues",
    display_name: null,
    age_group: "U12",
    gender: "mixed",
    home_venue_id: null,
    training_venue_id: null,
    training_days: null,
    season_label: "2025/26",
    photo_url: null,
    archived_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

type QueryResult = { data: unknown; error: null };

function chain(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = self;
  builder.eq = self;
  builder.order = self;
  builder.maybeSingle = async () => result;
  builder.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function mockSupabase({
  user,
  person,
  managers = [],
  teamMembers = [],
  guardianLinks = [],
  selfPlayers = [],
  teams = [],
}: {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  managers?: { club_id: string }[];
  teamMembers?: { team_id: string; role: string }[];
  guardianLinks?: {
    id: string;
    player_guardians: { player_id: string }[] | null;
  }[];
  selfPlayers?: { id: string }[];
  teams?: Team[];
}) {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from(table: string) {
      switch (table) {
        case "people":
          return chain({ data: person ?? null, error: null });
        case "managers":
          return chain({ data: managers, error: null });
        case "team_members":
          return chain({ data: teamMembers, error: null });
        case "guardians":
          return chain({ data: guardianLinks, error: null });
        case "players":
          return chain({ data: selfPlayers, error: null });
        case "teams":
          return chain({ data: teams, error: null });
        default:
          return chain({ data: [], error: null });
      }
    },
  });
}

describe("getViewerContext", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    vi.resetModules();
  });

  it("returns null when there is no signed-in user", async () => {
    mockSupabase({ user: null });
    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    expect(await freshGetViewerContext()).toBeNull();
  });

  it("assembles club management, roles, and editable teams", async () => {
    const visible = [
      team({ id: "team-1", club_id: "club-1", name: "U10 Lions" }),
      team({ id: "team-2", club_id: "club-2", name: "U11 Tigers" }),
    ];
    mockSupabase({
      user: {
        id: "user-1",
        email: "coach@example.com",
        user_metadata: { full_name: "Ignored Name" },
      },
      person: {
        id: "person-1",
        first_name: "Sam",
        last_name: "Coach",
      },
      managers: [{ club_id: "club-1" }],
      teamMembers: [
        { team_id: "team-1", role: "coach" },
        { team_id: "team-1", role: "player" },
        { team_id: "team-2", role: "management" },
      ],
      guardianLinks: [
        {
          id: "guardian-1",
          player_guardians: [{ player_id: "player-9" }],
        },
      ],
      selfPlayers: [{ id: "player-1" }],
      teams: visible,
    });

    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    const ctx = await freshGetViewerContext();

    expect(ctx).toMatchObject({
      userId: "user-1",
      email: "coach@example.com",
      firstName: "Sam",
      lastName: "Coach",
      displayName: "Sam Coach",
      personId: "person-1",
      managementClubIds: ["club-1"],
      coachTeamIds: ["team-1"],
      managementTeamIds: ["team-2"],
      memberTeamRoles: {
        "team-1": ["coach", "player"],
        "team-2": ["management"],
      },
      guardianPlayerIds: ["player-9"],
      guardianIds: ["guardian-1"],
      selfPlayerIds: ["player-1"],
      editableTeamIds: ["team-1", "team-2"],
      isManagement: true,
    });
    expect(ctx?.visibleTeams).toEqual(visible);
  });

  it("falls back to auth display name when no linked person exists", async () => {
    mockSupabase({
      user: {
        id: "user-2",
        email: "alex@example.com",
        user_metadata: {},
      },
      person: null,
      teams: [team({ id: "team-3", club_id: "club-3" })],
    });

    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    const ctx = await freshGetViewerContext();

    expect(ctx).toMatchObject({
      userId: "user-2",
      firstName: null,
      lastName: null,
      displayName: "alex",
      personId: null,
      managementClubIds: [],
      coachTeamIds: [],
      managementTeamIds: [],
      guardianPlayerIds: [],
      guardianIds: [],
      selfPlayerIds: [],
      editableTeamIds: [],
      isManagement: false,
    });
  });
});
