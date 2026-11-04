import {
  formatAwardMonth,
  labelCompetitionKind,
  labelCompetitionResult,
  matchCompetitionLabel,
  resultLetter,
  teamDisplayName,
} from "@/lib/format";
import { clubIconSrc } from "@/lib/clubs/branding";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { PlayerOfTheMonthWithPlayer } from "@/lib/data/player-of-the-month";
import type { RosterPlayer } from "@/lib/data/players";
import type { PlayerCountPoint, GoalsByPlayerPoint } from "@/lib/data/stats";
import type { Competition } from "@/lib/supabase/database.types";
import type {
  ReportCompetition,
  ReportContent,
  ReportData,
  ReportMatch,
  ReportPlayer,
} from "@/lib/report/types";

export type BuildReportInput = {
  club: { name: string; colour: string | null; icon_url: string | null } | null;
  team: {
    name: string;
    display_name: string | null;
    season_label: string;
    photo_url: string | null;
  };
  /** Any status; only played matches with a score are kept. */
  matches: MatchWithRelations[];
  roster: RosterPlayer[];
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  potmByPlayer: PlayerCountPoint[];
  matchesPlayed: PlayerCountPoint[];
  coaches: TeamCoachEntry[];
  competitions: Competition[];
  monthAwards: PlayerOfTheMonthWithPlayer[];
  content: ReportContent;
};

const HEAD_COACH_ROLE = "Head Coach";

/** Played matches, oldest first. Rows without a result are dropped. */
export function buildReportMatches(
  matches: readonly MatchWithRelations[],
): ReportMatch[] {
  return matches
    .filter((m) => m.status === "played")
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.created_at.localeCompare(b.created_at),
    )
    .flatMap((m): ReportMatch[] => {
      const result = resultLetter(m.goals_for, m.goals_against);
      if (!result) return [];
      return [
        {
          id: m.id,
          date: m.date,
          opponent: m.opponent_name,
          homeAway: m.home_away,
          competitionId: m.competition_id,
          competitionLabel: matchCompetitionLabel(m),
          isFriendly: m.is_friendly,
          goalsFor: m.goals_for,
          goalsAgainst: m.goals_against,
          result,
        },
      ];
    });
}

function countByPlayer(
  points: readonly PlayerCountPoint[],
): Map<string, number> {
  return new Map(points.map((p) => [p.playerId, p.count]));
}

/**
 * One line per squad member. Inactive players are kept only when they played,
 * so a player who left mid-season still appears in the book.
 */
export function buildReportPlayers(input: {
  roster: readonly RosterPlayer[];
  goalsByPlayer: readonly GoalsByPlayerPoint[];
  assistsByPlayer: readonly PlayerCountPoint[];
  potmByPlayer: readonly PlayerCountPoint[];
  matchesPlayed: readonly PlayerCountPoint[];
}): ReportPlayer[] {
  const goals = new Map(input.goalsByPlayer.map((p) => [p.playerId, p.goals]));
  const assists = countByPlayer(input.assistsByPlayer);
  const potm = countByPlayer(input.potmByPlayer);
  const apps = countByPlayer(input.matchesPlayed);

  return input.roster
    .map((r): ReportPlayer => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`.trim(),
      shirtNumber: r.shirt_number,
      position: r.position,
      appearances: apps.get(r.id) ?? 0,
      goals: goals.get(r.id) ?? 0,
      assists: assists.get(r.id) ?? 0,
      playerOfTheMatch: potm.get(r.id) ?? 0,
    }))
    .filter((p) => {
      const rosterRow = input.roster.find((r) => r.id === p.id);
      return rosterRow?.active || p.appearances > 0;
    });
}

/**
 * Competitions that had a played match or a recorded outcome, with the team's
 * record in each. Friendlies are not competitions and are left out.
 */
export function buildReportCompetitions(
  competitions: readonly Competition[],
  matches: readonly ReportMatch[],
): ReportCompetition[] {
  return competitions
    .map((c): ReportCompetition => {
      const own = matches.filter((m) => m.competitionId === c.id);
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      for (const m of own) {
        if (m.result === "W") wins += 1;
        else if (m.result === "D") draws += 1;
        else losses += 1;
        goalsFor += m.goalsFor;
        goalsAgainst += m.goalsAgainst;
      }
      return {
        id: c.id,
        name: c.display_name?.trim() || c.name,
        kindLabel: labelCompetitionKind(c.kind),
        result: c.result,
        resultLabel: labelCompetitionResult(c.result),
        played: own.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
      };
    })
    .filter(
      (c) => c.played > 0 || (c.result !== "none" && c.result !== "cancelled"),
    )
    .sort((a, b) => b.played - a.played || a.name.localeCompare(b.name));
}

export function buildReportData(input: BuildReportInput): ReportData {
  const matches = buildReportMatches(input.matches);
  const headCoach = input.coaches.find((c) => c.role === HEAD_COACH_ROLE);

  return {
    club: {
      name: input.club?.name ?? "",
      colour: input.club?.colour ?? null,
      iconUrl: clubIconSrc(input.club?.icon_url),
    },
    team: {
      name: teamDisplayName(input.team),
      seasonLabel: input.team.season_label,
      photoUrl: input.team.photo_url,
    },
    staff: input.coaches.map((c) => ({ name: c.name, role: c.role })),
    headCoachName: headCoach?.name ?? null,
    matches,
    competitions: buildReportCompetitions(input.competitions, matches),
    players: buildReportPlayers(input),
    monthAwards: input.monthAwards
      .map((a) => ({
        month: a.month,
        monthLabel: formatAwardMonth(a.month),
        playerName: `${a.player.first_name} ${a.player.last_name}`.trim(),
        notes: a.notes?.trim() || null,
      }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    content: input.content,
  };
}
