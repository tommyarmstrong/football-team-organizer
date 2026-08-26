import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

const SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a password reset link. Check your inbox.";

/**
 * Starts a password-recovery email.
 *
 * Uses the implicit Auth flow (not PKCE). The SSR browser client always uses
 * PKCE, which stores a code verifier in cookies that must still be present when
 * the email link is opened — that fails across devices/browsers and often even
 * in the same browser. Implicit recovery returns tokens in the URL hash, which
 * `/auth/reset-password` already establishes via setSession.
 *
 * Prefer the hosted Recovery email template that uses `token_hash` +
 * `/auth/confirm` (see `supabase/templates/recovery.html`) for the
 * SSR-recommended path that also works without hash tokens.
 */
export async function requestPasswordResetEmail(
  email: string,
): Promise<{ error?: string; success?: string }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: "Enter your email address." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { error: "Auth is not configured." };
  }

  const supabase = createSupabaseJsClient(url, anonKey, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      storageKey: "ft-password-reset-request",
    },
  });

  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: SUCCESS_MESSAGE };
}
