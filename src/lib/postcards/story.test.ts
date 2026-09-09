import { describe, expect, it } from "vitest";
import {
  postcardStory,
  type StoryEvent,
  type StoryInput,
} from "@/lib/postcards/story";

function ourGoal(period: string | null): StoryEvent {
  return { isOpposition: false, period };
}

function theirGoal(period: string | null): StoryEvent {
  return { isOpposition: true, period };
}

function story(
  overrides: Pick<StoryInput, "goalsFor" | "goalsAgainst"> &
    Partial<StoryInput>,
) {
  return postcardStory({
    events: [],
    ...overrides,
  });
}

describe("postcardStory", () => {
  it("describes a goalless draw as a tight stalemate", () => {
    expect(story({ goalsFor: 0, goalsAgainst: 0 })).toBe("A tight stalemate.");
  });

  it("detects a comeback from scores at the end of each quarter", () => {
    expect(
      story({
        goalsFor: 3,
        goalsAgainst: 2,
        events: [
          theirGoal("Quarter 1"),
          theirGoal("Quarter 1"),
          ourGoal("Quarter 2"),
          ourGoal("Quarter 3"),
          ourGoal("Quarter 4"),
        ],
      }),
    ).toBe("Came from behind to win.");
  });

  it("detects a comeback across halves", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          theirGoal("First half"),
          ourGoal("Second half"),
          ourGoal("Second half"),
        ],
      }),
    ).toBe("Came from behind to win.");
  });

  it("does not infer event order within a quarter", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          theirGoal("Quarter 1"),
          ourGoal("Quarter 1"),
          ourGoal("Quarter 2"),
        ],
      }),
    ).toBe("Edged a close contest.");
  });

  it("uses final-score closeness when periods are missing", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [theirGoal(null), ourGoal(null), ourGoal(null)],
      }),
    ).toBe("Edged a close contest.");
  });

  it("uses final-score closeness when period data is incomplete", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [theirGoal("Quarter 1"), ourGoal("Quarter 2"), ourGoal(null)],
      }),
    ).toBe("Edged a close contest.");
  });

  it("does not use mixed quarter and half structures", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          theirGoal("First half"),
          ourGoal("Quarter 2"),
          ourGoal("Quarter 3"),
        ],
      }),
    ).toBe("Edged a close contest.");
  });

  it("uses the final margin for wins without a period progression claim", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 0 })).toBe(
      "Edged a close contest.",
    );
    expect(story({ goalsFor: 2, goalsAgainst: 0 })).toBe(
      "Won without conceding.",
    );
    expect(story({ goalsFor: 3, goalsAgainst: 1 })).toBe(
      "Finished two goals clear.",
    );
    expect(story({ goalsFor: 4, goalsAgainst: 1 })).toBe(
      "Ran out comfortable winners.",
    );
  });

  it("uses draw scorelines without requiring periods", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 1 })).toBe(
      "Nothing between the teams.",
    );
    expect(story({ goalsFor: 3, goalsAgainst: 3 })).toBe(
      "Shared a high-scoring draw.",
    );
  });

  it("detects a lost lead from period-end scores", () => {
    expect(
      story({
        goalsFor: 1,
        goalsAgainst: 3,
        events: [
          ourGoal("Quarter 1"),
          theirGoal("Quarter 2"),
          theirGoal("Quarter 3"),
          theirGoal("Quarter 4"),
        ],
      }),
    ).toBe("Led earlier before the game turned.");
  });

  it("uses the final margin for losses without a period progression claim", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 2 })).toBe(
      "Edged out in a close contest.",
    );
    expect(story({ goalsFor: 1, goalsAgainst: 3 })).toBe("A tough result.");
  });
});
