import { describe, expect, it } from "vitest";
import {
  createInvitationToken,
  evaluateInvitation,
  hashInvitationToken,
  normalizeEmail,
  personDisplayName,
} from "@/lib/people/person";
import { parsePersonForm } from "@/lib/people/parse";

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
      }).ok,
    ).toBe(false);

    expect(
      evaluateInvitation({
        accepted_at: past,
        revoked_at: null,
        expires_at: future,
      }).ok,
    ).toBe(false);

    expect(
      evaluateInvitation({
        accepted_at: null,
        revoked_at: null,
        expires_at: past,
      }),
    ).toEqual({ ok: false, reason: "expired" });
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
});
