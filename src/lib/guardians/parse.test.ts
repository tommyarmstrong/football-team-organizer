import { describe, expect, it } from "vitest";
import {
  parseGuardianForm,
  parseGuardianRelationship,
  parseLegalGuardian,
} from "@/lib/guardians/parse";

function guardianFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("parseGuardianForm", () => {
  it("parses required names and optional contact fields", () => {
    expect(
      parseGuardianForm(
        guardianFormData({
          first_name: "Pat",
          second_name: "Guardian",
          phone: "07000 111222",
          email: "pat@example.com",
          notes: "Primary contact",
        }),
      ),
    ).toEqual({
      first_name: "Pat",
      second_name: "Guardian",
      phone: "07000 111222",
      email: "pat@example.com",
      notes: "Primary contact",
    });
  });

  it("trims values and maps blank optionals to null", () => {
    expect(
      parseGuardianForm(
        guardianFormData({
          first_name: "  Pat  ",
          second_name: "  Guardian  ",
          phone: " ",
          email: "",
          notes: "  ",
        }),
      ),
    ).toEqual({
      first_name: "Pat",
      second_name: "Guardian",
      phone: null,
      email: null,
      notes: null,
    });
  });

  it("requires first and second name", () => {
    expect(
      parseGuardianForm(
        guardianFormData({ first_name: "", second_name: "Guardian" }),
      ),
    ).toEqual({ error: "First and second name are required." });
    expect(
      parseGuardianForm(
        guardianFormData({ first_name: "Pat", second_name: "  " }),
      ),
    ).toEqual({ error: "First and second name are required." });
  });
});

describe("parseGuardianRelationship", () => {
  it("accepts known relationships", () => {
    expect(
      parseGuardianRelationship(guardianFormData({ relationship: "parent" })),
    ).toBe("parent");
    expect(
      parseGuardianRelationship(
        guardianFormData({ relationship: "football_contact" }),
      ),
    ).toBe("football_contact");
  });

  it("rejects missing or unknown relationships", () => {
    expect(parseGuardianRelationship(new FormData())).toEqual({
      error: "Select a relationship.",
    });
    expect(
      parseGuardianRelationship(guardianFormData({ relationship: "cousin" })),
    ).toEqual({ error: "Select a relationship." });
  });
});

describe("parseLegalGuardian", () => {
  it("reads the legal guardian checkbox", () => {
    const checked = guardianFormData({ legal_guardian: "on" });
    expect(parseLegalGuardian(checked)).toBe(true);
    expect(parseLegalGuardian(new FormData())).toBe(false);
  });
});
