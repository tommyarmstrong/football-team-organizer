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
  findPersonForAuthUserId,
  findPersonForVerifiedEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
} from "@/lib/people/invitations";
import { normalizeEmail } from "@/lib/people/person";
import { createClient } from "@/lib/supabase/server";

const NOT_INVITED_MESSAGE =
  "You need an invitation before you can sign in. Ask your club to invite you.";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function denyUninvitedAccess(
  supabase: SupabaseServerClient,
  origin: string,
  message: string = NOT_INVITED_MESSAGE,
): Promise<NextResponse> {
  await supabase.auth.signOut();
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(message)}`,
  );
}

/**
 * Link auth.users → people when an invite token or matching email is present.
 * Returns a redirect on invite email mismatch; otherwise whether linking succeeded.
 */
async function linkUserFromInviteSession(input: {
  user: User;
  inviteToken: string | null;
  origin: string;
}): Promise<
  { linked: boolean } | { redirect: NextResponse } | { deny: string }
> {
  const { user, inviteToken, origin } = input;

  if (inviteToken) {
    const {
      invitation,
      person,
      error: inviteError,
    } = await loadInvitationByToken(inviteToken);
    if (inviteError || !invitation || !person) {
      return { linked: false };
    }

    const email = user.email ? normalizeEmail(user.email) : null;
    if (email && email !== normalizeEmail(invitation.email)) {
      return {
        redirect: NextResponse.redirect(
          `${origin}/onboarding/accept?token=${encodeURIComponent(inviteToken)}&error=${encodeURIComponent("Signed-in email does not match the invitation.")}`,
        ),
      };
    }

    const { error: linkError } = await linkAuthUserToPerson({
      personId: person.id,
      authUserId: user.id,
      email,
      invitationId: invitation.id,
    });
    if (linkError) {
      return {
        redirect: NextResponse.redirect(
          `${origin}/onboarding/accept?token=${encodeURIComponent(inviteToken)}&error=${encodeURIComponent(linkError)}`,
        ),
      };
    }
    return { linked: true };
  }

  if (user.email) {
    const { data: person, error } = await findPersonForVerifiedEmail(
      user.email,
    );
    if (error) return { linked: false };
    if (!person) {
      const { data: byAuth } = await findPersonForAuthUserId(user.id);
      return { linked: Boolean(byAuth) };
    }

    if (!person.auth_user_id) {
      const { error: linkError } = await linkAuthUserToPerson({
        personId: person.id,
        authUserId: user.id,
        email: user.email,
      });
      if (linkError) return { linked: false };
      return { linked: true };
    }

    if (person.auth_user_id !== user.id) {
      return {
        deny: "This email is already linked to a different account.",
      };
    }

    return { linked: true };
  }

  const { data: byAuth } = await findPersonForAuthUserId(user.id);
  return { linked: Boolean(byAuth) };
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
    let linkResult: Awaited<ReturnType<typeof linkUserFromInviteSession>>;
    try {
      linkResult = await linkUserFromInviteSession({
        user,
        inviteToken,
        origin,
      });
    } catch {
      // Service role missing or linking failed — fail closed for app access.
      linkResult = { linked: false };
    }

    if ("redirect" in linkResult) return linkResult.redirect;
    if ("deny" in linkResult) {
      return denyUninvitedAccess(supabase, origin, linkResult.deny);
    }

    // Password recovery must still reach the reset form even if the account
    // is not linked to a people row yet.
    if (type !== "recovery") {
      let linked = linkResult.linked;
      if (!linked) {
        try {
          const { data: person } = await findPersonForAuthUserId(user.id);
          linked = Boolean(person);
        } catch {
          linked = false;
        }
      }
      if (!linked) {
        return denyUninvitedAccess(supabase, origin);
      }
    }

    const setupKind = passwordSetupKindForAuth({ type, nextPath });
    if (setupKind) await markPasswordSetup(setupKind);
  }

  const safeNext = sanitizeNextPath(nextPath) ?? "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
