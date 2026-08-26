import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  passwordSetupKindForAuth,
  parseEmailOtpType,
  resolveAuthNextPath,
  sanitizeNextPath,
} from "@/lib/auth/email-callback";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";
import {
  findPersonForVerifiedEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
} from "@/lib/people/invitations";
import { normalizeEmail } from "@/lib/people/person";
import { createClient } from "@/lib/supabase/server";

async function linkUserFromInviteSession(input: {
  user: User;
  inviteToken: string | null;
  origin: string;
}): Promise<NextResponse | null> {
  const { user, inviteToken, origin } = input;
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
  return null;
}

async function markPasswordSetup(kind: "invite" | "recovery") {
  const cookieStore = await cookies();
  cookieStore.set(PASSWORD_SETUP_COOKIE, kind, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function handleEmailAuthRequest(
  request: Request,
  options: { requireToken?: boolean } = {},
): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = parseEmailOtpType(searchParams.get("type"));
  const inviteToken = searchParams.get("invite_token");
  const nextPath = resolveAuthNextPath({
    nextRaw: searchParams.get("next"),
    type,
    inviteToken,
  });

  const supabase = await createClient();
  let exchangeError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) exchangeError = error.message;
  } else if (options.requireToken) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("This email link is missing a token. Request a new invite or password reset.")}`,
    );
  }

  if (exchangeError) {
    const fallback =
      type === "recovery" ? "/auth/reset-password" : "/auth/invite";
    return NextResponse.redirect(
      `${origin}${fallback}?error=${encodeURIComponent(exchangeError)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const mismatch = await linkUserFromInviteSession({
      user,
      inviteToken,
      origin,
    });
    if (mismatch) return mismatch;

    const setupKind = passwordSetupKindForAuth({ type, nextPath });
    if (setupKind) await markPasswordSetup(setupKind);
  }

  const safeNext = sanitizeNextPath(nextPath) ?? "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
