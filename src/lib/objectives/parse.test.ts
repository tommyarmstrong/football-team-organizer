import { describe, expect, it } from "vitest";
import {
  parseCoachObjectiveForm,
  parsePlayerObjectiveForm,
} from "@/lib/objectives/parse";

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("parseCoachObjectiveForm", () => {
  const valid = {
    body: "Improve warm-up organisation",
    objective_type: "coaching",
    status: "in_progress",
  };

  it("parses a valid objective with optional target date", () => {
    expect(
      parseCoachObjectiveForm(
        formData({ ...valid, target_date: "2026-09-01" }),
      ),
    ).toEqual({
      body: "Improve warm-up organisation",
      objective_type: "coaching",
      target_date: "2026-09-01",
      status: "in_progress",
    });
  });

  it("maps blank target date to null", () => {
    expect(parseCoachObjectiveForm(formData(valid))).toEqual({
      body: "Improve warm-up organisation",
      objective_type: "coaching",
      target_date: null,
      status: "in_progress",
    });
  });

  it("requires objective text", () => {
    expect(parseCoachObjectiveForm(formData({ ...valid, body: "  " }))).toEqual(
      { error: "Objective text is required." },
    );
  });

  it("rejects invalid type and status", () => {
    expect(
      parseCoachObjectiveForm(
        formData({ ...valid, objective_type: "fitness" }),
      ),
    ).toEqual({ error: "Select a valid objective type." });
    expect(
      parseCoachObjectiveForm(formData({ ...valid, status: "done" })),
    ).toEqual({ error: "Select a valid status." });
  });

  it("rejects malformed target dates", () => {
    expect(
      parseCoachObjectiveForm(
        formData({ ...valid, target_date: "01/09/2026" }),
      ),
    ).toEqual({ error: "Target date must be a valid date." });
  });
});

describe("parsePlayerObjectiveForm", () => {
  const valid = {
    body: "Receive on the half-turn",
    objective_type: "skills",
    status: "emerging",
  };

  it("parses a valid player objective", () => {
    expect(parsePlayerObjectiveForm(formData(valid))).toEqual({
      body: "Receive on the half-turn",
      objective_type: "skills",
      status: "emerging",
    });
  });

  it("requires objective text", () => {
    expect(parsePlayerObjectiveForm(formData({ ...valid, body: "" }))).toEqual({
      error: "Objective text is required.",
    });
  });

  it("rejects invalid type and status", () => {
    expect(
      parsePlayerObjectiveForm(
        formData({ ...valid, objective_type: "leadership" }),
      ),
    ).toEqual({ error: "Select a valid objective type." });
    expect(
      parsePlayerObjectiveForm(formData({ ...valid, status: "pending" })),
    ).toEqual({ error: "Select a valid status." });
  });
});
