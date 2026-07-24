import { describe, expect, it } from "vitest";
import {
  boolFromCheckbox,
  parseOptionalInt,
  parseOptionalMinute,
  parseShirtNumber,
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
