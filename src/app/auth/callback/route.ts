import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findPersonForVerifiedEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
} from "@/lib/people/invitations";
import { normalizeEmail } from "@/lib/people/person";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/dashboard";
  const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";
  const inviteToken = searchParams.get("invite_token");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        if (inviteToken) {
          const {
            invitation,
            person,
            error: inviteError,
          } = await loadInvitationByToken(inviteToken);
          if (!inviteError && invitation && person) {
            const email = user.email ? normalizeEmail(user.email) : null;
            if (email && email !== normalizeEmail(invitation.email)) {
              return NextResponse.redirect(
                `${origin}/onboarding/accept?token=${encodeURIComponent(inviteToken)}&error=${encodeURIComponent("Signed-in email does not match the invitation.")}`,
              );
            }
            await linkAuthUserToPerson({
              personId: person.id,
              authUserId: user.id,
              email,
              invitationId: invitation.id,
            });
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
        // Service role may be unset in local preview; session still established.
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
