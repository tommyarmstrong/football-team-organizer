import type { ReportMatch, ReportPlayer } from "@/lib/report/types";

export type Tally = { wins: number; draws: number; losses: number };

export function tally(matches: readonly ReportMatch[]): Tally {
  const t: Tally = { wins: 0, draws: 0, losses: 0 };
  for (const m of matches) {
    if (m.result === "W") t.wins += 1;
    else if (m.result === "D") t.draws += 1;
    else t.losses += 1;
  }
  return t;
}

export function goalTotals(matches: readonly ReportMatch[]): {
  goalsFor: number;
  goalsAgainst: number;
} {
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const m of matches) {
    goalsFor += m.goalsFor;
    goalsAgainst += m.goalsAgainst;
  }
  return { goalsFor, goalsAgainst };
}

/** Three points for a win, one for a draw. */
export function pointsFor(result: ReportMatch["result"]): number {
  return result === "W" ? 3 : result === "D" ? 1 : 0;
}

/** Running points after each match (index 0 = after the first match). */
export function cumulativePoints(matches: readonly ReportMatch[]): number[] {
  let total = 0;
  return matches.map((m) => (total += pointsFor(m.result)));
}

export function cleanSheets(matches: readonly ReportMatch[]): number {
  return matches.filter((m) => m.goalsAgainst === 0).length;
}

/** Longest run of matches without a defeat. */
export function longestUnbeaten(matches: readonly ReportMatch[]): number {
  let best = 0;
  let current = 0;
  for (const m of matches) {
    current = m.result === "L" ? 0 : current + 1;
    best = Math.max(best, current);
  }
  return best;
}

/** Largest winning margin; null when the team never won. */
export function biggestWin(
  matches: readonly ReportMatch[],
): ReportMatch | null {
  let best: ReportMatch | null = null;
  for (const m of matches) {
    if (m.result !== "W") continue;
    const margin = m.goalsFor - m.goalsAgainst;
    if (
      !best ||
      margin > best.goalsFor - best.goalsAgainst ||
      (margin === best.goalsFor - best.goalsAgainst &&
        m.goalsFor > best.goalsFor)
    ) {
      best = m;
    }
  }
  return best;
}

/** Share of matches won, 0–100, rounded. 0 when nothing was played. */
export function winPercentage(t: Tally): number {
  const played = t.wins + t.draws + t.losses;
  return played === 0 ? 0 : Math.round((t.wins / played) * 100);
}

/** Goals per match to one decimal place, as text. */
export function perMatch(total: number, played: number): string {
  return played === 0 ? "0.0" : (total / played).toFixed(1);
}

export type Leader = { name: string; value: number; playerId: string };

/**
 * Top players by `metric`, highest first. Players on zero are never listed
 * and ties are not split by the cut-off: everyone level with the last place
 * stays in. Ties keep their name order.
 */
export function leaders(
  players: readonly ReportPlayer[],
  metric: (player: ReportPlayer) => number,
  limit: number,
): Leader[] {
  const ranked = players
    .map((p) => ({ name: p.name, value: metric(p), playerId: p.id }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  if (ranked.length <= limit) return ranked;
  const cutoff = ranked[limit - 1]!.value;
  return ranked.filter((p) => p.value >= cutoff);
}

/** Squad order: shirt number ascending (unnumbered last), then name. */
export function sortSquad(players: readonly ReportPlayer[]): ReportPlayer[] {
  return [...players].sort((a, b) => {
    const an = a.shirtNumber ?? Number.POSITIVE_INFINITY;
    const bn = b.shirtNumber ?? Number.POSITIVE_INFINITY;
    return an - bn || a.name.localeCompare(b.name);
  });
}

/** Joint winners: show two names, then "+N more" so an award card stays tidy. */
export function honourNames(names: readonly string[]): string {
  if (names.length === 0) return "—";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

/**
 * The score as printed on the Results page: the home side first. Away games
 * flip our score; neutral games keep ours first.
 */
export function displayScore(
  match: Pick<ReportMatch, "homeAway" | "goalsFor" | "goalsAgainst">,
): { first: number; second: number } {
  return match.homeAway === "away"
    ? { first: match.goalsAgainst, second: match.goalsFor }
    : { first: match.goalsFor, second: match.goalsAgainst };
}
