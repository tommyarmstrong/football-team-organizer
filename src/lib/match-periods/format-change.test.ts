import { describe, expect, it } from "vitest";
import {
  currentPeriodFormat,
  extraTimeStandInCount,
  formatChangeSuccessMessage,
  isPeriodFormat,
  oppositePeriodFormat,
  periodNamesForFormat,
  planFormatChange,
  planPreviewRows,
  type FormatChangePeriod,
  type FormatChangePlan,
} from "@/lib/match-periods/format-change";

const SORT: Record<string, number> = {
  "Quarter 1": 10,
  "Quarter 2": 20,
  "Quarter 3": 30,
  "Quarter 4": 40,
  "First half": 50,
  "Second half": 60,
  "Single period match": 70,
  "Extra time 1": 80,
  "Extra time 2": 90,
  "Penalty Shootout": 100,
};

function periods(...names: string[]): FormatChangePeriod[] {
  return names.map((name) => ({
    id: `id:${name}`,
    name,
    sort_order: SORT[name] ?? 999,
  }));
}

const QUARTERS = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
const HALVES = ["First half", "Second half"];

function planOf(
  rows: FormatChangePeriod[],
  target: "halves" | "quarters",
  options?: { useExtraTime?: boolean },
): FormatChangePlan {
  const result = planFormatChange(rows, target, options);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

describe("period format helpers", () => {
  it("names the regulation periods for each format", () => {
    expect(periodNamesForFormat("halves")).toEqual(HALVES);
    expect(periodNamesForFormat("quarters")).toEqual(QUARTERS);
  });

  it("validates format values and finds the opposite format", () => {
    expect(isPeriodFormat("halves")).toBe(true);
    expect(isPeriodFormat("quarters")).toBe(true);
    expect(isPeriodFormat("thirds")).toBe(false);
    expect(oppositePeriodFormat("halves")).toBe("quarters");
    expect(oppositePeriodFormat("quarters")).toBe("halves");
    expect(oppositePeriodFormat(null)).toBeNull();
  });

  it("formats the success message", () => {
    expect(formatChangeSuccessMessage("halves")).toBe("Changed to halves.");
    expect(formatChangeSuccessMessage("quarters")).toBe("Changed to quarters.");
  });
});

describe("currentPeriodFormat", () => {
  it("detects quarters and halves, including partial sets", () => {
    expect(currentPeriodFormat(periods(...QUARTERS))).toBe("quarters");
    expect(currentPeriodFormat(periods("Quarter 1", "Quarter 2"))).toBe(
      "quarters",
    );
    expect(currentPeriodFormat(periods(...HALVES))).toBe("halves");
    expect(currentPeriodFormat(periods("First half"))).toBe("halves");
  });

  it("ignores extra time and penalties", () => {
    expect(
      currentPeriodFormat(
        periods(...HALVES, "Extra time 1", "Extra time 2", "Penalty Shootout"),
      ),
    ).toBe("halves");
    expect(currentPeriodFormat(periods(...QUARTERS, "Extra time 1"))).toBe(
      "quarters",
    );
  });

  it("returns null for no regulation periods, single period, or a mix", () => {
    expect(currentPeriodFormat([])).toBeNull();
    expect(currentPeriodFormat(periods("Extra time 1"))).toBeNull();
    expect(currentPeriodFormat(periods("Single period match"))).toBeNull();
    expect(currentPeriodFormat(periods("Quarter 1", "Second half"))).toBeNull();
  });
});

describe("planFormatChange: quarters to halves", () => {
  it("renames Q1 and Q2 and merges Q3 and Q4 into the second half", () => {
    const plan = planOf(periods(...QUARTERS), "halves");

    expect(plan.target).toBe("halves");
    expect(plan.keep).toEqual([
      {
        periodId: "id:Quarter 1",
        fromName: "Quarter 1",
        toName: "First half",
        sortOrder: 50,
      },
      {
        periodId: "id:Quarter 2",
        fromName: "Quarter 2",
        toName: "Second half",
        sortOrder: 60,
      },
    ]);
    expect(plan.merge).toEqual([
      {
        periodId: "id:Quarter 3",
        fromName: "Quarter 3",
        intoPeriodId: "id:Quarter 2",
        intoName: "Second half",
      },
      {
        periodId: "id:Quarter 4",
        fromName: "Quarter 4",
        intoPeriodId: "id:Quarter 2",
        intoName: "Second half",
      },
    ]);
    expect(plan.create).toEqual([]);
    expect(plan.usesExtraTime).toBe(false);
  });

  it("converts a match recorded as just Q1 and Q2 into two halves", () => {
    const plan = planOf(periods("Quarter 1", "Quarter 2"), "halves");
    expect(plan.keep.map((k) => [k.fromName, k.toName])).toEqual([
      ["Quarter 1", "First half"],
      ["Quarter 2", "Second half"],
    ]);
    expect(plan.merge).toEqual([]);
    expect(plan.create).toEqual([]);
  });

  it("creates the second half when only Q1 exists", () => {
    const plan = planOf(periods("Quarter 1"), "halves");
    expect(plan.keep.map((k) => k.toName)).toEqual(["First half"]);
    expect(plan.create).toEqual([{ name: "Second half", sortOrder: 60 }]);
    expect(plan.copyStartersFrom).toBe("id:Quarter 1");
  });

  it("does not touch real extra time or a penalty shootout", () => {
    const plan = planOf(
      periods(...QUARTERS, "Extra time 1", "Extra time 2", "Penalty Shootout"),
      "halves",
    );
    const touched = [
      ...plan.keep.map((k) => k.periodId),
      ...plan.merge.map((m) => m.periodId),
    ];
    expect(touched).not.toContain("id:Extra time 1");
    expect(touched).not.toContain("id:Extra time 2");
    expect(touched).not.toContain("id:Penalty Shootout");
    expect(plan.usesExtraTime).toBe(false);
  });

  it("orders periods by match order, not input order", () => {
    const shuffled = periods(
      "Quarter 4",
      "Quarter 2",
      "Quarter 1",
      "Quarter 3",
    );
    const plan = planOf(shuffled, "halves");
    expect(plan.keep.map((k) => k.fromName)).toEqual([
      "Quarter 1",
      "Quarter 2",
    ]);
    expect(plan.merge.map((m) => m.fromName)).toEqual([
      "Quarter 3",
      "Quarter 4",
    ]);
  });
});

describe("planFormatChange: halves to quarters", () => {
  it("renames the halves and creates Q3 and Q4 with copied starters", () => {
    const plan = planOf(periods(...HALVES), "quarters");

    expect(plan.keep.map((k) => [k.fromName, k.toName])).toEqual([
      ["First half", "Quarter 1"],
      ["Second half", "Quarter 2"],
    ]);
    expect(plan.keep.map((k) => k.sortOrder)).toEqual([10, 20]);
    expect(plan.merge).toEqual([]);
    expect(plan.create).toEqual([
      { name: "Quarter 3", sortOrder: 30 },
      { name: "Quarter 4", sortOrder: 40 },
    ]);
    expect(plan.copyStartersFrom).toBe("id:Second half");
    expect(plan.usesExtraTime).toBe(false);
  });

  it("uses two extra periods as Q3 and Q4 by default", () => {
    const plan = planOf(
      periods(...HALVES, "Extra time 1", "Extra time 2"),
      "quarters",
    );

    expect(plan.keep.map((k) => [k.fromName, k.toName])).toEqual([
      ["First half", "Quarter 1"],
      ["Second half", "Quarter 2"],
      ["Extra time 1", "Quarter 3"],
      ["Extra time 2", "Quarter 4"],
    ]);
    expect(plan.create).toEqual([]);
    expect(plan.merge).toEqual([]);
    expect(plan.usesExtraTime).toBe(true);
  });

  it("uses a single extra period as Q3 and creates Q4", () => {
    const plan = planOf(periods(...HALVES, "Extra time 1"), "quarters");
    expect(plan.keep.map((k) => k.toName)).toEqual([
      "Quarter 1",
      "Quarter 2",
      "Quarter 3",
    ]);
    expect(plan.create).toEqual([{ name: "Quarter 4", sortOrder: 40 }]);
    expect(plan.copyStartersFrom).toBe("id:Extra time 1");
  });

  it("keeps extra time as extra time when told not to use it", () => {
    const plan = planOf(
      periods(...HALVES, "Extra time 1", "Extra time 2"),
      "quarters",
      { useExtraTime: false },
    );

    expect(plan.keep.map((k) => k.periodId)).toEqual([
      "id:First half",
      "id:Second half",
    ]);
    expect(plan.create.map((c) => c.name)).toEqual(["Quarter 3", "Quarter 4"]);
    expect(plan.usesExtraTime).toBe(false);
  });

  it("never turns a penalty shootout into a quarter", () => {
    const plan = planOf(periods(...HALVES, "Penalty Shootout"), "quarters");
    expect(plan.keep.map((k) => k.periodId)).not.toContain(
      "id:Penalty Shootout",
    );
    expect(plan.create.map((c) => c.name)).toEqual(["Quarter 3", "Quarter 4"]);
  });
});

describe("planFormatChange: errors", () => {
  it("rejects a match that is already in the target format", () => {
    const result = planFormatChange(periods(...QUARTERS), "quarters");
    expect(result).toEqual({
      ok: false,
      error: "This match is already in quarters.",
    });
  });

  it("rejects matches that are neither quarters nor halves", () => {
    expect(planFormatChange(periods("Single period match"), "halves")).toEqual({
      ok: false,
      error: "This match's periods are not quarters or halves.",
    });
    expect(planFormatChange([], "quarters").ok).toBe(false);
  });
});

describe("extraTimeStandInCount", () => {
  it("counts the extra periods that could fill missing regulation periods", () => {
    const withBoth = periods(...HALVES, "Extra time 1", "Extra time 2");
    expect(extraTimeStandInCount(withBoth, "quarters")).toBe(2);
    expect(
      extraTimeStandInCount(periods(...HALVES, "Extra time 1"), "quarters"),
    ).toBe(1);
  });

  it("is zero when nothing is missing or there is no extra time", () => {
    expect(extraTimeStandInCount(periods(...HALVES), "quarters")).toBe(0);
    expect(
      extraTimeStandInCount(
        periods(...QUARTERS, "Extra time 1", "Extra time 2"),
        "halves",
      ),
    ).toBe(0);
    expect(
      extraTimeStandInCount(
        periods(...HALVES, "Extra time 1", "Extra time 2"),
        "halves",
      ),
    ).toBe(0);
  });
});

describe("planPreviewRows", () => {
  it("describes renamed, merged and created periods", () => {
    const rows = periods(...QUARTERS);
    const plan = planOf(rows, "halves");
    const preview = planPreviewRows(plan, {
      "id:Quarter 1": { goals: 2, starters: 7 },
      "id:Quarter 2": { goals: 0, starters: 7 },
      "id:Quarter 3": { goals: 1, starters: 7 },
      "id:Quarter 4": { goals: 0, starters: 7 },
    });

    expect(preview).toEqual([
      {
        from: "Quarter 1",
        to: "First half",
        kind: "keep",
        note: "Renamed, 2 goals, 7 starters",
      },
      {
        from: "Quarter 2",
        to: "Second half",
        kind: "keep",
        note: "Renamed, 0 goals, 7 starters",
      },
      {
        from: "Quarter 3",
        to: "Second half",
        kind: "merge",
        note: "Removed. 1 goal moves into Second half",
      },
      {
        from: "Quarter 4",
        to: "Second half",
        kind: "merge",
        note: "Removed (no goals)",
      },
    ]);
  });

  it("lists created periods and treats missing counts as zero", () => {
    const plan = planOf(periods(...HALVES), "quarters");
    const preview = planPreviewRows(plan, {});

    expect(preview.map((r) => [r.from, r.to, r.kind])).toEqual([
      ["First half", "Quarter 1", "keep"],
      ["Second half", "Quarter 2", "keep"],
      [null, "Quarter 3", "create"],
      [null, "Quarter 4", "create"],
    ]);
    expect(preview[0]?.note).toBe("Renamed, 0 goals, 0 starters");
    expect(preview[2]?.note).toBe("Created, with the same starting players");
  });

  it("marks a period whose name does not change as unchanged", () => {
    const plan: FormatChangePlan = {
      target: "halves",
      keep: [
        {
          periodId: "a",
          fromName: "First half",
          toName: "First half",
          sortOrder: 50,
        },
      ],
      merge: [],
      create: [{ name: "Second half", sortOrder: 60 }],
      copyStartersFrom: null,
      usesExtraTime: false,
    };
    const preview = planPreviewRows(plan, { a: { goals: 1, starters: 1 } });
    expect(preview[0]?.note).toBe("Unchanged, 1 goal, 1 starter");
    expect(preview[1]?.note).toBe("Created");
  });
});
