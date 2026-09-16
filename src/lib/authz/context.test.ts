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

// ---------------------------------------------------------------------------
// Mock helper: builds a minimal Supabase client that returns a fixed RPC result
// for get_viewer_context() and a fixed getUser() result.
// ---------------------------------------------------------------------------

type RpcPayload = {
  person: { id: string; first_name: string; last_name: string } | null;
  managers: { club_id: string }[];
  team_members: { team_id: string; role: string }[];
  guardians: { id: string; player_guardians: { player_id: string }[] | null }[];
  self_players: { id: string }[];
  teams: Team[];
  clubs: { id: string; name: string }[];
};

function mockSupabase({
  user,
  rpc,
}: {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
  rpc?: RpcPayload | null;
}) {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    async rpc(fn: string) {
      if (fn === "get_viewer_context") {
        if (rpc === null)
          return { data: null, error: { message: "rpc error" } };
        return { data: rpc ?? null, error: null };
      }
      return { data: null, error: null };
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

  it("returns null when the RPC returns an error", async () => {
    mockSupabase({
      user: { id: "user-1", email: "coach@example.com" },
      rpc: null,
    });
    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    expect(await freshGetViewerContext()).toBeNull();
  });

  it("assembles club management, roles, and editable teams from RPC result", async () => {
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
      rpc: {
        person: { id: "person-1", first_name: "Sam", last_name: "Coach" },
        managers: [{ club_id: "club-1" }],
        team_members: [
          { team_id: "team-1", role: "coach" },
          { team_id: "team-1", role: "player" },
          { team_id: "team-2", role: "management" },
        ],
        guardians: [
          {
            id: "guardian-1",
            player_guardians: [{ player_id: "player-9" }],
          },
        ],
        self_players: [{ id: "player-1" }],
        teams: visible,
        clubs: [
          { id: "club-1", name: "Lions FC" },
          { id: "club-2", name: "Tigers FC" },
        ],
      },
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
    expect(ctx?.visibleClubs).toEqual([
      { id: "club-1", name: "Lions FC" },
      { id: "club-2", name: "Tigers FC" },
    ]);
  });

  it("falls back to auth display name when no linked person exists", async () => {
    mockSupabase({
      user: {
        id: "user-2",
        email: "alex@example.com",
        user_metadata: {},
      },
      rpc: {
        person: null,
        managers: [],
        team_members: [],
        guardians: [],
        self_players: [],
        teams: [team({ id: "team-3", club_id: "club-3" })],
        clubs: [],
      },
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

  it("keeps guardian ids when a guardian has no player links yet", async () => {
    mockSupabase({
      user: { id: "user-3", email: "pat@example.com" },
      rpc: {
        person: { id: "person-g", first_name: "Pat", last_name: "Parent" },
        managers: [],
        team_members: [],
        guardians: [{ id: "guardian-2", player_guardians: null }],
        self_players: [],
        teams: [],
        clubs: [],
      },
    });

    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    const ctx = await freshGetViewerContext();

    expect(ctx).toMatchObject({
      personId: "person-g",
      guardianIds: ["guardian-2"],
      guardianPlayerIds: [],
    });
  });

  it("nulls email when the auth user has none", async () => {
    mockSupabase({
      user: { id: "user-4", email: null, user_metadata: { full_name: "Pat" } },
      rpc: {
        person: null,
        managers: [],
        team_members: [],
        guardians: [],
        self_players: [],
        teams: [],
        clubs: [],
      },
    });

    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    const ctx = await freshGetViewerContext();

    expect(ctx).toMatchObject({
      userId: "user-4",
      email: null,
      displayName: "Pat",
    });
  });

  it("includes visibleClubs from the RPC result", async () => {
    mockSupabase({
      user: { id: "user-5", email: "mgr@example.com" },
      rpc: {
        person: { id: "person-5", first_name: "Jo", last_name: "Manager" },
        managers: [{ club_id: "club-x" }],
        team_members: [],
        guardians: [],
        self_players: [],
        teams: [],
        clubs: [
          { id: "club-x", name: "Alpha FC" },
          { id: "club-y", name: "Beta FC" },
        ],
      },
    });

    const { getViewerContext: freshGetViewerContext } =
      await import("@/lib/authz/context");
    const ctx = await freshGetViewerContext();

    expect(ctx?.visibleClubs).toEqual([
      { id: "club-x", name: "Alpha FC" },
      { id: "club-y", name: "Beta FC" },
    ]);
    expect(ctx?.managementClubIds).toEqual(["club-x"]);
  });
});
