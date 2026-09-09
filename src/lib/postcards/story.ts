export type StoryEvent = {
  isOpposition: boolean;
  isOwnGoal: boolean;
  playerId: string | null;
  firstName: string;
  minute: number | null;
  createdAt: string;
};

export type StoryInput = {
  goalsFor: number;
  goalsAgainst: number;
  isFriendly: boolean;
  events: StoryEvent[];
};

function isOurNamedGoal(event: StoryEvent): boolean {
  return !event.isOpposition && !event.isOwnGoal && Boolean(event.playerId);
}

function sortEvents(events: StoryEvent[]): StoryEvent[] {
  return [...events].sort((a, b) => {
    const minuteDiff = (a.minute ?? 0) - (b.minute ?? 0);
    if (minuteDiff !== 0) return minuteDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Chronology-based claims are only safe when every score event has a unique
 * minute. `created_at` is when a coach entered a goal, not when it happened,
 * so it must never be used to reconstruct a partially timed match.
 */
function reliableTimeline(input: StoryInput): StoryEvent[] | null {
  const { events, goalsFor, goalsAgainst } = input;
  if (events.length !== goalsFor + goalsAgainst) return null;
  if (events.some((event) => event.minute == null)) return null;
  const minutes = events.map((event) => event.minute as number);
  if (new Set(minutes).size !== minutes.length) return null;
  return sortEvents(events);
}

function applyEventScore(
  event: StoryEvent,
  score: { for: number; against: number },
): { for: number; against: number } {
  if (event.isOpposition) {
    return { for: score.for, against: score.against + 1 };
  }
  return { for: score.for + 1, against: score.against };
}

function cameFromBehind(events: StoryEvent[]): boolean {
  let score = { for: 0, against: 0 };
  let wasBehind = false;
  for (const event of events) {
    score = applyEventScore(event, score);
    if (score.against > score.for) wasBehind = true;
  }
  return wasBehind;
}

function letALeadSlip(events: StoryEvent[]): boolean {
  let score = { for: 0, against: 0 };
  let wasAhead = false;
  for (const event of events) {
    score = applyEventScore(event, score);
    if (score.for > score.against) wasAhead = true;
  }
  return wasAhead;
}

function winningGoalMinute(
  events: StoryEvent[],
  goalsAgainst: number,
): number | null {
  let ourGoals = 0;
  for (const event of events) {
    if (event.isOpposition) continue;
    ourGoals += 1;
    if (ourGoals === goalsAgainst + 1) return event.minute;
  }
  return null;
}

function hatTrickFirstName(events: StoryEvent[]): string | null {
  const counts = new Map<string, { count: number; firstName: string }>();
  for (const event of events) {
    if (!isOurNamedGoal(event) || !event.playerId) continue;
    const current = counts.get(event.playerId);
    if (current) {
      current.count += 1;
    } else {
      counts.set(event.playerId, {
        count: 1,
        firstName: event.firstName.trim() || "They",
      });
    }
  }
  let best: { count: number; firstName: string } | null = null;
  for (const entry of counts.values()) {
    if (entry.count < 3) continue;
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.firstName ?? null;
}

export function postcardStory(input: StoryInput): string {
  const { goalsFor, goalsAgainst, isFriendly, events } = input;
  const timeline = reliableTimeline(input);
  const win = goalsFor > goalsAgainst;
  const draw = goalsFor === goalsAgainst;
  const loss = goalsFor < goalsAgainst;

  if (goalsFor === 0 && goalsAgainst === 0) {
    return "A tight stalemate.";
  }

  if (win && goalsAgainst === 0 && goalsFor >= 1) {
    return "Kept a clean sheet.";
  }

  if (win && timeline && cameFromBehind(timeline)) {
    return "Came from behind to win.";
  }

  const decisiveMinute = timeline
    ? winningGoalMinute(timeline, goalsAgainst)
    : null;
  if (win && decisiveMinute != null && decisiveMinute >= 80) {
    return "A late winner.";
  }

  const hatTrickName = hatTrickFirstName(events);
  if (win && hatTrickName) {
    return isFriendly
      ? `${hatTrickName} had a day to remember.`
      : `${hatTrickName} took the match.`;
  }

  if (win && goalsFor - goalsAgainst >= 3) {
    return "Ran out comfortable winners.";
  }

  if (win) {
    return isFriendly ? "A good win." : "Took all three points.";
  }

  if (draw && goalsFor >= 3) {
    return "Shared a high-scoring draw.";
  }

  if (draw) {
    return "Shared the points.";
  }

  if (loss && goalsAgainst - goalsFor === 1) {
    return "Narrow defeat.";
  }

  if (loss && timeline && letALeadSlip(timeline)) {
    return "Let it slip.";
  }

  return "On the wrong end of it.";
}
