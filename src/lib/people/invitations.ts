import {
  createInvitationToken,
  evaluateInvitation,
  hashInvitationToken,
  invitationExpiryDate,
  normalizeEmail,
} from "@/lib/people/person";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Person, PersonInvitation } from "@/lib/supabase/database.types";

export type SendInvitationResult =
  | {
      ok: true;
      invitationId: string;
      emailSent: boolean;
      /** Auth user already exists — Supabase will not send inviteUserByEmail. */
      alreadyRegistered?: boolean;
      /** Present when Supabase could not send the invite email. */
      emailError?: string;
      /** Manual accept URL — returned when email was not sent. */
      acceptUrl?: string;
    }
  | { ok: false; error: string };

function appOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

function isAlreadyRegisteredError(message: string) {
  return /already (been )?registered/i.test(message);
}

/** Find an Auth user id by email (paginated admin list). Club-scale OK. */
export async function findAuthUserIdByEmail(
  email: string,
): Promise<{ id: string | null; error: string | null }> {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return { id: null, error: error.message };

    const match = data.users.find(
      (user) => user.email && normalizeEmail(user.email) === normalized,
    );
    if (match) return { id: match.id, error: null };

    if (!data.nextPage || data.users.length === 0) {
      return { id: null, error: null };
    }
    page = data.nextPage;
  }
}

export async function sendPersonInvitation(input: {
  person: Person;
  invitedBy: string | null;
}): Promise<SendInvitationResult> {
  if (!input.person.email) {
    return { ok: false, error: "Person must have an email address to invite." };
  }
  if (input.person.auth_user_id) {
    return { ok: false, error: "This person already has a linked login." };
  }

  const admin = createAdminClient();
  const email = normalizeEmail(input.person.email);
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = invitationExpiryDate(7).toISOString();

  const { error: revokeError } = await admin
    .from("person_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("person_id", input.person.id)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (revokeError) return { ok: false, error: revokeError.message };

  const { data: invitation, error: insertError } = await admin
    .from("person_invitations")
    .insert({
      person_id: input.person.id,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      invited_by: input.invitedBy,
    })
    .select("*")
    .single();

  if (insertError || !invitation) {
    return {
      ok: false,
      error: insertError?.message ?? "Could not create invitation.",
    };
  }

  await admin
    .from("people")
    .update({ account_status: "invited" })
    .eq("id", input.person.id);

  const redirectTo = `${appOrigin()}/auth/callback?next=${encodeURIComponent(`/onboarding/complete?token=${token}`)}&invite_token=${encodeURIComponent(token)}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
      data: {
        person_id: input.person.id,
        invitation_id: invitation.id,
        first_name: input.person.first_name,
        last_name: input.person.last_name,
      },
    },
  );

  const acceptUrl = `${appOrigin()}/onboarding/accept?token=${encodeURIComponent(token)}`;

  if (inviteError) {
    // Invitation row still usable via our accept page with the raw token.
    // Keep the invite record and return the accept URL so admins can share it.
    const alreadyRegistered = isAlreadyRegisteredError(inviteError.message);
    return {
      ok: true,
      invitationId: invitation.id,
      emailSent: false,
      alreadyRegistered,
      emailError: alreadyRegistered ? undefined : inviteError.message,
      acceptUrl,
    };
  }

  return { ok: true, invitationId: invitation.id, emailSent: true };
}

export async function loadInvitationByToken(token: string): Promise<{
  invitation: PersonInvitation | null;
  person: Person | null;
  error: string | null;
}> {
  if (!token) {
    return {
      invitation: null,
      person: null,
      error: "Missing invitation token.",
    };
  }

  const admin = createAdminClient();
  const tokenHash = hashInvitationToken(token);
  const { data: invitation, error } = await admin
    .from("person_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) return { invitation: null, person: null, error: error.message };
  if (!invitation) {
    return { invitation: null, person: null, error: "Invitation not found." };
  }

  const usability = evaluateInvitation(invitation);
  if (!usability.ok) {
    return {
      invitation,
      person: null,
      error:
        usability.reason === "expired"
          ? "This invitation has expired."
          : usability.reason === "accepted"
            ? "This invitation has already been used."
            : "This invitation is no longer valid.",
    };
  }

  const { data: person, error: personError } = await admin
    .from("people")
    .select("*")
    .eq("id", invitation.person_id)
    .maybeSingle();

  if (personError) {
    return { invitation, person: null, error: personError.message };
  }
  if (!person) {
    return {
      invitation,
      person: null,
      error: "Person not found for invitation.",
    };
  }

  return { invitation, person, error: null };
}

export async function linkAuthUserToPerson(input: {
  personId: string;
  authUserId: string;
  email: string | null;
  invitationId?: string | null;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("people")
    .select("id")
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  if (existing && existing.id !== input.personId) {
    return {
      error: "This login is already linked to a different person.",
    };
  }

  const { error: updateError } = await admin
    .from("people")
    .update({
      auth_user_id: input.authUserId,
      account_status: "active",
      ...(input.email ? { email: normalizeEmail(input.email) } : {}),
    })
    .eq("id", input.personId);

  if (updateError) return { error: updateError.message };

  if (input.invitationId) {
    const { error: acceptError } = await admin
      .from("person_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", input.invitationId)
      .is("accepted_at", null);

    if (acceptError) return { error: acceptError.message };
  } else {
    await admin
      .from("person_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("person_id", input.personId)
      .is("accepted_at", null)
      .is("revoked_at", null);
  }

  return { error: null };
}

export async function findPersonForVerifiedEmail(
  email: string,
): Promise<{ data: Person | null; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("people")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
