import { describe, expect, it } from "vitest";
import {
  postcardStory,
  type StoryEvent,
  type StoryInput,
} from "@/lib/postcards/story";

function event(
  overrides: Partial<StoryEvent> & Pick<StoryEvent, "createdAt">,
): StoryEvent {
  return {
    isOpposition: false,
    isOwnGoal: false,
    playerId: "p1",
    firstName: "Maya",
    minute: null,
    ...overrides,
  };
}

function story(
  overrides: Partial<StoryInput> &
    Pick<StoryInput, "goalsFor" | "goalsAgainst">,
) {
  return postcardStory({
    isFriendly: false,
    events: [],
    ...overrides,
  });
}

describe("postcardStory", () => {
  it("uses a tight stalemate for 0-0, friendly or competitive", () => {
    expect(story({ goalsFor: 0, goalsAgainst: 0 })).toBe("A tight stalemate.");
    expect(story({ goalsFor: 0, goalsAgainst: 0, isFriendly: true })).toBe(
      "A tight stalemate.",
    );
  });

  it("uses a clean sheet for any win with no goals against", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 0,
        events: [
          event({ createdAt: "t1", minute: 10 }),
          event({
            createdAt: "t2",
            minute: 40,
            playerId: "p2",
            firstName: "Luca",
          }),
        ],
      }),
    ).toBe("Kept a clean sheet.");
  });

  it("detects a win after falling behind", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "a",
            minute: 8,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "b", minute: 20 }),
          event({
            createdAt: "c",
            minute: 55,
            playerId: "p2",
            firstName: "Luca",
          }),
        ],
      }),
    ).toBe("Came from behind to win.");
  });

  it("does not infer a comeback from goal entry order when minutes are missing", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "2026-01-01T10:00:00Z",
            minute: null,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "2026-01-01T10:01:00Z", minute: 20 }),
          event({
            createdAt: "2026-01-01T10:02:00Z",
            minute: null,
            playerId: "p2",
            firstName: "Luca",
          }),
        ],
      }),
    ).toBe("Took all three points.");
  });

  it("skips comeback detection when minutes and timestamps are tied", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "same",
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "same" }),
          event({ createdAt: "same", playerId: "p2", firstName: "Luca" }),
        ],
      }),
    ).toBe("Took all three points.");
  });

  it("skips chronology claims when two goals share a minute", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "a",
            minute: 10,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "b", minute: 10 }),
          event({ createdAt: "c", minute: 20, playerId: "p2" }),
        ],
      }),
    ).toBe("Took all three points.");
  });

  it("uses a late winner when the decisive goal is in minute 80 or later", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({ createdAt: "a", minute: 10 }),
          event({
            createdAt: "b",
            minute: 40,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "c",
            minute: 85,
            playerId: "p2",
            firstName: "Luca",
          }),
        ],
      }),
    ).toBe("A late winner.");
  });

  it("does not call a late final goal the winner when the match was already won", () => {
    expect(
      story({
        goalsFor: 4,
        goalsAgainst: 1,
        events: [
          event({ createdAt: "a", minute: 10, playerId: "a", firstName: "A" }),
          event({ createdAt: "b", minute: 30, playerId: "b", firstName: "B" }),
          event({
            createdAt: "c",
            minute: 50,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "d", minute: 60, playerId: "c", firstName: "C" }),
          event({ createdAt: "e", minute: 85, playerId: "d", firstName: "D" }),
        ],
      }),
    ).toBe("Ran out comfortable winners.");
  });

  it("does not guess a late winner without minutes", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({ createdAt: "a" }),
          event({
            createdAt: "b",
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "c", playerId: "p2", firstName: "Luca" }),
        ],
      }),
    ).toBe("Took all three points.");
  });

  it("prefers a comeback line over a late winner", () => {
    expect(
      story({
        goalsFor: 2,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "a",
            minute: 8,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "b", minute: 20 }),
          event({
            createdAt: "c",
            minute: 88,
            playerId: "p2",
            firstName: "Luca",
          }),
        ],
      }),
    ).toBe("Came from behind to win.");
  });

  it("uses hat-trick language for a player with three goals", () => {
    expect(
      story({
        goalsFor: 3,
        goalsAgainst: 1,
        events: [
          event({
            createdAt: "a",
            minute: 10,
            playerId: "maya",
            firstName: "Maya",
          }),
          event({
            createdAt: "b",
            minute: 20,
            playerId: "maya",
            firstName: "Maya",
          }),
          event({
            createdAt: "c",
            minute: 30,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "d",
            minute: 40,
            playerId: "maya",
            firstName: "Maya",
          }),
        ],
      }),
    ).toBe("Maya took the match.");
    expect(
      story({
        goalsFor: 3,
        goalsAgainst: 1,
        isFriendly: true,
        events: [
          event({
            createdAt: "a",
            minute: 10,
            playerId: "maya",
            firstName: "Maya",
          }),
          event({
            createdAt: "b",
            minute: 20,
            playerId: "maya",
            firstName: "Maya",
          }),
          event({
            createdAt: "c",
            minute: 30,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "d",
            minute: 40,
            playerId: "maya",
            firstName: "Maya",
          }),
        ],
      }),
    ).toBe("Maya had a day to remember.");
  });

  it("uses comfortable winners for a three-goal margin without a hat-trick", () => {
    expect(
      story({
        goalsFor: 4,
        goalsAgainst: 1,
        events: [
          event({ createdAt: "a", minute: 10, playerId: "a", firstName: "A" }),
          event({ createdAt: "b", minute: 20, playerId: "b", firstName: "B" }),
          event({
            createdAt: "c",
            minute: 30,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "d", minute: 40, playerId: "c", firstName: "C" }),
          event({ createdAt: "e", minute: 50, playerId: "d", firstName: "D" }),
        ],
      }),
    ).toBe("Ran out comfortable winners.");
  });

  it("uses a default win line for competitive and friendly matches", () => {
    const events = [
      event({ createdAt: "a", minute: 10 }),
      event({
        createdAt: "b",
        minute: 20,
        isOpposition: true,
        playerId: null,
        firstName: "",
      }),
      event({ createdAt: "c", minute: 30, playerId: "p2", firstName: "Luca" }),
    ];
    expect(story({ goalsFor: 2, goalsAgainst: 1, events })).toBe(
      "Took all three points.",
    );
    expect(
      story({ goalsFor: 2, goalsAgainst: 1, isFriendly: true, events }),
    ).toBe("A good win.");
  });

  it("uses high-scoring draw language from three goals each", () => {
    expect(story({ goalsFor: 3, goalsAgainst: 3 })).toBe(
      "Shared a high-scoring draw.",
    );
  });

  it("uses shared points for a lower-scoring draw", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 1 })).toBe("Shared the points.");
  });

  it("uses a narrow defeat for a one-goal loss", () => {
    expect(
      story({
        goalsFor: 1,
        goalsAgainst: 2,
        events: [
          event({
            createdAt: "a",
            minute: 10,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({ createdAt: "b", minute: 20 }),
          event({
            createdAt: "c",
            minute: 30,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
        ],
      }),
    ).toBe("Narrow defeat.");
  });

  it("uses let it slip when a lead is lost by more than one goal", () => {
    expect(
      story({
        goalsFor: 1,
        goalsAgainst: 3,
        events: [
          event({ createdAt: "a", minute: 10 }),
          event({
            createdAt: "b",
            minute: 20,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "c",
            minute: 40,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "d",
            minute: 70,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
        ],
      }),
    ).toBe("Let it slip.");
  });

  it("uses the generic loss line otherwise", () => {
    expect(
      story({
        goalsFor: 0,
        goalsAgainst: 3,
        events: [
          event({
            createdAt: "a",
            minute: 10,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "b",
            minute: 20,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
          event({
            createdAt: "c",
            minute: 30,
            isOpposition: true,
            playerId: null,
            firstName: "",
          }),
        ],
      }),
    ).toBe("On the wrong end of it.");
  });
});
