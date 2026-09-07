import { describe, expect, it } from "vitest";
import { playerOfTheMatchChipName } from "@/components/matches/match-players-of-the-match-section";

describe("playerOfTheMatchChipName", () => {
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
    expect(playerOfTheMatchChipName(players, "p2")).toBe("Sam Lee");
  });

  it("returns null when no player is selected", () => {
    expect(playerOfTheMatchChipName(players, null)).toBeNull();
    expect(playerOfTheMatchChipName(players, "missing")).toBeNull();
  });
});
