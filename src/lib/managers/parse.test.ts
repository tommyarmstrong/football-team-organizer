import { describe, expect, it } from "vitest";
import { parseManagerForm } from "@/lib/managers/parse";

function managerFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("parseManagerForm", () => {
  it("parses required names and optional contact fields", () => {
    expect(
      parseManagerForm(
        managerFormData({
          first_name: "Sam",
          second_name: "Manager",
          phone: "07111 222333",
          email: "sam@example.com",
          notes: "Club secretary",
        }),
      ),
    ).toEqual({
      first_name: "Sam",
      second_name: "Manager",
      phone: "07111 222333",
      email: "sam@example.com",
      notes: "Club secretary",
    });
  });

  it("trims values and maps blank optionals to null", () => {
    expect(
      parseManagerForm(
        managerFormData({
          first_name: "  Sam  ",
          second_name: "  Manager  ",
          phone: "  ",
          email: "",
          notes: "   ",
        }),
      ),
    ).toEqual({
      first_name: "Sam",
      second_name: "Manager",
      phone: null,
      email: null,
      notes: null,
    });
  });

  it("requires first and second name", () => {
    expect(
      parseManagerForm(
        managerFormData({ first_name: "", second_name: "Manager" }),
      ),
    ).toEqual({ error: "First and second name are required." });
    expect(
      parseManagerForm(managerFormData({ first_name: "Sam", second_name: "" })),
    ).toEqual({ error: "First and second name are required." });
  });
});
