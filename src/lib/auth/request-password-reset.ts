import { createClient } from "@/lib/supabase/client";

const SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a password reset link. Check your inbox.";

/**
 * Starts a password-recovery email from the browser client.
 *
 * Must run in the browser (not a Server Action): PKCE stores a code verifier
 * in cookies via @supabase/ssr, and /auth/callback needs that same cookie to
 * call exchangeCodeForSession.
 */
export async function requestPasswordResetEmail(
  email: string,
): Promise<{ error?: string; success?: string }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: "Enter your email address." };

  const supabase = createClient();
  const origin = window.location.origin;
  // Land on the reset page so exchangeCodeForSession runs in the browser
  // against the same cookie storage that holds the PKCE code verifier.
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: SUCCESS_MESSAGE };
}
