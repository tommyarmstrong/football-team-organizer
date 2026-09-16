import { describe, expect, it } from "vitest";
import { playerOfTheMatchName } from "@/components/matches/match-players-of-the-match-section";

describe("playerOfTheMatchName", () => {
  const players = [
    {
      id: "p1",
      first_name: "Alex",
      last_name: "Smith",
    },
    {
      id: "p2",
      first_name: "Sam",
      last_name: "Lee",
    },
  ];

  it("returns the player name without a shirt number", () => {
    expect(playerOfTheMatchName(players, "p2")).toBe("Sam Lee");
  });

  it("returns null when no player is selected", () => {
    expect(playerOfTheMatchName(players, null)).toBeNull();
    expect(playerOfTheMatchName(players, "missing")).toBeNull();
  });
});
