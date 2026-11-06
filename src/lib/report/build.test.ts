import { describe, expect, it } from "vitest";
import {
  buildReportCoaches,
  buildReportCompetitions,
  buildReportData,
  buildReportMatches,
  buildReportPlayers,
  buildReportVenues,
} from "@/lib/report/build";
import { emptySeasonAwards } from "@/lib/report/season-awards";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { RosterPlayer } from "@/lib/data/players";
import type { Competition, Venue } from "@/lib/supabase/database.types";

function dbMatch(
  id: string,
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    id,
    competition_id: null,
    created_at: "2025-09-01T10:00:00Z",
    date: "2025-09-06",
    is_friendly: false,
    kickoff_time: null,
    meetup_time: null,
    notes: null,
    club_notes: null,
    opponent_name: `Opp ${id}`,
    player_of_the_match_id: null,
    players_player_of_the_match_id: null,
    status: "played",
    stage: null,
    team_id: "t1",
    updated_at: "2025-09-01T10:00:00Z",
    home_away: "home",
    venue_id: null,
    competition: null,
    venue: null,
    goals_for: 1,
    goals_against: 0,
    ...overrides,
  };
}

function roster(id: string, extra: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    id,
    person_id: `person-${id}`,
    team_player_id: `tp-${id}`,
    first_name: id,
    last_name: "Smith",
    position: null,
    shirt_number: null,
    active: true,
    ...extra,
  };
}

describe("buildReportMatches", () => {
  it("keeps only played matches, oldest first, with a result", () => {
    const rows = [
      dbMatch("late", { date: "2025-10-01", goals_for: 0, goals_against: 2 }),
      dbMatch("scheduled", { status: "scheduled" }),
      dbMatch("early", { date: "2025-09-01", goals_for: 2, goals_against: 2 }),
      dbMatch("cancelled", { status: "cancelled" }),
    ];
    const result = buildReportMatches(rows);
    expect(result.map((m) => m.id)).toEqual(["early", "late"]);
    expect(result.map((m) => m.result)).toEqual(["D", "L"]);
  });

  it("orders same-day matches by creation time", () => {
    const rows = [
      dbMatch("b", { created_at: "2025-09-01T12:00:00Z" }),
      dbMatch("a", { created_at: "2025-09-01T09:00:00Z" }),
    ];
    expect(buildReportMatches(rows).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("labels friendlies and competition fixtures", () => {
    const [friendly, league] = buildReportMatches([
      dbMatch("f", { is_friendly: true, date: "2025-09-01" }),
      dbMatch("l", {
        date: "2025-09-02",
        competition_id: "c1",
        competition: {
          id: "c1",
          name: "Official League Name",
          display_name: "Junior League",
          kind: "league",
        },
      }),
    ]);
    expect(friendly!.competitionLabel).toBe("Friendly");
    expect(league!.competitionLabel).toBe("Junior League");
    expect(league!.competitionId).toBe("c1");
  });
});

describe("buildReportPlayers", () => {
  const team = {
    id: "t1",
    name: "U10 Lions",
    display_name: null,
    season_label: "2025/26",
    age_group: "U10",
    gender: "boys" as const,
  };
  const club = { name: "Club", colour: "#112233", icon_url: null };
  const stats = {
    team,
    club,
    competitiveRecords: {},
    resultsOverTime: [],
    goalsByPlayer: [
      {
        playerId: "a",
        personId: "pa",
        name: "a",
        goals: 4,
        position: null,
        matchesPlayed: 3,
        periodsPlayed: 6,
        goalCompetitions: [],
      },
    ],
    assistsByPlayer: [{ playerId: "a", personId: "pa", name: "a", count: 2 }],
    potmByPlayer: [{ playerId: "b", personId: "pb", name: "b", count: 1 }],
    matchesPlayed: [
      { playerId: "a", personId: "pa", name: "a", count: 3 },
      { playerId: "c", personId: "pc", name: "c", count: 2 },
    ],
  };

  it("merges the season lines onto the roster", () => {
    const players = buildReportPlayers({
      roster: [roster("a", { shirt_number: 9 }), roster("b")],
      ...stats,
    });
    const a = players.find((p) => p.id === "a")!;
    expect(a).toMatchObject({
      name: "a",
      firstName: "a",
      shirtNumber: 9,
      goals: 4,
      assists: 2,
      appearances: 3,
      playerOfTheMatch: 0,
    });
    expect(players.find((p) => p.id === "b")!.playerOfTheMatch).toBe(1);
  });

  it("builds each card from the team, club and competitive stats", () => {
    const [a] = buildReportPlayers({
      ...stats,
      roster: [
        roster("a", {
          first_name: " Al ",
          shirt_number: 7,
          position: "FWD",
        }),
      ],
      goalsByPlayer: [
        {
          ...stats.goalsByPlayer[0]!,
          goals: 3,
          goalCompetitions: [
            {
              competitionId: "c",
              competitionKind: "league",
              isFriendly: false,
            },
            { competitionId: null, competitionKind: null, isFriendly: true },
            { competitionId: "c", competitionKind: "cup", isFriendly: false },
          ],
        },
      ],
      assistsByPlayer: [
        {
          ...stats.assistsByPlayer[0]!,
          events: [
            {
              competitionId: "c",
              competitionKind: "league",
              isFriendly: false,
            },
          ],
        },
      ],
      competitiveRecords: { a: { wins: 4, draws: 1, losses: 2 } },
    });
    expect(a!.firstName).toBe("Al");
    expect(a!.card).toEqual({
      playerId: "a",
      teamId: "t1",
      clubName: "Club",
      clubColour: "#112233",
      clubIconUrl: null,
      teamName: "U10 Lions",
      ageGroup: "U10",
      seasonLabel: "2025/26",
      firstName: "Al",
      lastName: null,
      shirtNumber: 7,
      positionLabel: "Forward",
      stats: {
        appearances: 7,
        wins: 4,
        draws: 1,
        losses: 2,
        // Friendlies are left out of the card, as on the shared card.
        goals: 2,
        assists: 1,
        potm: 0,
      },
    });
  });

  it("never shows a surname, even on adult teams", () => {
    for (const gender of ["men", "women", "boys", "girls"] as const) {
      const [a] = buildReportPlayers({
        ...stats,
        team: { ...team, gender },
        roster: [roster("a")],
      });
      expect(a!.name).toBe("a");
      expect(a!.firstName).toBe("a");
      expect(a!.card.firstName).toBe("a");
      expect(a!.card.lastName).toBeNull();
      expect(JSON.stringify(a)).not.toContain("Smith");
    }
  });

  it('falls back to "Player" when there is no first name', () => {
    const [a] = buildReportPlayers({
      ...stats,
      roster: [roster("a", { first_name: "  " })],
    });
    expect(a!.name).toBe("Player");
  });

  it("gives a player with no matches a zero record", () => {
    const [b] = buildReportPlayers({ ...stats, roster: [roster("b")] });
    expect(b!.card.stats).toMatchObject({
      appearances: 0,
      wins: 0,
      goals: 0,
    });
  });

  it("falls back to the default colour for an invalid club colour", () => {
    const [a] = buildReportPlayers({
      ...stats,
      club: { ...club, colour: "green" },
      roster: [roster("a")],
    });
    expect(a!.card.clubColour).toBeNull();
  });

  it("keeps inactive players only when they played", () => {
    const players = buildReportPlayers({
      roster: [
        roster("a"),
        roster("b", { active: false }),
        roster("c", { active: false }),
      ],
      ...stats,
    });
    expect(players.map((p) => p.id)).toEqual(["a", "c"]);
  });
});

function coachEntry(
  id: string,
  first: string,
  last: string,
  role: string | null,
): TeamCoachEntry {
  return {
    team_coach_id: `tc-${id}`,
    coach_id: id,
    person_id: `p-${id}`,
    name: `${first} ${last}`,
    first_name: first,
    last_name: last,
    role,
  };
}

function resultPoint(
  result: "W" | "D" | "L",
  goalsFor: number,
  goalsAgainst: number,
  isFriendly = false,
): ResultOverTimePoint {
  return {
    matchId: `m-${goalsFor}-${goalsAgainst}-${isFriendly}`,
    date: "2025-09-01",
    label: "",
    goalsFor,
    goalsAgainst,
    result,
    competitionId: null,
    competitionKind: null,
    competitionName: null,
    isFriendly,
  };
}

describe("buildReportCoaches", () => {
  const team = {
    id: "t1",
    name: "U10 Lions",
    display_name: null,
    season_label: "2025/26",
    age_group: "U10",
  };
  const club = { name: "Club", colour: "#112233", icon_url: null };

  it("puts the head coach first, then the others by name", () => {
    const result = buildReportCoaches({
      team,
      club,
      resultsOverTime: [],
      coaches: [
        coachEntry("z", "Zoe", "Young", "Assistant Coach"),
        coachEntry("h", "Hal", "Head", "Head Coach"),
        coachEntry("a", "Abe", "Old", null),
      ],
    });
    expect(result.map((c) => c.id)).toEqual(["h", "a", "z"]);
    expect(result.map((c) => c.isHead)).toEqual([true, false, false]);
  });

  it("builds a card with the full name, role and the team's competitive record", () => {
    const [coach] = buildReportCoaches({
      team,
      club,
      coaches: [coachEntry("h", "Hal", "Head", "Head Coach")],
      resultsOverTime: [
        resultPoint("W", 3, 1),
        resultPoint("D", 0, 0),
        resultPoint("L", 1, 2),
        // Friendlies are left out of the card.
        resultPoint("W", 9, 0, true),
      ],
    });
    expect(coach!.card).toEqual({
      coachId: "h",
      teamId: "t1",
      clubName: "Club",
      clubColour: "#112233",
      clubIconUrl: null,
      teamName: "U10 Lions",
      ageGroup: "U10",
      seasonLabel: "2025/26",
      firstName: "Hal",
      lastName: "Head",
      roleLabel: "Head Coach",
      stats: {
        played: 3,
        wins: 1,
        draws: 1,
        losses: 1,
        goalsFor: 4,
        goalsAgainst: 3,
      },
    });
  });

  it('labels a coach with no role "Coach"', () => {
    const [coach] = buildReportCoaches({
      team,
      club,
      resultsOverTime: [],
      coaches: [coachEntry("a", "Abe", "Old", null)],
    });
    expect(coach!.card.roleLabel).toBe("Coach");
    expect(coach!.role).toBeNull();
  });

  it("falls back to the default colour for an invalid club colour", () => {
    const [coach] = buildReportCoaches({
      team,
      club: { ...club, colour: "green" },
      resultsOverTime: [],
      coaches: [coachEntry("a", "Abe", "Old", null)],
    });
    expect(coach!.card.clubColour).toBeNull();
  });

  it("returns nothing for a team with no coaches", () => {
    expect(
      buildReportCoaches({ team, club, coaches: [], resultsOverTime: [] }),
    ).toEqual([]);
  });
});

describe("buildReportCompetitions", () => {
  const competition = (id: string, extra: Partial<Competition> = {}) =>
    ({
      id,
      name: `Comp ${id}`,
      display_name: null,
      kind: "league",
      result: "none",
      ...extra,
    }) as Competition;

  it("records the team's results in each competition", () => {
    const matches = buildReportMatches([
      dbMatch("1", { competition_id: "c1", goals_for: 3, goals_against: 1 }),
      dbMatch("2", { competition_id: "c1", goals_for: 0, goals_against: 0 }),
      dbMatch("3", { competition_id: "c2", goals_for: 0, goals_against: 1 }),
    ]);
    const result = buildReportCompetitions(
      [competition("c1", { result: "champions" }), competition("c2")],
      matches,
    );
    expect(result[0]).toMatchObject({
      id: "c1",
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      resultLabel: "Champions",
    });
    expect(result[1]).toMatchObject({ id: "c2", played: 1, losses: 1 });
  });

  it("drops competitions with no matches and no outcome", () => {
    const result = buildReportCompetitions(
      [competition("empty"), competition("done", { result: "completed" })],
      [],
    );
    expect(result.map((c) => c.id)).toEqual(["done"]);
  });

  it("prefers the display name", () => {
    const [result] = buildReportCompetitions(
      [competition("c1", { display_name: "Shown", result: "completed" })],
      [],
    );
    expect(result!.name).toBe("Shown");
  });
});

function dbVenue(id: string, extra: Partial<Venue> = {}): Venue {
  return {
    id,
    club_id: "club",
    name: `Venue ${id}`,
    address_line1: null,
    address_line2: null,
    town_city: null,
    postcode: null,
    surface: [],
    parking: "unknown",
    food_and_drink: [],
    photo_url: null,
    created_at: "",
    updated_at: "",
    ...extra,
  };
}

describe("buildReportVenues", () => {
  it("lists only venues with a played match, most visited first", () => {
    const venues = [dbVenue("a"), dbVenue("b"), dbVenue("never")];
    const result = buildReportVenues(
      [
        dbMatch("1", { venue_id: "b" }),
        dbMatch("2", { venue_id: "a" }),
        dbMatch("3", { venue_id: "b" }),
        dbMatch("4", { venue_id: "never", status: "scheduled" }),
        dbMatch("5", { venue_id: null }),
      ],
      venues,
      null,
    );
    expect(result.map((v) => v.id)).toEqual(["b", "a"]);
    expect(result.map((v) => v.played)).toEqual([2, 1]);
  });

  it("breaks ties by name", () => {
    const result = buildReportVenues(
      [dbMatch("1", { venue_id: "z" }), dbMatch("2", { venue_id: "a" })],
      [dbVenue("z", { name: "Zed Park" }), dbVenue("a", { name: "Alpha" })],
      null,
    );
    expect(result.map((v) => v.name)).toEqual(["Alpha", "Zed Park"]);
  });

  it("records results, goals and the biggest win at each venue", () => {
    const [venue] = buildReportVenues(
      [
        dbMatch("1", { venue_id: "a", goals_for: 3, goals_against: 0 }),
        dbMatch("2", {
          venue_id: "a",
          goals_for: 5,
          goals_against: 1,
          opponent_name: "Rose",
        }),
        dbMatch("3", { venue_id: "a", goals_for: 1, goals_against: 1 }),
        dbMatch("4", { venue_id: "a", goals_for: 0, goals_against: 2 }),
      ],
      [dbVenue("a")],
      "a",
    );
    expect(venue).toMatchObject({
      played: 4,
      wins: 2,
      draws: 1,
      losses: 1,
      goalsFor: 9,
      goalsAgainst: 4,
      biggestWin: "5–1 v Rose",
      isHome: true,
    });
  });

  it("has no biggest win when the team never won there", () => {
    const [venue] = buildReportVenues(
      [dbMatch("1", { venue_id: "a", goals_for: 0, goals_against: 1 })],
      [dbVenue("a")],
      null,
    );
    expect(venue!.biggestWin).toBeNull();
    expect(venue!.isHome).toBe(false);
  });

  it("describes the ground, leaving out what is not recorded", () => {
    const [full, bare] = buildReportVenues(
      [
        dbMatch("1", { venue_id: "full" }),
        dbMatch("2", { venue_id: "full" }),
        dbMatch("3", { venue_id: "bare" }),
      ],
      [
        dbVenue("full", {
          address_line1: "1 High St",
          town_city: "Townsville",
          postcode: "TS1 1AA",
          surface: ["astro", "unknown", "grass"],
          parking: "paid_parking",
          food_and_drink: ["cafe", "tuck_shop"],
        }),
        dbVenue("bare", { surface: ["unknown"] }),
      ],
      null,
    );
    expect(full).toMatchObject({
      address: "1 High St, Townsville, TS1 1AA",
      surface: "Astro, Grass",
      parking: "Paid parking",
      foodAndDrink: "Cafe, Tuck shop",
    });
    expect(bare).toMatchObject({
      address: null,
      surface: null,
      parking: null,
      foodAndDrink: null,
    });
  });
});

describe("buildReportData", () => {
  it("assembles the report with the head coach and sorted awards", () => {
    const data = buildReportData({
      club: { name: "Club", colour: "#112233", icon_url: null },
      team: {
        id: "t1",
        name: "U10 Lions",
        display_name: "Lions",
        season_label: "2025/26",
        age_group: "U10",
        gender: "boys",
        photo_url: null,
        home_venue_id: null,
        training_venue_id: null,
        training_days: null,
      },
      venues: [],
      matches: [dbMatch("m1")],
      roster: [roster("a")],
      goalsByPlayer: [],
      assistsByPlayer: [],
      potmByPlayer: [],
      matchesPlayed: [],
      competitiveRecords: {},
      resultsOverTime: [],
      coaches: [
        {
          team_coach_id: "1",
          coach_id: "c1",
          person_id: "p1",
          name: "Ann Assistant",
          first_name: "Ann",
          last_name: "Assistant",
          role: "Assistant Coach",
        },
        {
          team_coach_id: "2",
          coach_id: "c2",
          person_id: "p2",
          name: "Hal Head",
          first_name: "Hal",
          last_name: "Head",
          role: "Head Coach",
        },
      ],
      competitions: [],
      monthAwards: [
        {
          id: "2",
          team_id: "t1",
          player_id: "a",
          month: "2025-11",
          notes: "  ",
          created_at: "",
          updated_at: "",
          player: {
            id: "a",
            person_id: "pa",
            first_name: "Al",
            last_name: "Lee",
          },
        },
        {
          id: "1",
          team_id: "t1",
          player_id: "a",
          month: "2025-09",
          notes: "Great",
          created_at: "",
          updated_at: "",
          player: {
            id: "a",
            person_id: "pa",
            first_name: "Al",
            last_name: "Lee",
          },
        },
      ],
      content: {
        coachNotes: { expectedPath: "x", markdown: null },
        lookingAhead: { expectedPath: "y", markdown: null },
        seasonAwards: emptySeasonAwards("z"),
      },
    });

    expect(data.team.name).toBe("Lions");
    expect(data.team.summary).toBe("Club · Boys · U10 · 2025/26");
    expect(data.team.homeVenue).toBeNull();
    expect(data.team.trainingDays).toBe("—");
    expect(data.club.iconUrl).toBe("/football-icon.svg");
    expect(data.headCoachName).toBe("Hal Head");
    expect(data.staff).toHaveLength(2);
    expect(data.monthAwards.map((a) => a.month)).toEqual([
      "2025-09",
      "2025-11",
    ]);
    expect(data.monthAwards[0]).toMatchObject({
      playerName: "Al",
      monthLabel: "September 2025",
      notes: "Great",
    });
    expect(data.monthAwards[1]!.notes).toBeNull();
    // First names only: the winner's surname ("Lee") is never carried through.
    expect(JSON.stringify(data.monthAwards)).not.toContain("Lee");
  });
});

describe("team info", () => {
  const base = {
    club: { name: "The FA", colour: null, icon_url: null },
    team: {
      id: "t1",
      name: "England",
      display_name: null,
      season_label: "1995/96",
      age_group: "Adults",
      gender: "men" as const,
      photo_url: "https://example.com/team.jpg",
      home_venue_id: "v1",
      training_venue_id: "v2",
      training_days: ["mon", "wed", "fri"],
    },
    venues: [
      dbVenue("v1", { name: "Wembley Stadium" }),
      dbVenue("v2", { name: "Lilleshall" }),
    ],
    matches: [],
    roster: [],
    goalsByPlayer: [],
    assistsByPlayer: [],
    potmByPlayer: [],
    matchesPlayed: [],
    competitiveRecords: {},
    resultsOverTime: [],
    coaches: [
      {
        team_coach_id: "1",
        coach_id: "c1",
        person_id: "p1",
        name: "Terry Venables",
        first_name: "Terry",
        last_name: "Venables",
        role: "Head Coach",
      },
    ],
    competitions: [],
    monthAwards: [],
    content: {
      coachNotes: { expectedPath: "x", markdown: null },
      lookingAhead: { expectedPath: "y", markdown: null },
      seasonAwards: emptySeasonAwards("z"),
    },
  };

  it("gives the basics shown on the team page", () => {
    const data = buildReportData(base);
    expect(data.team).toMatchObject({
      name: "England",
      summary: "The FA · Men · Adults · 1995/96",
      homeVenue: "Wembley Stadium",
      trainingVenue: "Lilleshall",
      trainingDays: "Mon, Wed, Fri",
      photoUrl: "https://example.com/team.jpg",
    });
    expect(data.headCoachName).toBe("Terry Venables");
  });

  it("leaves a venue blank when it is not set or no longer exists", () => {
    const data = buildReportData({
      ...base,
      team: { ...base.team, home_venue_id: null, training_venue_id: "gone" },
    });
    expect(data.team.homeVenue).toBeNull();
    expect(data.team.trainingVenue).toBeNull();
  });
});
