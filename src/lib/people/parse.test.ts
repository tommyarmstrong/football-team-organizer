import { describe, expect, it } from "vitest";
import {
  parseOptionalPersonProfile,
  parsePersonForm,
  parsePersonPlayerForm,
  parsePersonRolesForm,
} from "@/lib/people/parse";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("parsePersonForm", () => {
  it("parses names, contact fields, and normalizes email", () => {
    expect(
      parsePersonForm(
        form({
          first_name: "Ada",
          last_name: "Lovelace",
          email: " Ada@Example.com ",
          phone: "07000 111222",
        }),
      ),
    ).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      phone: "07000 111222",
    });
  });

  it("accepts second_name as the last name", () => {
    expect(
      parsePersonForm(
        form({
          first_name: "Ada",
          second_name: "Lovelace",
        }),
      ),
    ).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: null,
      phone: null,
    });
  });

  it("requires first and last name", () => {
    expect(parsePersonForm(form({ first_name: "Ada" }))).toEqual({
      error: "First and last name are required.",
    });
  });

  it("rejects invalid email addresses", () => {
    expect(
      parsePersonForm(
        form({
          first_name: "Ada",
          last_name: "Lovelace",
          email: "not-an-email",
        }),
      ),
    ).toEqual({ error: "Enter a valid email address." });
  });
});

describe("parsePersonPlayerForm", () => {
  it("returns null when no player is selected", () => {
    expect(parsePersonPlayerForm(form({}))).toBeNull();
  });

  it("parses player profile fields", () => {
    expect(
      parsePersonPlayerForm(
        form({
          player_id: "player-1",
          date_of_birth: "2012-05-01",
          position: "MID",
          school: "Riverside Primary",
        }),
      ),
    ).toEqual({
      player_id: "player-1",
      date_of_birth: "2012-05-01",
      position: "MID",
      school: "Riverside Primary",
    });
  });

  it("rejects invalid positions and dates", () => {
    expect(
      parsePersonPlayerForm(
        form({
          player_id: "player-1",
          position: "WING",
        }),
      ),
    ).toEqual({ error: "Select a valid position." });

    expect(
      parsePersonPlayerForm(
        form({
          player_id: "player-1",
          date_of_birth: "01/05/2012",
        }),
      ),
    ).toEqual({ error: "Enter a valid date of birth." });
  });
});

describe("parsePersonRolesForm", () => {
  it("collects checked roles in display order", () => {
    const formData = new FormData();
    formData.set("role_player", "on");
    formData.set("role_coach", "on");

    expect(parsePersonRolesForm(formData)).toEqual(["player", "coach"]);
  });
});

describe("parseOptionalPersonProfile", () => {
  it("delegates to parsePersonForm", () => {
    expect(
      parseOptionalPersonProfile(
        form({
          first_name: "Ada",
          last_name: "Lovelace",
        }),
      ),
    ).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: null,
      phone: null,
    });
  });
});
