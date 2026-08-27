import type { ViewerContext } from "@/lib/authz/context";
import type { Match, Person, Team, Venue } from "@/lib/supabase/database.types";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { PersonWithRoles } from "@/lib/data/people";

export function teamFixture(
  overrides: Partial<Team> & Pick<Team, "id" | "club_id"> = {
    id: "team-1",
    club_id: "club-1",
  },
): Team {
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

export function viewerFixture(
  overrides: Partial<ViewerContext> = {},
): ViewerContext {
  const visibleTeams = overrides.visibleTeams ?? [
    teamFixture({ id: "team-1", club_id: "club-1" }),
  ];
  return {
    userId: "user-1",
    email: "coach@example.com",
    firstName: "Casey",
    lastName: "Coach",
    displayName: "Casey Coach",
    personId: "person-self",
    managementClubIds: [],
    coachTeamIds: ["team-1"],
    managementTeamIds: [],
    memberTeamRoles: { "team-1": ["coach"] },
    guardianPlayerIds: [],
    selfPlayerIds: [],
    visibleTeams,
    editableTeamIds: ["team-1"],
    isManagement: false,
    ...overrides,
  };
}

export function clubManagerViewer(
  overrides: Partial<ViewerContext> = {},
): ViewerContext {
  return viewerFixture({
    managementClubIds: ["club-1"],
    isManagement: true,
    editableTeamIds: ["team-1"],
    ...overrides,
  });
}

export function matchFixture(
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    id: "match-1",
    team_id: "team-1",
    opponent_name: "Rivals FC",
    date: "2025-09-01",
    kickoff_time: "10:00",
    home_away: "home",
    venue_id: null,
    competition_id: null,
    is_friendly: true,
    player_of_the_match_id: null,
    players_player_of_the_match_id: null,
    status: "scheduled",
    goals_for: 0,
    goals_against: 0,
    notes: null,
    club_notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    competition: null,
    venue: null,
    ...overrides,
  };
}

export function personFixture(
  overrides: Partial<Person> & Pick<Person, "id"> = { id: "person-1" },
): Person {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    phone: null,
    auth_user_id: null,
    account_status: "none",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function personWithRolesFixture(
  overrides: Partial<PersonWithRoles> = {},
): PersonWithRoles {
  return {
    ...personFixture({ id: overrides.id ?? "person-1" }),
    managers: [],
    coaches: [],
    guardians: [],
    players: [],
    outstanding_invitation: null,
    ...overrides,
  };
}

export function venueFixture(
  overrides: Partial<Venue> & Pick<Venue, "id" | "club_id"> = {
    id: "venue-1",
    club_id: "club-1",
  },
): Venue {
  return {
    name: "Main Pitch",
    address: null,
    postcode: null,
    notes: null,
    lat: null,
    lng: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function plainMatchFixture(overrides: Partial<Match> = {}): Match {
  const row = matchFixture(overrides as Partial<MatchWithRelations>);
  return {
    id: row.id,
    team_id: row.team_id,
    opponent_name: row.opponent_name,
    date: row.date,
    kickoff_time: row.kickoff_time,
    home_away: row.home_away,
    venue_id: row.venue_id,
    competition_id: row.competition_id,
    is_friendly: row.is_friendly,
    player_of_the_match_id: row.player_of_the_match_id,
    players_player_of_the_match_id: row.players_player_of_the_match_id,
    status: row.status,
    notes: row.notes,
    club_notes: row.club_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
