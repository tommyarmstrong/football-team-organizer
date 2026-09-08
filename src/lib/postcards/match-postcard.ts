import "server-only";

import { STATS_FORM_LIMIT } from "@/lib/constants";
import { getClub } from "@/lib/data/clubs";
import { listGoalsForMatch } from "@/lib/data/goals";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { getFormThroughMatch } from "@/lib/data/stats";
import { getTeam } from "@/lib/data/team";
import { isValidClubColour } from "@/lib/clubs/branding";
import {
  formatHomeFirstScore,
  formatMatchDate,
  labelHomeAway,
  matchCompetitionLabel,
  resultLetter,
  scoreFromGoals,
  teamDisplayName,
} from "@/lib/format";
import {
  buildPostcardGoalList,
  labelFor,
  playerFromRoster,
  postcardCaption,
  postcardFileName,
  toStoryEvents,
} from "@/lib/postcards/content";
import { postcardStory } from "@/lib/postcards/story";
import type { MatchPostcardPayload } from "@/lib/postcards/types";

export type { MatchPostcardPayload } from "@/lib/postcards/types";
export {
  buildPostcardGoalList,
  postcardCaption,
  postcardFileName,
  postcardPlayerLabel,
} from "@/lib/postcards/content";

export async function buildMatchPostcardPayload(
  matchId: string,
): Promise<{ data: MatchPostcardPayload | null; error: string | null }> {
  const { data: match, error: matchError } = await getMatch(matchId);
  if (matchError) return { data: null, error: matchError };
  if (!match) return { data: null, error: null };
  if (match.status !== "played") {
    return {
      data: null,
      error: "Postcard is only available for played matches.",
    };
  }

  const [teamResult, goalsResult, rosterResult] = await Promise.all([
    getTeam(match.team_id),
    listGoalsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
  ]);

  if (teamResult.error) return { data: null, error: teamResult.error };
  if (!teamResult.data) return { data: null, error: "Team not found." };
  if (goalsResult.error) return { data: null, error: goalsResult.error };
  if (rosterResult.error) return { data: null, error: rosterResult.error };

  const team = teamResult.data;
  const goals = goalsResult.data;
  const roster = rosterResult.data;
  const { data: club } = await getClub(team.club_id);

  const { goalsFor, goalsAgainst } = scoreFromGoals(goals);
  const result = resultLetter(goalsFor, goalsAgainst) ?? "D";
  const { form } = await getFormThroughMatch(
    team.id,
    { id: match.id, date: match.date, created_at: match.created_at },
    result,
    STATS_FORM_LIMIT,
  );

  const gender = team.gender;
  const teamName = teamDisplayName(team);
  const story = postcardStory({
    goalsFor,
    goalsAgainst,
    isFriendly: match.is_friendly,
    events: toStoryEvents(goals),
  });
  const coachPotmLabel = labelFor(
    playerFromRoster(roster, match.player_of_the_match_id),
    gender,
  );
  const playersPotmLabel = labelFor(
    playerFromRoster(roster, match.players_player_of_the_match_id),
    gender,
  );
  const isAway = match.home_away === "away";
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

  const colour =
    club?.colour && isValidClubColour(club.colour) ? club.colour : null;

  return {
    data: {
      matchId: match.id,
      clubName: club?.name ?? "",
      clubColour: colour,
      clubIconUrl: club?.icon_url ?? null,
      teamName,
      seasonLabel: team.season_label,
      opponentName: match.opponent_name,
      dateLabel: formatMatchDate(match.date),
      homeAwayLabel: labelHomeAway(match.home_away),
      competitionLabel: matchCompetitionLabel(match),
      homeName: isAway ? match.opponent_name : teamName,
      awayName: isAway ? teamName : match.opponent_name,
      homeScore: isAway ? goalsAgainst : goalsFor,
      awayScore: isAway ? goalsFor : goalsAgainst,
      scoreLabel: formatHomeFirstScore(goalsFor, goalsAgainst, match.home_away),
      result,
      story,
      goalList: buildPostcardGoalList(goals, { gender, roster }),
      coachPotmLabel,
      playersPotmLabel,
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
