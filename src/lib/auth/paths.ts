const PUBLIC_PATHS = new Set([
  "/login",
  "/onboarding/accept",
  "/auth/callback",
  "/auth/confirm",
  "/auth/invite",
  "/auth/reset-password",
  "/auth/forgot-password",
]);

const MEMBERSHIP_EXEMPT_PATHS = new Set([
  "/login",
  "/no-access",
  "/onboarding/accept",
  "/onboarding/complete",
  "/auth/callback",
  "/auth/confirm",
  "/auth/invite",
  "/auth/reset-password",
  "/auth/forgot-password",
]);

/** Cookie set while an invite or recovery session must choose a password. */
export const PASSWORD_SETUP_COOKIE = "password_setup";

export type PasswordSetupKind = "invite" | "recovery";

export function parsePasswordSetupKind(
  value: string | undefined,
): PasswordSetupKind | null {
  if (value === "invite" || value === "recovery") return value;
  return null;
}

const AUTH_PREFIX = "/auth/";

export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/onboarding/accept") ||
    pathname.startsWith(AUTH_PREFIX)
  );
}

export function isMembershipExemptPath(pathname: string) {
  return (
    MEMBERSHIP_EXEMPT_PATHS.has(pathname) ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith(AUTH_PREFIX)
  );
}

export function isPasswordSetupPath(pathname: string, kind: PasswordSetupKind) {
  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/confirm")
  ) {
    return true;
  }
  if (kind === "invite") {
    return pathname === "/auth/invite" || pathname.startsWith("/onboarding/");
  }
  return pathname === "/auth/reset-password";
}

export function passwordSetupDestination(kind: PasswordSetupKind) {
  return kind === "recovery" ? "/auth/reset-password" : "/auth/invite";
}
