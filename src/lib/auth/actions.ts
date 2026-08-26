"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";
import { validateNewPassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";
import {
  findPersonForVerifiedEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
} from "@/lib/people/invitations";
import { normalizeEmail } from "@/lib/people/person";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(PASSWORD_SETUP_COOKIE);
  redirect("/login");
}

export async function updatePasswordAndFinishAction(input: {
  password: string;
  confirm: string;
  inviteToken?: string | null;
}): Promise<{ error?: string }> {
  const passwordError = validateNewPassword(input.password, input.confirm);
  if (passwordError) return { error: passwordError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "This link has expired or is no longer valid. Request a new invite or password reset.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });
  if (error) return { error: error.message };

  try {
    const inviteToken = input.inviteToken?.trim() || null;
    if (inviteToken) {
      const {
        invitation,
        person,
        error: inviteError,
      } = await loadInvitationByToken(inviteToken);
      if (!inviteError && invitation && person) {
        const email = user.email ? normalizeEmail(user.email) : null;
        if (email && email === normalizeEmail(invitation.email)) {
          await linkAuthUserToPerson({
            personId: person.id,
            authUserId: user.id,
            email,
            invitationId: invitation.id,
          });
        }
      }
    } else if (user.email) {
      const { data: person } = await findPersonForVerifiedEmail(user.email);
      if (person && !person.auth_user_id) {
        await linkAuthUserToPerson({
          personId: person.id,
          authUserId: user.id,
          email: user.email,
        });
      }
    }
  } catch {
    // Linking is best-effort when the service role is unavailable.
  }

  const cookieStore = await cookies();
  cookieStore.delete(PASSWORD_SETUP_COOKIE);
  return {};
}
