import { describe, expect, it } from "vitest";
import { parseCoachForm } from "@/lib/coaches/parse";

function coachFormData(
  fields: Record<string, string>,
  checkboxes: string[] = [],
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  for (const key of checkboxes) {
    formData.set(key, "on");
  }
  return formData;
}

const validFields = {
  first_name: "Alex",
  second_name: "Coach",
  joined_date: "2024-09-01",
};

describe("parseCoachForm", () => {
  it("parses required fields and defaults unchecked qualifications to false", () => {
    expect(parseCoachForm(coachFormData(validFields))).toEqual({
      first_name: "Alex",
      second_name: "Coach",
      joined_date: "2024-09-01",
      phone: null,
      email: null,
      notes: null,
      biography: null,
      dbs_checked: false,
      fa_level_1: false,
      fa_level_2: false,
    });
  });

  it("trims values and maps blank optional fields to null", () => {
    expect(
      parseCoachForm(
        coachFormData({
          first_name: "  Alex  ",
          second_name: "  Coach  ",
          joined_date: "2024-09-01",
          phone: "  ",
          email: "  ",
          notes: "  ",
          biography: "  ",
        }),
      ),
    ).toEqual({
      first_name: "Alex",
      second_name: "Coach",
      joined_date: "2024-09-01",
      phone: null,
      email: null,
      notes: null,
      biography: null,
      dbs_checked: false,
      fa_level_1: false,
      fa_level_2: false,
    });
  });

  it("includes biography, contact fields, and checked qualifications", () => {
    expect(
      parseCoachForm(
        coachFormData(
          {
            ...validFields,
            phone: "07123 456789",
            email: "alex@example.com",
            notes: "Available weekends",
            biography: "Former academy coach with 10 years experience.",
          },
          ["dbs_checked", "fa_level_1", "fa_level_2"],
        ),
      ),
    ).toEqual({
      first_name: "Alex",
      second_name: "Coach",
      joined_date: "2024-09-01",
      phone: "07123 456789",
      email: "alex@example.com",
      notes: "Available weekends",
      biography: "Former academy coach with 10 years experience.",
      dbs_checked: true,
      fa_level_1: true,
      fa_level_2: true,
    });
  });

  it("requires first and second name", () => {
    expect(
      parseCoachForm(
        coachFormData({
          first_name: "",
          second_name: "Coach",
          joined_date: "2024-09-01",
        }),
      ),
    ).toEqual({ error: "First and second name are required." });

    expect(
      parseCoachForm(
        coachFormData({
          first_name: "Alex",
          second_name: "",
          joined_date: "2024-09-01",
        }),
      ),
    ).toEqual({ error: "First and second name are required." });
  });

  it("requires joined date", () => {
    expect(
      parseCoachForm(
        coachFormData({
          first_name: "Alex",
          second_name: "Coach",
          joined_date: "",
        }),
      ),
    ).toEqual({ error: "Joined date is required." });
  });
});
