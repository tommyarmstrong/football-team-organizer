import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { matchFixture, teamFixture } from "@/test/fixtures";
import {
  buildPostcardGoalList,
  postcardCaption,
  postcardFileName,
  postcardPlayerLabel,
  postcardSquadLines,
} from "@/lib/postcards/content";

function rosterPlayer(
  overrides: Partial<RosterPlayer> & Pick<RosterPlayer, "id">,
): RosterPlayer {
  return {
    person_id: `person-${overrides.id}`,
    team_player_id: `tp-${overrides.id}`,
    first_name: "Maya",
    last_name: "Hall",
    position: null,
    shirt_number: 7,
    active: true,
    ...overrides,
  };
}

function goal(
  overrides: Partial<GoalWithPlayers> & Pick<GoalWithPlayers, "id">,
): GoalWithPlayers {
  return {
    match_id: "match-1",
    player_id: "p-maya",
    assist_player_id: null,
    period: null,
    period_id: null,
    minute: 12,
    is_penalty: false,
    is_freekick: false,
    from_setpiece: false,
    is_opposition: false,
    is_own_goal: false,
    created_at: "2026-03-08T10:00:00Z",
    scorer: {
      id: "p-maya",
      person_id: "person-maya",
      first_name: "Maya",
      last_name: "Hall",
    },
    assist: null,
    ...overrides,
  };
}

const youthRoster = [
  rosterPlayer({
    id: "p-maya",
    first_name: "Maya",
    last_name: "Hall",
    shirt_number: 7,
  }),
  rosterPlayer({
    id: "p-luca",
    first_name: "Luca",
    last_name: "Patel",
    shirt_number: 4,
  }),
];

describe("postcardPlayerLabel", () => {
  it("uses first name and shirt number on youth teams", () => {
    expect(
      postcardPlayerLabel(
        { firstName: "Maya", lastName: "Hall", shirtNumber: 7 },
        { gender: "girls" },
      ),
    ).toBe("Maya 7");
    expect(
      postcardPlayerLabel(
        { firstName: "Maya", lastName: "Hall", shirtNumber: 7 },
        { gender: "mixed" },
      ),
    ).toBe("Maya 7");
  });

  it("uses the full name on adult teams", () => {
    expect(
      postcardPlayerLabel(
        { firstName: "Maya", lastName: "Hall", shirtNumber: 7 },
        { gender: "women" },
      ),
    ).toBe("7 Maya Hall");
  });
});

describe("postcardSquadLines", () => {
  it("sorts selected players by shirt number and uses first names", () => {
    expect(
      postcardSquadLines(
        [
          rosterPlayer({
            id: "p-theo",
            first_name: "Theo",
            last_name: "Taylor",
            shirt_number: 5,
          }),
          rosterPlayer({
            id: "p-ali",
            first_name: "Ali",
            last_name: "Ahmed",
            shirt_number: 1,
          }),
          rosterPlayer({
            id: "p-dexter",
            first_name: "Dexter",
            last_name: "Dunn",
            shirt_number: 4,
          }),
        ],
        ["p-theo", "p-ali", "p-dexter"],
      ),
    ).toEqual(["1 Ali, 4 Dexter, 5 Theo"]);
  });

  it("omits players who were not selected", () => {
    expect(postcardSquadLines(youthRoster, [])).toEqual([]);
  });
});

describe("postcardCaption", () => {
  it("omits surnames on a girls team and skips unset POTM", () => {
    const caption = postcardCaption({
      teamName: "U11 Girls",
      opponentName: "Riverside",
      goalsFor: 2,
      goalsAgainst: 1,
      story: "Took all three points.",
      goals: [
        goal({
          id: "g1",
          is_freekick: true,
          assist_player_id: "p-luca",
          assist: {
            id: "p-luca",
            person_id: "person-luca",
            first_name: "Luca",
            last_name: "Patel",
          },
        }),
        goal({
          id: "g2",
          player_id: "p-luca",
          minute: 38,
          is_penalty: true,
          scorer: {
            id: "p-luca",
            person_id: "person-luca",
            first_name: "Luca",
            last_name: "Patel",
          },
        }),
        goal({
          id: "g3",
          is_opposition: true,
          player_id: null,
          scorer: null,
          minute: 50,
        }),
      ],
      gender: "girls",
      roster: youthRoster,
      coachPotmLabel: "Maya",
      playersPotmLabel: null,
    });

    expect(caption).toContain("U11 Girls 2–1 Riverside");
    expect(caption).toContain("Took all three points.");
    expect(caption).toContain("⚽ Maya 🤝 Luca");
    expect(caption).toContain("⚽ Luca (P)");
    expect(caption).not.toContain("(Penalty)");
    expect(caption).not.toContain("(Direct Free Kick)");
    expect(caption).toContain("🏆 Coach's Player of the Match: Maya");
    expect(caption).not.toContain("Players' Player of the Match");
    expect(caption).not.toContain("Hall");
    expect(caption).not.toContain("Patel");
    expect(caption).not.toContain("Riverside scored");
  });

  it("includes surnames on a women team", () => {
    const caption = postcardCaption({
      teamName: "Women",
      opponentName: "City",
      goalsFor: 1,
      goalsAgainst: 0,
      story: "Kept a clean sheet.",
      goals: [goal({ id: "g1" })],
      gender: "women",
      roster: youthRoster,
      coachPotmLabel: null,
      playersPotmLabel: null,
    });
    expect(caption).toContain("⚽ Maya Hall");
    expect(caption).not.toContain("Coach's Player of the Match");
  });
});

describe("buildPostcardGoalList crowding", () => {
  it("hides the goals block when there are no our named scorers", () => {
    expect(
      buildPostcardGoalList(
        [
          goal({
            id: "opp",
            is_opposition: true,
            player_id: null,
            scorer: null,
          }),
        ],
        { gender: "girls", roster: youthRoster },
      ),
    ).toEqual({ kind: "none" });
  });

  it("lists up to six goals in full with assists", () => {
    const goals = Array.from({ length: 6 }, (_, i) =>
      goal({
        id: `g${i}`,
        minute: i + 1,
        assist_player_id: "p-luca",
        assist: {
          id: "p-luca",
          person_id: "person-luca",
          first_name: "Luca",
          last_name: "Patel",
        },
      }),
    );
    const list = buildPostcardGoalList(goals, {
      gender: "girls",
      roster: youthRoster,
    });
    expect(list.kind).toBe("full");
    if (list.kind !== "full") return;
    expect(list.rows).toHaveLength(6);
    expect(list.rows[0]?.label).toBe("Maya");
    expect(list.rows[0]?.assistLabel).toBe("Luca");
    expect(list.rows[0]?.isPenalty).toBe(false);
  });

  it("keeps assists and penalty markers from seven to ten goals", () => {
    const goals = Array.from({ length: 7 }, (_, i) =>
      goal({
        id: `g${i}`,
        minute: i + 1,
        is_penalty: true,
        assist_player_id: "p-luca",
        assist: {
          id: "p-luca",
          person_id: "person-luca",
          first_name: "Luca",
          last_name: "Patel",
        },
      }),
    );
    const list = buildPostcardGoalList(goals, {
      gender: "girls",
      roster: youthRoster,
    });
    expect(list.kind).toBe("compact");
    if (list.kind !== "compact") return;
    expect(list.rows).toHaveLength(7);
    expect(list.rows[0]?.isPenalty).toBe(true);
    expect(list.rows[0]?.assistLabel).toBe("Luca");
  });

  it("summarises eleven or more our goals as top scorers", () => {
    const goals = Array.from({ length: 11 }, (_, i) =>
      goal({
        id: `g${i}`,
        player_id: `p-${i}`,
        scorer: {
          id: `p-${i}`,
          person_id: `person-${i}`,
          first_name: `P${i}`,
          last_name: "Kid",
        },
        minute: i + 1,
      }),
    );
    const roster = goals.map((row, i) =>
      rosterPlayer({
        id: `p-${i}`,
        first_name: `P${i}`,
        last_name: "Kid",
        shirt_number: i + 1,
      }),
    );
    const list = buildPostcardGoalList(goals, { gender: "boys", roster });
    expect(list.kind).toBe("summary");
    if (list.kind !== "summary") return;
    expect(list.text.split(", ")).toHaveLength(4);
    expect(list.extra).toBe("+7 more");
    expect(list.text).not.toContain("Kid");
  });
});

describe("postcardFileName", () => {
  it("slugs the team and opponent", () => {
    expect(
      postcardFileName({
        teamName: "U11 Girls",
        date: "2026-03-08",
        opponentName: "Riverside FC",
      }),
    ).toBe("u11-girls-2026-03-08-vs-riverside-fc.png");
  });
});

const {
  getMatchMock,
  getTeamMock,
  getClubMock,
  listGoalsForMatchMock,
  listMatchPlayersMock,
  listRosterForTeamMock,
  getFormThroughMatchMock,
} = vi.hoisted(() => ({
  getMatchMock: vi.fn(),
  getTeamMock: vi.fn(),
  getClubMock: vi.fn(),
  listGoalsForMatchMock: vi.fn(),
  listMatchPlayersMock: vi.fn(),
  listRosterForTeamMock: vi.fn(),
  getFormThroughMatchMock: vi.fn(),
}));

vi.mock("@/lib/data/matches", () => ({ getMatch: getMatchMock }));
vi.mock("@/lib/data/team", () => ({ getTeam: getTeamMock }));
vi.mock("@/lib/data/clubs", () => ({ getClub: getClubMock }));
vi.mock("@/lib/data/goals", () => ({
  listGoalsForMatch: listGoalsForMatchMock,
}));
vi.mock("@/lib/data/match-players", () => ({
  listMatchPlayers: listMatchPlayersMock,
}));
vi.mock("@/lib/data/players", () => ({
  listRosterForTeam: listRosterForTeamMock,
}));
vi.mock("@/lib/data/stats", () => ({
  getFormThroughMatch: getFormThroughMatchMock,
}));

describe("buildMatchPostcardPayload", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getMatchMock.mockResolvedValue({
      data: matchFixture({
        status: "played",
        opponent_name: "Riverside",
        date: "2026-03-08",
        home_away: "home",
        is_friendly: false,
        player_of_the_match_id: "p-maya",
        players_player_of_the_match_id: "p-luca",
        competition: {
          id: "c1",
          name: "County League",
          display_name: "League",
          kind: "league",
        },
      }),
      error: null,
    });
    getTeamMock.mockResolvedValue({
      data: teamFixture({
        name: "U11 Girls",
        display_name: "U11 Girls",
        gender: "girls",
        season_label: "2025/26",
      }),
      error: null,
    });
    getClubMock.mockResolvedValue({
      data: {
        id: "club-1",
        name: "MGA",
        colour: "#146C4A",
        icon_url: "https://example.com/crest.png",
        website: null,
        email: null,
        phone: null,
        established: null,
        about: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    listGoalsForMatchMock.mockResolvedValue({
      data: [
        goal({ id: "g1" }),
        goal({
          id: "g2",
          player_id: "p-luca",
          minute: 38,
          is_penalty: true,
          scorer: {
            id: "p-luca",
            person_id: "person-luca",
            first_name: "Luca",
            last_name: "Patel",
          },
        }),
        goal({
          id: "g-opp",
          is_opposition: true,
          player_id: null,
          scorer: null,
        }),
      ],
      error: null,
    });
    listRosterForTeamMock.mockResolvedValue({
      data: youthRoster,
      error: null,
    });
    listMatchPlayersMock.mockResolvedValue({
      data: [
        { id: "mp-1", player_id: "p-maya" },
        { id: "mp-2", player_id: "p-luca" },
      ],
      error: null,
    });
    getFormThroughMatchMock.mockResolvedValue({ form: ["W"], error: null });
  });

  it("assembles a played-match payload without cards, notes, or venue", async () => {
    const { buildMatchPostcardPayload } =
      await import("@/lib/postcards/match-postcard");
    const { data, error } = await buildMatchPostcardPayload("match-1");
    expect(error).toBeNull();
    expect(data?.story).toBe("Took all three points.");
    expect(data?.scoreLabel).toBe("2–1");
    expect(data?.homeName).toBe("U11 Girls");
    expect(data?.awayName).toBe("Riverside");
    expect(data?.coachPotmLabel).toBe("Maya");
    expect(data?.playersPotmLabel).toBe("Luca");
    expect(data?.squadLines).toEqual(["4 Luca, 7 Maya"]);
    expect(data?.clubColour).toBe("#146C4A");
    expect(data?.caption).not.toContain("Hall");
    expect(JSON.stringify(data)).not.toContain("club_notes");
    expect(JSON.stringify(data)).not.toContain("yellow");
    expect(data?.fileName).toBe("u11-girls-2026-03-08-vs-riverside.png");
  });

  it("swaps the scoreboard for away fixtures", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({
        status: "played",
        home_away: "away",
        opponent_name: "Riverside",
      }),
      error: null,
    });
    const { buildMatchPostcardPayload } =
      await import("@/lib/postcards/match-postcard");
    const { data } = await buildMatchPostcardPayload("match-1");
    expect(data?.homeName).toBe("Riverside");
    expect(data?.awayName).toBe("U11 Girls");
    expect(data?.scoreLabel).toBe("1–2");
    expect(data?.homeScore).toBe(1);
    expect(data?.awayScore).toBe(2);
  });

  it("rejects scheduled matches", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    const { buildMatchPostcardPayload } =
      await import("@/lib/postcards/match-postcard");
    const result = await buildMatchPostcardPayload("match-1");
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/played/i);
  });
});
