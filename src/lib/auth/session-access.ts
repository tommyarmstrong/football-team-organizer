import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPrimaryClub } from "@/lib/data/clubs";
import { parseClubColourHint } from "@/lib/clubs/colour-hint";
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
  // §1.2 — Middleware already validated the JWT via getUser() on this request
  // and refreshed the session cookie if needed. getSession() reads that
  // already-validated session from cookies without a second network round-trip
  // to the Supabase Auth server, halving auth latency for this code path.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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

/**
 * Resolve a best-effort club colour hint for the signed-in user.
 * Null means no valid colour is currently available.
 */
export async function resolveSignedInClubColourHint(): Promise<string | null> {
  const club = await getPrimaryClub();
  return parseClubColourHint(club?.colour ?? null);
}
