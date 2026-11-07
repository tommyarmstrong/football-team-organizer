import { describe, expect, it } from "vitest";
import { buildLeaderRows, formatLeaderValue } from "@/lib/stats/leader-rows";

const row = (playerId: string, name: string, value: number) => ({
  playerId,
  name,
  value,
});

describe("buildLeaderRows", () => {
  it("orders by value, highest first, and ties by name", () => {
    const rows = buildLeaderRows([
      row("1", "Cal", 2),
      row("2", "Bea", 5),
      row("3", "Abe", 2),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["Bea", "Abe", "Cal"]);
  });

  it("leaves out players on zero", () => {
    const rows = buildLeaderRows([row("1", "Ada", 0), row("2", "Bea", 1)]);
    expect(rows.map((r) => r.playerId)).toEqual(["2"]);
    expect(buildLeaderRows([row("1", "Ada", 0)])).toEqual([]);
  });

  it("shows whole numbers for totals and two decimals for rates", () => {
    expect(buildLeaderRows([row("1", "Ada", 3)])[0]!.display).toBe("3");
    expect(buildLeaderRows([row("1", "Ada", 0.5)], true)[0]!.display).toBe(
      "0.50",
    );
    expect(formatLeaderValue(1 / 3, true)).toBe("0.33");
  });

  it("does not change the input", () => {
    const input = [row("1", "Cal", 1), row("2", "Bea", 2)];
    buildLeaderRows(input);
    expect(input.map((r) => r.name)).toEqual(["Cal", "Bea"]);
  });
});
