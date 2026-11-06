import {
  formatAwardMonth,
  formatTeamHeaderSummary,
  formatTrainingDays,
  formatVenueAddress,
  formatVenueFoodAndDrink,
  formatVenueSurface,
  labelCompetitionKind,
  labelCompetitionResult,
  matchCompetitionLabel,
  resultLetter,
  teamDisplayName,
} from "@/lib/format";
import { clubIconSrc, isValidClubColour } from "@/lib/clubs/branding";
import {
  coachCardNames,
  coachCardStats,
  coachRoleLabel,
} from "@/lib/postcards/coach-card-content";
import {
  playerCardStats,
  playerPositionLabel,
} from "@/lib/postcards/player-card-content";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { PlayerOfTheMonthWithPlayer } from "@/lib/data/player-of-the-month";
import type { RosterPlayer } from "@/lib/data/players";
import type {
  PlayerCountPoint,
  GoalsByPlayerPoint,
  PlayerRecord,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import { VENUE_PARKING_LABELS } from "@/lib/constants";
import type {
  Competition,
  TeamGender,
  Venue,
} from "@/lib/supabase/database.types";
import type {
  ReportCompetition,
  ReportContent,
  ReportCoach,
  ReportData,
  ReportMatch,
  ReportPlayer,
  ReportVenue,
} from "@/lib/report/types";

export type BuildReportInput = {
  club: { name: string; colour: string | null; icon_url: string | null } | null;
  team: {
    id: string;
    name: string;
    display_name: string | null;
    season_label: string;
    age_group: string;
    gender: TeamGender;
    photo_url: string | null;
    home_venue_id: string | null;
    training_venue_id: string | null;
    training_days: string[] | null;
  };
  /** The club's venues; only the ones with a played match are reported. */
  venues: Venue[];
  /** Any status; only played matches with a score are kept. */
  matches: MatchWithRelations[];
  roster: RosterPlayer[];
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  potmByPlayer: PlayerCountPoint[];
  matchesPlayed: PlayerCountPoint[];
  /** Competitive win/draw/loss per player id (see `getTeamCompetitiveRecords`). */
  competitiveRecords: Record<string, PlayerRecord>;
  /** Every played match, for the coach cards' team record. */
  resultsOverTime: ResultOverTimePoint[];
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
  team: {
    id: string;
    name: string;
    display_name: string | null;
    season_label: string;
    age_group: string;
    gender: TeamGender;
  };
  club: { name: string; colour: string | null; icon_url: string | null } | null;
  roster: readonly RosterPlayer[];
  goalsByPlayer: readonly GoalsByPlayerPoint[];
  assistsByPlayer: readonly PlayerCountPoint[];
  potmByPlayer: readonly PlayerCountPoint[];
  matchesPlayed: readonly PlayerCountPoint[];
  competitiveRecords: Readonly<Record<string, PlayerRecord>>;
}): ReportPlayer[] {
  const goals = new Map(input.goalsByPlayer.map((p) => [p.playerId, p.goals]));
  const assists = countByPlayer(input.assistsByPlayer);
  const potm = countByPlayer(input.potmByPlayer);
  const apps = countByPlayer(input.matchesPlayed);
  const goalEvents = new Map(
    input.goalsByPlayer.map((p) => [p.playerId, p.goalCompetitions]),
  );
  const assistEvents = new Map(
    input.assistsByPlayer.map((p) => [p.playerId, p.events]),
  );
  const potmEvents = new Map(
    input.potmByPlayer.map((p) => [p.playerId, p.events]),
  );

  const clubName = input.club?.name ?? "";
  const clubColour =
    input.club?.colour && isValidClubColour(input.club.colour)
      ? input.club.colour
      : null;
  const teamName = teamDisplayName(input.team);

  return input.roster.flatMap((r): ReportPlayer[] => {
    const appearances = apps.get(r.id) ?? 0;
    if (!r.active && appearances === 0) return [];
    const firstName = r.first_name.trim() || "Player";
    return [
      {
        id: r.id,
        // The report never prints a surname: cards, charts and awards all
        // use the first name only.
        name: firstName,
        firstName,
        shirtNumber: r.shirt_number,
        position: r.position,
        appearances,
        goals: goals.get(r.id) ?? 0,
        assists: assists.get(r.id) ?? 0,
        playerOfTheMatch: potm.get(r.id) ?? 0,
        card: {
          playerId: r.id,
          teamId: input.team.id,
          clubName,
          clubColour,
          clubIconUrl: input.club?.icon_url ?? null,
          teamName,
          ageGroup: input.team.age_group,
          seasonLabel: input.team.season_label,
          firstName,
          lastName: null,
          shirtNumber: r.shirt_number,
          positionLabel: playerPositionLabel(r.position),
          stats: playerCardStats({
            record: input.competitiveRecords[r.id] ?? {
              wins: 0,
              draws: 0,
              losses: 0,
            },
            goalEvents: goalEvents.get(r.id),
            assistEvents: assistEvents.get(r.id),
            potmEvents: potmEvents.get(r.id),
          }),
        },
      },
    ];
  });
}

/**
 * The coaching staff with their cards, the head coach first and then the
 * others by name. The card shows the team's competitive record, as the shared
 * coach card does.
 */
export function buildReportCoaches(input: {
  team: {
    id: string;
    name: string;
    display_name: string | null;
    season_label: string;
    age_group: string;
  };
  club: { name: string; colour: string | null; icon_url: string | null } | null;
  coaches: readonly TeamCoachEntry[];
  resultsOverTime: readonly ResultOverTimePoint[];
}): ReportCoach[] {
  const clubName = input.club?.name ?? "";
  const clubColour =
    input.club?.colour && isValidClubColour(input.club.colour)
      ? input.club.colour
      : null;
  const teamName = teamDisplayName(input.team);
  const stats = coachCardStats(input.resultsOverTime);

  return input.coaches
    .map((c): ReportCoach => {
      const names = coachCardNames(c);
      return {
        id: c.coach_id,
        name: c.name.trim() || names.firstName,
        role: c.role,
        isHead: c.role === HEAD_COACH_ROLE,
        card: {
          coachId: c.coach_id,
          teamId: input.team.id,
          clubName,
          clubColour,
          clubIconUrl: input.club?.icon_url ?? null,
          teamName,
          ageGroup: input.team.age_group,
          seasonLabel: input.team.season_label,
          firstName: names.firstName,
          lastName: names.lastName,
          roleLabel: coachRoleLabel(c.role),
          stats,
        },
      };
    })
    .sort(
      (a, b) =>
        Number(b.isHead) - Number(a.isHead) || a.name.localeCompare(b.name),
    );
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

/**
 * Every venue with a played match, with the team's record there. The venue
 * names come from the club's venue list, so a deleted venue simply drops out.
 * Most visited first, then by name.
 */
export function buildReportVenues(
  matches: readonly MatchWithRelations[],
  venues: readonly Venue[],
  homeVenueId: string | null,
): ReportVenue[] {
  const byId = new Map(venues.map((v) => [v.id, v]));
  const played = matches.filter((m) => m.status === "played");

  const result: ReportVenue[] = [];
  for (const venue of venues) {
    const own = played.filter((m) => m.venue_id === venue.id);
    if (own.length === 0 || !byId.has(venue.id)) continue;

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let best: { margin: number; label: string } | null = null;
    for (const m of own) {
      const letter = resultLetter(m.goals_for, m.goals_against);
      if (letter === "W") wins += 1;
      else if (letter === "D") draws += 1;
      else if (letter === "L") losses += 1;
      goalsFor += m.goals_for;
      goalsAgainst += m.goals_against;
      const margin = m.goals_for - m.goals_against;
      if (margin > 0 && (!best || margin > best.margin)) {
        best = {
          margin,
          label: `${m.goals_for}–${m.goals_against} v ${m.opponent_name}`,
        };
      }
    }

    const surface = formatVenueSurface(
      venue.surface.filter((kind) => kind !== "unknown"),
    );
    result.push({
      id: venue.id,
      name: venue.name,
      address: formatVenueAddress(venue),
      surface,
      parking:
        venue.parking === "unknown"
          ? null
          : VENUE_PARKING_LABELS[venue.parking],
      foodAndDrink: formatVenueFoodAndDrink(venue.food_and_drink),
      isHome: venue.id === homeVenueId,
      played: own.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      biggestWin: best?.label ?? null,
    });
  }

  return result.sort(
    (a, b) => b.played - a.played || a.name.localeCompare(b.name),
  );
}

function venueName(venues: readonly Venue[], id: string | null): string | null {
  return id ? (venues.find((v) => v.id === id)?.name ?? null) : null;
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
      summary: formatTeamHeaderSummary({
        clubName: input.club?.name ?? "",
        gender: input.team.gender,
        ageGroup: input.team.age_group,
        seasonLabel: input.team.season_label,
      }),
      homeVenue: venueName(input.venues, input.team.home_venue_id),
      trainingVenue: venueName(input.venues, input.team.training_venue_id),
      trainingDays: formatTrainingDays(input.team.training_days),
    },
    staff: input.coaches.map((c) => ({ name: c.name, role: c.role })),
    headCoachName: headCoach?.name ?? null,
    coaches: buildReportCoaches(input),
    matches,
    competitions: buildReportCompetitions(input.competitions, matches),
    venues: buildReportVenues(
      input.matches,
      input.venues,
      input.team.home_venue_id,
    ),
    players: buildReportPlayers(input),
    monthAwards: input.monthAwards
      .map((a) => ({
        month: a.month,
        monthLabel: formatAwardMonth(a.month),
        playerName: a.player.first_name.trim() || "Player",
        notes: a.notes?.trim() || null,
      }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    content: input.content,
  };
}
