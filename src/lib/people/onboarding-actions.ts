"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
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

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          person_id: person.id,
          invitation_id: invitation.id,
          first_name: person.first_name,
          last_name: person.last_name,
        },
      });

    if (createError || !created.user) {
      // User may already exist from a prior inviteUserByEmail — try signing in.
      const supabase = await createClient();
      const { data: signedIn, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: input.password,
        });
      if (signInError || !signedIn.user) {
        return {
          error:
            createError?.message ??
            signInError?.message ??
            "Could not create account.",
        };
      }

      const linkError = await linkAuthUserToPerson({
        personId: person.id,
        authUserId: signedIn.user.id,
        email,
        invitationId: invitation.id,
      });
      if (linkError.error) return { error: linkError.error };
      return { success: "Account linked." };
    }

    const linkError = await linkAuthUserToPerson({
      personId: person.id,
      authUserId: created.user.id,
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

    return { success: "Account created." };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not accept invitation (service role required).",
    };
  }
}
