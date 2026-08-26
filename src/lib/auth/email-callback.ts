import type { EmailOtpType } from "@supabase/supabase-js";
import type { PasswordSetupKind } from "@/lib/auth/paths";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export type AuthCallbackParams = {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorDescription: string | null;
  inviteToken: string | null;
  next: string | null;
};

export function parseAuthCallbackParams(
  search: string,
  hash = "",
): AuthCallbackParams {
  const query = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const hashParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );

  return {
    code: query.get("code"),
    tokenHash: query.get("token_hash"),
    type: parseEmailOtpType(hashParams.get("type") ?? query.get("type")),
    accessToken: hashParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token"),
    error: query.get("error") ?? hashParams.get("error"),
    errorDescription:
      query.get("error_description") ?? hashParams.get("error_description"),
    inviteToken: query.get("invite_token"),
    next: query.get("next"),
  };
}

export function parseEmailOtpType(raw: string | null): EmailOtpType | null {
  if (!raw || !EMAIL_OTP_TYPES.has(raw as EmailOtpType)) return null;
  return raw as EmailOtpType;
}

/** Only in-app relative paths; blocks protocol-relative open redirects. */
export function sanitizeNextPath(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let path = raw.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      path = `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export function resolveAuthNextPath(input: {
  nextRaw: string | null;
  type: EmailOtpType | null;
  inviteToken?: string | null;
}): string {
  const next = sanitizeNextPath(input.nextRaw);
  if (next) return next;
  if (input.type === "recovery") return "/auth/reset-password";
  if (input.type === "invite" || input.inviteToken) return "/auth/invite";
  return "/dashboard";
}

export function passwordSetupKindForAuth(input: {
  type: EmailOtpType | null;
  nextPath: string;
}): PasswordSetupKind | null {
  if (
    input.type === "recovery" ||
    input.nextPath.startsWith("/auth/reset-password")
  ) {
    return "recovery";
  }
  if (input.type === "invite" || input.nextPath.startsWith("/auth/invite")) {
    return "invite";
  }
  return null;
}

/**
 * Where /login should send the browser when an invite or recovery token
 * landed on Site URL instead of the dedicated Auth page.
 */
export function loginRedirectForAuthParams(params: AuthCallbackParams): {
  pathname: string;
  preserveHash: boolean;
} | null {
  if (
    params.error &&
    !params.code &&
    !params.tokenHash &&
    !params.accessToken
  ) {
    return null;
  }

  if (params.accessToken && params.refreshToken) {
    if (params.type === "recovery") {
      return { pathname: "/auth/reset-password", preserveHash: true };
    }
    return { pathname: "/auth/invite", preserveHash: true };
  }

  if (params.tokenHash && params.type) {
    const next = resolveAuthNextPath({
      nextRaw: params.next,
      type: params.type,
      inviteToken: params.inviteToken,
    });
    const search = new URLSearchParams();
    search.set("token_hash", params.tokenHash);
    search.set("type", params.type);
    search.set("next", next);
    if (params.inviteToken) search.set("invite_token", params.inviteToken);
    return {
      pathname: `/auth/confirm?${search.toString()}`,
      preserveHash: false,
    };
  }

  if (params.code) {
    const next = resolveAuthNextPath({
      nextRaw: params.next,
      type: params.type,
      inviteToken: params.inviteToken,
    });
    const search = new URLSearchParams();
    search.set("code", params.code);
    search.set("next", next);
    if (params.inviteToken) search.set("invite_token", params.inviteToken);
    if (params.type) search.set("type", params.type);
    return {
      pathname: `/auth/callback?${search.toString()}`,
      preserveHash: false,
    };
  }

  return null;
}
