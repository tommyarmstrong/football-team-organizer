import { describe, expect, it } from "vitest";
import { competitionRanks, takeThroughRank } from "@/lib/stats/ranking";

describe("ranking", () => {
  it("takes rows through a rank without splitting ties", () => {
    const rows = [5, 5, 3, 3, 3, 1].map((value) => ({ value }));
    expect(
      takeThroughRank(rows, (row) => row.value, 3).map((row) => row.value),
    ).toEqual([5, 5, 3, 3, 3]);
    expect(takeThroughRank(rows, (row) => row.value, 1)).toHaveLength(2);
    expect(
      takeThroughRank([], (row: { value: number }) => row.value, 3),
    ).toEqual([]);
  });

  it("uses standard competition ranking", () => {
    expect(competitionRanks([5, 5, 3, 3, 1])).toEqual([1, 1, 3, 3, 5]);
    expect(competitionRanks([])).toEqual([]);
  });
});
