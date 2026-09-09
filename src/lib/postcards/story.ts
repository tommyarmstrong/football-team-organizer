import { isMatchPeriodName, matchPeriodSortOrder } from "@/lib/constants";

export type StoryEvent = {
  isOpposition: boolean;
  period: string | null;
};

export type StoryInput = {
  goalsFor: number;
  goalsAgainst: number;
  events: StoryEvent[];
};

/**
 * Score progression at the end of each recorded period. Events within the
 * same period are deliberately aggregated: their entry order and minute are
 * not reliable enough to support chronology claims.
 */
function periodScores(
  input: StoryInput,
): Array<{ for: number; against: number }> | null {
  const { events, goalsFor, goalsAgainst } = input;
  if (events.length !== goalsFor + goalsAgainst) return null;
  if (
    events.some((event) => !event.period || !isMatchPeriodName(event.period))
  ) {
    return null;
  }

  const regulationFamilies = new Set(
    events
      .map((event) => event.period)
      .filter(
        (period): period is string =>
          period?.startsWith("Quarter") === true ||
          period === "First half" ||
          period === "Second half" ||
          period === "Single period match",
      )
      .map((period) =>
        period.startsWith("Quarter")
          ? "quarters"
          : period.endsWith("half")
            ? "halves"
            : "single",
      ),
  );
  if (regulationFamilies.size > 1) return null;

  const periodGoals = new Map<
    string,
    { name: string; for: number; against: number }
  >();
  for (const event of events) {
    const name = event.period as string;
    const current = periodGoals.get(name) ?? { name, for: 0, against: 0 };
    if (event.isOpposition) current.against += 1;
    else current.for += 1;
    periodGoals.set(name, current);
  }

  const ordered = [...periodGoals.values()].sort(
    (a, b) => matchPeriodSortOrder(a.name) - matchPeriodSortOrder(b.name),
  );
  const progression: Array<{ for: number; against: number }> = [];
  let score = { for: 0, against: 0 };
  for (const period of ordered) {
    score = {
      for: score.for + period.for,
      against: score.against + period.against,
    };
    progression.push(score);
  }
  return progression;
}

export function postcardStory(input: StoryInput): string {
  const { goalsFor, goalsAgainst } = input;
  const progression = periodScores(input);
  const win = goalsFor > goalsAgainst;
  const draw = goalsFor === goalsAgainst;
  const loss = goalsFor < goalsAgainst;
  const margin = Math.abs(goalsFor - goalsAgainst);

  if (goalsFor === 0 && goalsAgainst === 0) {
    return "A tight stalemate.";
  }

  if (win && progression?.some((score) => score.against > score.for)) {
    return "Came from behind to win.";
  }

  if (win && margin === 1) {
    return "Edged a close contest.";
  }

  if (win && margin >= 3) {
    return "Ran out comfortable winners.";
  }

  if (win && goalsAgainst === 0) {
    return "Won without conceding.";
  }

  if (win) {
    return "Finished two goals clear.";
  }

  if (draw && goalsFor >= 3) {
    return "Shared a high-scoring draw.";
  }

  if (draw) {
    return "Nothing between the teams.";
  }

  if (loss && progression?.some((score) => score.for > score.against)) {
    return "Led earlier before the game turned.";
  }

  if (loss && margin === 1) {
    return "Edged out in a close contest.";
  }

  return "A tough result.";
}
