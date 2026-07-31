import { createHash, randomBytes } from "node:crypto";
import type { Person } from "@/lib/supabase/database.types";

export const PERSON_EMBED =
  "person:people!person_id(id, first_name, last_name, email, phone, auth_user_id, account_status, created_at, updated_at)";

export type PersonFields = {
  first_name: string;
  last_name: string;
  second_name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  person: Person;
};

export type PersonName = {
  first_name: string;
  last_name: string;
};

export function unwrapPerson(
  person: Person | Person[] | null | undefined,
): Person | null {
  if (!person) return null;
  return Array.isArray(person) ? (person[0] ?? null) : person;
}

export function unwrapPersonName(
  person: PersonName | PersonName[] | null | undefined,
): PersonName | null {
  if (!person) return null;
  return Array.isArray(person) ? (person[0] ?? null) : person;
}

/** Flatten an embedded people row onto a role record for UI compatibility. */
export function withPersonFields<
  T extends { person?: Person | Person[] | null },
>(row: T): T & PersonFields {
  const person = unwrapPerson(row.person);
  if (!person) {
    throw new Error("Role row is missing embedded person.");
  }
  return {
    ...row,
    first_name: person.first_name,
    last_name: person.last_name,
    second_name: person.last_name,
    email: person.email,
    phone: person.phone,
    user_id: person.auth_user_id,
    person,
  };
}

export function personDisplayName(person: {
  first_name: string;
  last_name: string;
}): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createInvitationToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function invitationExpiryDate(days = 7): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export type InvitationUsability =
  | { ok: true }
  | { ok: false; reason: "not_found" | "revoked" | "accepted" | "expired" };

export function evaluateInvitation(invite: {
  accepted_at: string | null;
  revoked_at: string | null;
  expires_at: string;
  now?: Date;
}): InvitationUsability {
  if (invite.revoked_at) return { ok: false, reason: "revoked" };
  if (invite.accepted_at) return { ok: false, reason: "accepted" };
  const now = invite.now ?? new Date();
  if (new Date(invite.expires_at).getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
