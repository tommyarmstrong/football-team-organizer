import { describe, expect, it } from "vitest";
import {
  LEADERBOARD_PREVIEW_LIMIT,
  leaderboardCanExpand,
  visibleLeaderRows,
} from "@/lib/stats/leaderboard-window";

const rows = ["a", "b", "c", "d", "e", "f", "g"];

describe("visibleLeaderRows", () => {
  it("shows the first five players until the list is expanded", () => {
    expect(LEADERBOARD_PREVIEW_LIMIT).toBe(5);
    expect(visibleLeaderRows(rows, false)).toEqual(["a", "b", "c", "d", "e"]);
    expect(visibleLeaderRows(rows, true)).toEqual(rows);
  });

  it("asks for a show-all control only when more than five players qualify", () => {
    expect(leaderboardCanExpand(5)).toBe(false);
    expect(leaderboardCanExpand(6)).toBe(true);
  });
});
