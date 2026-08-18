import { describe, expect, it } from "vitest";
import {
  boolFromCheckbox,
  goalAssistsAllowed,
  goalKindFromFlags,
  parseGoalKind,
  parseOptionalInt,
  parseOptionalMinute,
  parseShirtNumber,
  parseYesNo,
  str,
} from "@/lib/form-parse";

describe("str", () => {
  it("trims string values and coerces missing keys to empty string", () => {
    const formData = new FormData();
    formData.set("name", "  Ada  ");
    expect(str(formData, "name")).toBe("Ada");
    expect(str(formData, "missing")).toBe("");
  });
});

describe("boolFromCheckbox", () => {
  it("treats on/true as checked", () => {
    const formData = new FormData();
    formData.set("is_penalty", "on");
    formData.set("is_freekick", "true");
    expect(boolFromCheckbox(formData, "is_penalty")).toBe(true);
    expect(boolFromCheckbox(formData, "is_freekick")).toBe(true);
    expect(boolFromCheckbox(formData, "from_setpiece")).toBe(false);
  });
});

describe("parseGoalKind", () => {
  it("defaults to no kind flags", () => {
    expect(parseGoalKind(new FormData())).toEqual({
      is_penalty: false,
      is_freekick: false,
      from_setpiece: false,
    });
  });

  it("treats explicit none as no kind flags", () => {
    const formData = new FormData();
    formData.set("goal_kind", "none");
    expect(parseGoalKind(formData)).toEqual({
      is_penalty: false,
      is_freekick: false,
      from_setpiece: false,
    });
  });

  it("parses mutually exclusive kinds", () => {
    const freekick = new FormData();
    freekick.set("goal_kind", "freekick");
    expect(parseGoalKind(freekick)).toEqual({
      is_penalty: false,
      is_freekick: true,
      from_setpiece: false,
    });

    const penalty = new FormData();
    penalty.set("goal_kind", "penalty");
    expect(parseGoalKind(penalty)).toEqual({
      is_penalty: true,
      is_freekick: false,
      from_setpiece: false,
    });

    const setpiece = new FormData();
    setpiece.set("goal_kind", "setpiece");
    expect(parseGoalKind(setpiece)).toEqual({
      is_penalty: false,
      is_freekick: false,
      from_setpiece: true,
    });
  });

  it("rejects unknown kinds", () => {
    const formData = new FormData();
    formData.set("goal_kind", "header");
    expect(parseGoalKind(formData)).toEqual({ error: "Invalid goal type." });
  });
});

describe("goalKindFromFlags", () => {
  it("maps flags back to a single kind", () => {
    expect(
      goalKindFromFlags({
        is_penalty: true,
        is_freekick: false,
        from_setpiece: false,
      }),
    ).toBe("penalty");
    expect(
      goalKindFromFlags({
        is_penalty: false,
        is_freekick: true,
        from_setpiece: false,
      }),
    ).toBe("freekick");
    expect(
      goalKindFromFlags({
        is_penalty: false,
        is_freekick: false,
        from_setpiece: true,
      }),
    ).toBe("setpiece");
    expect(
      goalKindFromFlags({
        is_penalty: false,
        is_freekick: false,
        from_setpiece: false,
      }),
    ).toBe("none");
  });
});

describe("goalAssistsAllowed", () => {
  const teamScorer = { is_opposition: false, is_own_goal: false };

  it("allows assists for open play and set pieces", () => {
    expect(
      goalAssistsAllowed(teamScorer, { is_penalty: false, is_freekick: false }),
    ).toBe(true);
  });

  it("blocks assists for penalties, direct free kicks, own goals, and opposition", () => {
    expect(
      goalAssistsAllowed(teamScorer, { is_penalty: true, is_freekick: false }),
    ).toBe(false);
    expect(
      goalAssistsAllowed(teamScorer, { is_penalty: false, is_freekick: true }),
    ).toBe(false);
    expect(
      goalAssistsAllowed(
        { is_opposition: false, is_own_goal: true },
        { is_penalty: false, is_freekick: false },
      ),
    ).toBe(false);
    expect(
      goalAssistsAllowed(
        { is_opposition: true, is_own_goal: false },
        { is_penalty: false, is_freekick: false },
      ),
    ).toBe(false);
  });
});

describe("parseOptionalInt", () => {
  it("returns null for blank input", () => {
    expect(parseOptionalInt("", "Goals for")).toBeNull();
  });

  it("accepts zero and positive integers", () => {
    expect(parseOptionalInt("0", "Goals for")).toBe(0);
    expect(parseOptionalInt("4", "Goals against")).toBe(4);
  });

  it("rejects negatives, floats, and non-numeric input", () => {
    expect(parseOptionalInt("-1", "Goals for")).toEqual({
      error: "Goals for must be zero or a positive whole number.",
    });
    expect(parseOptionalInt("1.5", "Goals for")).toEqual({
      error: "Goals for must be zero or a positive whole number.",
    });
    expect(parseOptionalInt("abc", "Goals for")).toEqual({
      error: "Goals for must be zero or a positive whole number.",
    });
  });
});

describe("parseShirtNumber", () => {
  it("returns null for blank input", () => {
    expect(parseShirtNumber("")).toBeNull();
  });

  it("accepts positive integers", () => {
    expect(parseShirtNumber("10")).toBe(10);
  });

  it("rejects zero and invalid values", () => {
    expect(parseShirtNumber("0")).toEqual({
      error: "Shirt number must be a positive whole number.",
    });
    expect(parseShirtNumber("-3")).toEqual({
      error: "Shirt number must be a positive whole number.",
    });
  });
});

describe("parseOptionalMinute", () => {
  it("returns null for blank input", () => {
    expect(parseOptionalMinute("")).toBeNull();
  });

  it("accepts minutes from 0 to 120", () => {
    expect(parseOptionalMinute("0")).toBe(0);
    expect(parseOptionalMinute("45")).toBe(45);
    expect(parseOptionalMinute("120")).toBe(120);
  });

  it("rejects out-of-range and non-integer values", () => {
    expect(parseOptionalMinute("121")).toEqual({
      error: "Minute must be between 0 and 120.",
    });
    expect(parseOptionalMinute("-1")).toEqual({
      error: "Minute must be between 0 and 120.",
    });
    expect(parseOptionalMinute("12.5")).toEqual({
      error: "Minute must be between 0 and 120.",
    });
  });
});

describe("parseYesNo", () => {
  it("parses yes/true and no/false case-insensitively", () => {
    const yes = new FormData();
    yes.set("knockout", "Yes");
    expect(parseYesNo(yes, "knockout")).toBe(true);

    const trueValue = new FormData();
    trueValue.set("knockout", "TRUE");
    expect(parseYesNo(trueValue, "knockout")).toBe(true);

    const no = new FormData();
    no.set("knockout", "no");
    expect(parseYesNo(no, "knockout", true)).toBe(false);

    const falseValue = new FormData();
    falseValue.set("knockout", "false");
    expect(parseYesNo(falseValue, "knockout", true)).toBe(false);
  });

  it("falls back to the default for blank or unknown values", () => {
    expect(parseYesNo(new FormData(), "knockout")).toBe(false);
    expect(parseYesNo(new FormData(), "knockout", true)).toBe(true);

    const unknown = new FormData();
    unknown.set("knockout", "maybe");
    expect(parseYesNo(unknown, "knockout", false)).toBe(false);
  });
});
