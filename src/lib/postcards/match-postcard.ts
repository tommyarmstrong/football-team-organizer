import "server-only";

import { matchAllowsPostcard, STATS_FORM_LIMIT } from "@/lib/constants";
import { isValidClubColour } from "@/lib/clubs/branding";
import { getClub } from "@/lib/data/clubs";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { getMatch, type MatchWithRelations } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { getFormThroughMatch } from "@/lib/data/stats";
import { getTeam } from "@/lib/data/team";
import { getVenue } from "@/lib/data/venues";
import {
  formatHomeFirstScore,
  formatKickoffTime,
  formatMatchDate,
  formatVenueAddress,
  labelHomeAway,
  matchCompetitionLabel,
  resultLetter,
  scoreFromGoals,
  teamDisplayName,
} from "@/lib/format";
import {
  buildPostcardGoalList,
  nameOnlyLabelFor,
  playerFromRoster,
  postcardCaption,
  postcardFileName,
  postcardSquadLines,
  scheduledPostcardCaption,
} from "@/lib/postcards/content";
import { postcardStory } from "@/lib/postcards/story";
import type { MatchPostcardPayload } from "@/lib/postcards/types";
import type { Club, Team } from "@/lib/supabase/database.types";

export type { MatchPostcardPayload } from "@/lib/postcards/types";
export {
  buildPostcardGoalList,
  postcardCaption,
  postcardFileName,
  postcardPlayerLabel,
  scheduledPostcardCaption,
} from "@/lib/postcards/content";

async function loadTeamAndClub(
  match: MatchWithRelations,
): Promise<
  | { team: Team; club: Club | null; error: null }
  | { team: null; club: null; error: string }
> {
  const teamResult = await getTeam(match.team_id);
  if (teamResult.error) {
    return { team: null, club: null, error: teamResult.error };
  }
  if (!teamResult.data) {
    return { team: null, club: null, error: "Team not found." };
  }
  const { data: club } = await getClub(teamResult.data.club_id);
  return { team: teamResult.data, club: club ?? null, error: null };
}

function postcardClubColour(club: Club | null): string | null {
  return club?.colour && isValidClubColour(club.colour) ? club.colour : null;
}

function postcardSides(
  match: MatchWithRelations,
  teamName: string,
): { isAway: boolean; homeName: string; awayName: string } {
  const isAway = match.home_away === "away";
  return {
    isAway,
    homeName: isAway ? match.opponent_name : teamName,
    awayName: isAway ? teamName : match.opponent_name,
  };
}

async function buildPlayedMatchPostcardPayload(
  match: MatchWithRelations,
): Promise<{ data: MatchPostcardPayload | null; error: string | null }> {
  const [teamClub, goalsResult, rosterResult, matchPlayersResult] =
    await Promise.all([
      loadTeamAndClub(match),
      listGoalsForMatch(match.id),
      listRosterForTeam(match.team_id, { includeInactive: true }),
      listMatchPlayers(match.id),
    ]);

  if (teamClub.error !== null) return { data: null, error: teamClub.error };
  if (goalsResult.error) return { data: null, error: goalsResult.error };
  if (rosterResult.error) return { data: null, error: rosterResult.error };
  if (matchPlayersResult.error) {
    return { data: null, error: matchPlayersResult.error };
  }

  const { team, club } = teamClub;
  const goals = goalsResult.data;
  const roster = rosterResult.data;
  const gender = team.gender;
  const squadLines = postcardSquadLines(
    roster,
    matchPlayersResult.data.map((row) => row.player_id),
    gender,
  );

  const { goalsFor, goalsAgainst } = scoreFromGoals(goals);
  const result = resultLetter(goalsFor, goalsAgainst) ?? "D";
  const { form } = await getFormThroughMatch(
    team.id,
    { id: match.id, date: match.date, created_at: match.created_at },
    result,
    STATS_FORM_LIMIT,
  );

  const teamName = teamDisplayName(team);
  const story = postcardStory({
    goalsFor,
    goalsAgainst,
  });
  const coachPotmLabel = nameOnlyLabelFor(
    playerFromRoster(roster, match.player_of_the_match_id),
    gender,
  );
  const playersPotmLabel = nameOnlyLabelFor(
    playerFromRoster(roster, match.players_player_of_the_match_id),
    gender,
  );
  const { isAway, homeName, awayName } = postcardSides(match, teamName);
  const caption = postcardCaption({
    teamName,
    opponentName: match.opponent_name,
    goalsFor,
    goalsAgainst,
    story,
    goals,
    gender,
    roster,
    coachPotmLabel,
    playersPotmLabel,
  });

  return {
    data: {
      kind: "played",
      matchId: match.id,
      clubName: club?.name ?? "",
      clubColour: postcardClubColour(club),
      clubIconUrl: club?.icon_url ?? null,
      teamName,
      seasonLabel: team.season_label,
      opponentName: match.opponent_name,
      dateLabel: formatMatchDate(match.date),
      homeAwayLabel: labelHomeAway(match.home_away),
      competitionLabel: matchCompetitionLabel(match),
      homeName,
      awayName,
      homeScore: isAway ? goalsAgainst : goalsFor,
      awayScore: isAway ? goalsFor : goalsAgainst,
      scoreLabel: formatHomeFirstScore(goalsFor, goalsAgainst, match.home_away),
      result,
      story,
      goalList: buildPostcardGoalList(goals, { gender, roster }),
      coachPotmLabel,
      playersPotmLabel,
      squadLines,
      form,
      caption,
      fileName: postcardFileName({
        teamName,
        date: match.date,
        opponentName: match.opponent_name,
      }),
    },
    error: null,
  };
}

async function buildScheduledMatchPostcardPayload(
  match: MatchWithRelations,
): Promise<{ data: MatchPostcardPayload | null; error: string | null }> {
  const teamClub = await loadTeamAndClub(match);
  if (teamClub.error !== null) return { data: null, error: teamClub.error };
  const { team, club } = teamClub;
  const teamName = teamDisplayName(team);
  const { homeName, awayName } = postcardSides(match, teamName);

  let venueAddress: string | null = null;
  if (match.venue_id) {
    const { data: venue } = await getVenue(match.venue_id);
    if (venue) venueAddress = formatVenueAddress(venue);
  }

  const venueName = match.venue?.name?.trim() || null;
  const caption = scheduledPostcardCaption({
    teamName,
    opponentName: match.opponent_name,
    homeAway: match.home_away,
    competitionLabel: matchCompetitionLabel(match),
    dateLabel: formatMatchDate(match.date),
    meetupTime: match.meetup_time,
    kickoffTime: match.kickoff_time,
    venueName,
    venueAddress,
  });

  return {
    data: {
      kind: "scheduled",
      matchId: match.id,
      clubName: club?.name ?? "",
      clubColour: postcardClubColour(club),
      clubIconUrl: club?.icon_url ?? null,
      teamName,
      seasonLabel: team.season_label,
      opponentName: match.opponent_name,
      dateLabel: formatMatchDate(match.date),
      homeAwayLabel: labelHomeAway(match.home_away),
      competitionLabel: matchCompetitionLabel(match),
      homeName,
      awayName,
      venueName,
      venueAddress,
      kickoffLabel: formatKickoffTime(match.kickoff_time),
      meetupLabel: formatKickoffTime(match.meetup_time),
      caption,
      fileName: postcardFileName({
        teamName,
        date: match.date,
        opponentName: match.opponent_name,
      }),
    },
    error: null,
  };
}

export async function buildMatchPostcardPayload(
  matchId: string,
): Promise<{ data: MatchPostcardPayload | null; error: string | null }> {
  const { data: match, error: matchError } = await getMatch(matchId);
  if (matchError) return { data: null, error: matchError };
  if (!match) return { data: null, error: null };
  if (!matchAllowsPostcard(match.status)) {
    return {
      data: null,
      error: "Postcard is only available for scheduled and played matches.",
    };
  }

  if (match.status === "scheduled") {
    return buildScheduledMatchPostcardPayload(match);
  }

  return buildPlayedMatchPostcardPayload(match);
}
