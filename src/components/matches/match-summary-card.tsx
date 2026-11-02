import type { ReactNode } from "react";
import { matchAllowsPostcard } from "@/lib/constants";
import type { MatchWithRelations } from "@/lib/data/matches";
import { matchCompetitionLabel } from "@/lib/format";
import type { MatchStatus } from "@/lib/supabase/database.types";
import { MatchHero } from "@/components/matches/match-hero";
import { MatchCardShare } from "@/components/postcards/match-card-share";

/**
 * Share control for a scheduled or played match. Dashboard cards, the matches
 * list, and the match page all use this so a completed result shares the same
 * way as a fixture.
 */
export function matchCardShare(match: {
  id: string;
  status: MatchStatus;
}): ReactNode {
  if (!matchAllowsPostcard(match.status)) return undefined;
  return (
    <MatchCardShare
      matchId={match.id}
      kind={match.status === "scheduled" ? "scheduled" : "played"}
    />
  );
}

/**
 * The match card used on the dashboard and the matches list, for every
 * status. Both pages render this so size, scheduled chip, score, meta lines,
 * and share stay the same.
 */
export function MatchSummaryCard({
  match,
  teamName,
}: {
  match: MatchWithRelations;
  teamName: string;
}) {
  return (
    <MatchHero
      size="card"
      href={`/matches/${match.id}`}
      teamName={teamName}
      opponentName={match.opponent_name}
      homeAway={match.home_away}
      status={match.status}
      goalsFor={match.goals_for}
      goalsAgainst={match.goals_against}
      competitionName={matchCompetitionLabel(match)}
      date={match.date}
      kickoffTime={match.kickoff_time}
      meetupTime={match.meetup_time}
      venueName={match.venue?.name ?? null}
      actions={matchCardShare(match)}
    />
  );
}
