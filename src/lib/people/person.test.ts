import { describe, expect, it } from "vitest";
import {
  createInvitationToken,
  evaluateInvitation,
  hashInvitationToken,
  invitationExpiryDate,
  normalizeEmail,
  personDisplayName,
  unwrapPerson,
  unwrapPersonName,
  withPersonFields,
} from "@/lib/people/person";
import {
  parseOptionalPersonProfile,
  parsePersonForm,
  parsePersonPlayerForm,
} from "@/lib/people/parse";
import type { Person } from "@/lib/supabase/database.types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "person-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    phone: "07123",
    auth_user_id: "auth-1",
    account_status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("person helpers", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("formats display name", () => {
    expect(
      personDisplayName({ first_name: "Ada", last_name: "Lovelace" }),
    ).toBe("Ada Lovelace");
  });

  it("hashes invitation tokens stably", () => {
    const { token, tokenHash } = createInvitationToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashInvitationToken(token)).toBe(tokenHash);
    expect(hashInvitationToken(token + "x")).not.toBe(tokenHash);
  });

  it("builds invitation expiry relative to now", () => {
    const before = Date.now();
    const expiry = invitationExpiryDate(3);
    const after = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + threeDaysMs);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + threeDaysMs);
  });

  it("evaluates invitation usability", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();

    expect(
      evaluateInvitation({
        accepted_at: null,
        revoked_at: null,
        expires_at: future,
      }),
    ).toEqual({ ok: true });

    expect(
      evaluateInvitation({
        accepted_at: null,
        revoked_at: past,
        expires_at: future,
      }),
    ).toEqual({ ok: false, reason: "revoked" });

    expect(
      evaluateInvitation({
        accepted_at: past,
        revoked_at: null,
        expires_at: future,
      }),
    ).toEqual({ ok: false, reason: "accepted" });

    expect(
      evaluateInvitation({
        accepted_at: null,
        revoked_at: null,
        expires_at: past,
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });
});

describe("unwrapPerson / unwrapPersonName", () => {
  it("returns null for missing embeds", () => {
    expect(unwrapPerson(null)).toBeNull();
    expect(unwrapPerson(undefined)).toBeNull();
    expect(unwrapPerson([])).toBeNull();
    expect(unwrapPersonName(null)).toBeNull();
    expect(unwrapPersonName(undefined)).toBeNull();
    expect(unwrapPersonName([])).toBeNull();
  });

  it("unwraps a single object or the first array element", () => {
    const ada = person();
    expect(unwrapPerson(ada)).toBe(ada);
    expect(unwrapPerson([ada])).toBe(ada);
    expect(
      unwrapPersonName({ first_name: "Ada", last_name: "Lovelace" }),
    ).toEqual({ first_name: "Ada", last_name: "Lovelace" });
    expect(
      unwrapPersonName([{ first_name: "Ada", last_name: "Lovelace" }]),
    ).toEqual({ first_name: "Ada", last_name: "Lovelace" });
  });
});

describe("withPersonFields", () => {
  it("flattens an embedded person onto a role row", () => {
    const ada = person();
    expect(withPersonFields({ id: "coach-1", person: ada })).toMatchObject({
      id: "coach-1",
      first_name: "Ada",
      last_name: "Lovelace",
      second_name: "Lovelace",
      email: "ada@example.com",
      phone: "07123",
      user_id: "auth-1",
      person: ada,
    });
  });

  it("throws when the person embed is missing", () => {
    expect(() => withPersonFields({ id: "coach-1", person: null })).toThrow(
      "Role row is missing embedded person.",
    );
  });
});

describe("parsePersonForm", () => {
  it("requires names and validates email", () => {
    const fd = new FormData();
    fd.set("first_name", "Ada");
    expect(parsePersonForm(fd)).toEqual({
      error: "First and last name are required.",
    });

    fd.set("last_name", "Lovelace");
    fd.set("email", "not-an-email");
    expect(parsePersonForm(fd)).toEqual({
      error: "Enter a valid email address.",
    });

    fd.set("email", "Ada@Example.com");
    fd.set("phone", "07123");
    expect(parsePersonForm(fd)).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      phone: "07123",
    });
  });

  it("accepts second_name as last name alias", () => {
    const fd = new FormData();
    fd.set("first_name", "Ada");
    fd.set("second_name", "Lovelace");
    expect(parsePersonForm(fd)).toMatchObject({
      first_name: "Ada",
      last_name: "Lovelace",
    });
  });

  it("parseOptionalPersonProfile delegates to parsePersonForm", () => {
    const fd = new FormData();
    fd.set("first_name", "Ada");
    fd.set("last_name", "Lovelace");
    expect(parseOptionalPersonProfile(fd)).toEqual(parsePersonForm(fd));
  });
});

describe("parsePersonPlayerForm", () => {
  it("returns null when player_id is absent", () => {
    expect(parsePersonPlayerForm(new FormData())).toBeNull();
  });

  it("parses optional player fields", () => {
    const fd = new FormData();
    fd.set("player_id", "player-1");
    fd.set("date_of_birth", "2015-03-15");
    fd.set("position", "MID");
    fd.set("school", "St Mary's");
    expect(parsePersonPlayerForm(fd)).toEqual({
      player_id: "player-1",
      date_of_birth: "2015-03-15",
      position: "MID",
      school: "St Mary's",
    });
  });

  it("rejects invalid position and date of birth", () => {
    const badPosition = new FormData();
    badPosition.set("player_id", "player-1");
    badPosition.set("position", "striker");
    expect(parsePersonPlayerForm(badPosition)).toEqual({
      error: "Select a valid position.",
    });

    const badDob = new FormData();
    badDob.set("player_id", "player-1");
    badDob.set("date_of_birth", "15/03/2015");
    expect(parsePersonPlayerForm(badDob)).toEqual({
      error: "Enter a valid date of birth.",
    });
  });
});
