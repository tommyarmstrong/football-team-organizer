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

function eventsAreUnordered(events: StoryEvent[]): boolean {
  if (events.length <= 1) return false;
  const allMinutesNull = events.every((event) => event.minute == null);
  if (!allMinutesNull) return false;
  const firstTs = events[0]?.createdAt;
  return events.every((event) => event.createdAt === firstTs);
}

function sortEvents(events: StoryEvent[]): StoryEvent[] {
  const allHaveMinute = events.every((event) => event.minute != null);
  return [...events].sort((a, b) => {
    if (allHaveMinute) {
      const minuteDiff = (a.minute ?? 0) - (b.minute ?? 0);
      if (minuteDiff !== 0) return minuteDiff;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
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
  if (eventsAreUnordered(events)) return false;
  let score = { for: 0, against: 0 };
  let wasBehind = false;
  for (const event of sortEvents(events)) {
    score = applyEventScore(event, score);
    if (score.against > score.for) wasBehind = true;
  }
  return wasBehind;
}

function letALeadSlip(events: StoryEvent[]): boolean {
  if (eventsAreUnordered(events)) return false;
  let score = { for: 0, against: 0 };
  let wasAhead = false;
  for (const event of sortEvents(events)) {
    score = applyEventScore(event, score);
    if (score.for > score.against) wasAhead = true;
  }
  return wasAhead;
}

function lastOurGoalMinute(events: StoryEvent[]): number | null {
  const ours = events.filter(isOurNamedGoal);
  if (!ours.some((event) => event.minute != null)) return null;
  const sorted = sortEvents(ours);
  const last = sorted[sorted.length - 1];
  return last?.minute ?? null;
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
  const win = goalsFor > goalsAgainst;
  const draw = goalsFor === goalsAgainst;
  const loss = goalsFor < goalsAgainst;

  if (goalsFor === 0 && goalsAgainst === 0) {
    return "A tight stalemate.";
  }

  if (win && goalsAgainst === 0 && goalsFor >= 1) {
    return "Kept a clean sheet.";
  }

  if (win && cameFromBehind(events)) {
    return "Came from behind to win.";
  }

  const lateMinute = lastOurGoalMinute(events);
  if (win && lateMinute != null && lateMinute >= 80) {
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

  if (loss && letALeadSlip(events)) {
    return "Let it slip.";
  }

  return "On the wrong end of it.";
}
