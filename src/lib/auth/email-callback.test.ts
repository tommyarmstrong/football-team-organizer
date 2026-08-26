import { describe, expect, it } from "vitest";
import {
  loginRedirectForAuthParams,
  parseAuthCallbackParams,
  parseEmailOtpType,
  passwordSetupKindForAuth,
  resolveAuthNextPath,
  sanitizeNextPath,
} from "@/lib/auth/email-callback";

describe("sanitizeNextPath", () => {
  it("allows in-app relative paths", () => {
    expect(sanitizeNextPath("/auth/invite")).toBe("/auth/invite");
    expect(sanitizeNextPath("/onboarding/complete?token=abc")).toBe(
      "/onboarding/complete?token=abc",
    );
  });

  it("rejects open redirects", () => {
    expect(sanitizeNextPath("//evil.example")).toBeNull();
    expect(sanitizeNextPath("https://evil.example/phish")).toBe("/phish");
    expect(sanitizeNextPath("not-a-path")).toBeNull();
    expect(sanitizeNextPath("")).toBeNull();
    expect(sanitizeNextPath("   ")).toBeNull();
    expect(sanitizeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("keeps the path and query when given an absolute URL", () => {
    expect(
      sanitizeNextPath("https://tracker.example.com/auth/invite?x=1"),
    ).toBe("/auth/invite?x=1");
  });
});

describe("resolveAuthNextPath", () => {
  it("defaults invite and recovery destinations", () => {
    expect(resolveAuthNextPath({ nextRaw: null, type: "invite" })).toBe(
      "/auth/invite",
    );
    expect(resolveAuthNextPath({ nextRaw: null, type: "recovery" })).toBe(
      "/auth/reset-password",
    );
    expect(
      resolveAuthNextPath({ nextRaw: null, type: null, inviteToken: "tok" }),
    ).toBe("/auth/invite");
  });

  it("prefers a safe next path when present", () => {
    expect(
      resolveAuthNextPath({
        nextRaw: "/auth/invite",
        type: "recovery",
      }),
    ).toBe("/auth/invite");
  });

  it("ignores an unsafe next path and uses the flow default", () => {
    expect(
      resolveAuthNextPath({ nextRaw: "//evil.example", type: "invite" }),
    ).toBe("/auth/invite");
    expect(
      resolveAuthNextPath({ nextRaw: "not-a-path", type: "recovery" }),
    ).toBe("/auth/reset-password");
    expect(resolveAuthNextPath({ nextRaw: "not-a-path", type: null })).toBe(
      "/dashboard",
    );
  });

  it("defaults unknown email types to the dashboard", () => {
    expect(resolveAuthNextPath({ nextRaw: null, type: "signup" })).toBe(
      "/dashboard",
    );
  });
});

describe("passwordSetupKindForAuth", () => {
  it("maps invite and recovery flows", () => {
    expect(
      passwordSetupKindForAuth({ type: "invite", nextPath: "/dashboard" }),
    ).toBe("invite");
    expect(
      passwordSetupKindForAuth({
        type: null,
        nextPath: "/auth/reset-password",
      }),
    ).toBe("recovery");
    expect(
      passwordSetupKindForAuth({ type: null, nextPath: "/dashboard" }),
    ).toBeNull();
  });

  it("treats a recovery next path as recovery even when type is invite", () => {
    expect(
      passwordSetupKindForAuth({
        type: "invite",
        nextPath: "/auth/reset-password",
      }),
    ).toBe("recovery");
  });
});

describe("parseAuthCallbackParams and login redirect", () => {
  it("parses implicit invite tokens from the URL hash", () => {
    const params = parseAuthCallbackParams(
      "",
      "#access_token=aaa&refresh_token=bbb&type=invite",
    );
    expect(params.type).toBe("invite");
    expect(params.accessToken).toBe("aaa");
    expect(loginRedirectForAuthParams(params)).toEqual({
      pathname: "/auth/invite",
      preserveHash: true,
    });
  });

  it("sends recovery hash tokens to the reset page", () => {
    const params = parseAuthCallbackParams(
      "",
      "#access_token=aaa&refresh_token=bbb&type=recovery",
    );
    expect(loginRedirectForAuthParams(params)).toEqual({
      pathname: "/auth/reset-password",
      preserveHash: true,
    });
  });

  it("sends invite/recovery PKCE codes to the password pages", () => {
    const invite = parseAuthCallbackParams("?code=abc&type=invite");
    expect(loginRedirectForAuthParams(invite)?.pathname).toBe(
      "/auth/invite?code=abc&type=invite&next=%2Fauth%2Finvite",
    );

    const recovery = parseAuthCallbackParams("?code=xyz&type=recovery");
    expect(loginRedirectForAuthParams(recovery)?.pathname).toBe(
      "/auth/reset-password?code=xyz&type=recovery&next=%2Fauth%2Freset-password",
    );
  });

  it("sends token_hash through /auth/confirm", () => {
    const params = parseAuthCallbackParams("?token_hash=hash&type=recovery");
    expect(loginRedirectForAuthParams(params)?.pathname).toBe(
      "/auth/confirm?token_hash=hash&type=recovery&next=%2Fauth%2Freset-password",
    );
  });

  it("parses query and hash tokens, preferring hash type", () => {
    const params = parseAuthCallbackParams(
      "?type=recovery&invite_token=tok&error=access_denied&error_description=User+denied",
      "#access_token=aaa&refresh_token=bbb&type=invite",
    );
    expect(params).toMatchObject({
      type: "invite",
      accessToken: "aaa",
      refreshToken: "bbb",
      inviteToken: "tok",
      error: "access_denied",
      errorDescription: "User denied",
    });
  });

  it("accepts only known email OTP types", () => {
    expect(parseEmailOtpType("invite")).toBe("invite");
    expect(parseEmailOtpType("recovery")).toBe("recovery");
    expect(parseEmailOtpType("email")).toBe("email");
    expect(parseEmailOtpType("not-a-type")).toBeNull();
    expect(parseEmailOtpType(null)).toBeNull();
  });

  it("leaves error-only login URLs on /login", () => {
    const params = parseAuthCallbackParams("?error=access_denied");
    expect(loginRedirectForAuthParams(params)).toBeNull();
  });

  it("still forwards when an error is present with a PKCE code", () => {
    const params = parseAuthCallbackParams(
      "?code=abc&type=recovery&error=server_error",
    );
    expect(loginRedirectForAuthParams(params)?.pathname).toContain(
      "/auth/reset-password?code=abc",
    );
  });

  it("keeps an invite token on PKCE and token_hash forwards", () => {
    const code = parseAuthCallbackParams(
      "?code=abc&type=invite&invite_token=tok",
    );
    expect(loginRedirectForAuthParams(code)?.pathname).toBe(
      "/auth/invite?code=abc&invite_token=tok&type=invite&next=%2Fauth%2Finvite",
    );

    const hash = parseAuthCallbackParams(
      "?token_hash=hash&type=invite&invite_token=tok",
    );
    expect(loginRedirectForAuthParams(hash)?.pathname).toBe(
      "/auth/confirm?token_hash=hash&type=invite&next=%2Fauth%2Finvite&invite_token=tok",
    );
  });

  it("uses an explicit next path when forwarding a PKCE code", () => {
    const params = parseAuthCallbackParams(
      "?code=abc&next=%2Fauth%2Freset-password",
    );
    expect(loginRedirectForAuthParams(params)?.pathname).toBe(
      "/auth/reset-password?code=abc&next=%2Fauth%2Freset-password",
    );
  });

  it("keeps non-password-setup PKCE codes on /auth/callback", () => {
    const params = parseAuthCallbackParams("?code=abc&next=%2Fdashboard");
    expect(loginRedirectForAuthParams(params)?.pathname).toBe(
      "/auth/callback?code=abc&next=%2Fdashboard",
    );
  });

  it("sends untyped hash tokens to the invite page", () => {
    const params = parseAuthCallbackParams(
      "",
      "#access_token=aaa&refresh_token=bbb",
    );
    expect(loginRedirectForAuthParams(params)).toEqual({
      pathname: "/auth/invite",
      preserveHash: true,
    });
  });

  it("does not redirect when the URL has no auth token", () => {
    expect(loginRedirectForAuthParams(parseAuthCallbackParams(""))).toBeNull();
  });
});
