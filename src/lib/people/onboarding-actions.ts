"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findAuthUserIdByEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
} from "@/lib/people/invitations";
import { normalizeEmail } from "@/lib/people/person";

export async function acceptInvitationWithPassword(input: {
  token: string;
  password: string;
}): Promise<{ error?: string; success?: string }> {
  try {
    const { invitation, person, error } = await loadInvitationByToken(
      input.token,
    );
    if (error || !invitation || !person) {
      return { error: error ?? "Invalid invitation." };
    }

    const admin = createAdminClient();
    const email = normalizeEmail(invitation.email);
    const userMetadata = {
      person_id: person.id,
      invitation_id: invitation.id,
      first_name: person.first_name,
      last_name: person.last_name,
    };

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    let authUserId = created.user?.id ?? null;

    if (createError || !authUserId) {
      // User often already exists from a prior inviteUserByEmail — set the
      // password they chose on the accept form, then sign in and link.
      const { id: existingId, error: lookupError } =
        await findAuthUserIdByEmail(email);
      if (lookupError) return { error: lookupError };
      if (!existingId) {
        return {
          error:
            createError?.message ?? "Could not create or find Auth account.",
        };
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(
        existingId,
        {
          password: input.password,
          email_confirm: true,
          user_metadata: userMetadata,
        },
      );
      if (updateError) return { error: updateError.message };
      authUserId = existingId;
    }

    const linkError = await linkAuthUserToPerson({
      personId: person.id,
      authUserId,
      email,
      invitationId: invitation.id,
    });
    if (linkError.error) return { error: linkError.error };

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (signInError) return { error: signInError.message };

    return {
      success: createError ? "Account linked." : "Account created.",
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not accept invitation (service role required).",
    };
  }
}
