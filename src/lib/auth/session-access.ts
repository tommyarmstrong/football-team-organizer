import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  findPersonForAuthUserId,
  findPersonForVerifiedEmail,
} from "@/lib/people/invitations";
import { personMaySignIn, signInDeniedMessage } from "@/lib/people/person";

/**
 * Ensure an authenticated session belongs to an invited/active person.
 * When denied, this signs out the active session.
 */
export async function verifySignedInPersonAccess(): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  try {
    let person = (await findPersonForAuthUserId(user.id)).data;
    if (!person && user.email) {
      person = (await findPersonForVerifiedEmail(user.email)).data;
    }

    if (!person || !personMaySignIn(person.account_status)) {
      await supabase.auth.signOut();
      return { error: signInDeniedMessage(person?.account_status) };
    }
  } catch {
    await supabase.auth.signOut();
    return { error: signInDeniedMessage(null) };
  }

  return { error: null };
}
