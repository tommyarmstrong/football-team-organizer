import { describe, expect, it } from "vitest";
import { postcardStory, type StoryInput } from "@/lib/postcards/story";

function story(input: StoryInput) {
  return postcardStory(input);
}

describe("postcardStory", () => {
  it("uses a tough watch for 0-0", () => {
    expect(story({ goalsFor: 0, goalsAgainst: 0 })).toBe("Tough watch today");
  });

  it("uses a huge win for a three-goal margin", () => {
    expect(story({ goalsFor: 3, goalsAgainst: 0 })).toBe("Huge win today!");
    expect(story({ goalsFor: 4, goalsAgainst: 1 })).toBe("Huge win today!");
  });

  it("uses a great win for any other win", () => {
    expect(story({ goalsFor: 2, goalsAgainst: 1 })).toBe("Great win!");
    expect(story({ goalsFor: 1, goalsAgainst: 0 })).toBe("Great win!");
  });

  it("uses great game for a high-scoring draw", () => {
    expect(story({ goalsFor: 3, goalsAgainst: 3 })).toBe("Great game!");
  });

  it("uses shared points for a lower-scoring draw", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 1 })).toBe("Shared the points.");
  });

  it("uses a frustrating loss for a one- or two-goal defeat", () => {
    expect(story({ goalsFor: 1, goalsAgainst: 2 })).toBe("Frustrating loss.");
    expect(story({ goalsFor: 1, goalsAgainst: 3 })).toBe("Frustrating loss.");
  });

  it("uses the Spurs line for a loss by three or more", () => {
    expect(story({ goalsFor: 0, goalsAgainst: 3 })).toBe("Lads, we were Spurs");
    expect(story({ goalsFor: 0, goalsAgainst: 4 })).toBe("Lads, we were Spurs");
    expect(story({ goalsFor: 1, goalsAgainst: 5 })).toBe("Lads, we were Spurs");
  });
});
