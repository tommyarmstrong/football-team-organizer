import { describe, expect, it } from "vitest";
import {
  loginRedirectForAuthParams,
  parseAuthCallbackParams,
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

  it("sends PKCE codes through /auth/callback", () => {
    const params = parseAuthCallbackParams("?code=abc&type=invite");
    expect(loginRedirectForAuthParams(params)?.pathname).toBe(
      "/auth/callback?code=abc&next=%2Fauth%2Finvite&type=invite",
    );
  });

  it("sends token_hash through /auth/confirm", () => {
    const params = parseAuthCallbackParams("?token_hash=hash&type=recovery");
    expect(loginRedirectForAuthParams(params)?.pathname).toBe(
      "/auth/confirm?token_hash=hash&type=recovery&next=%2Fauth%2Freset-password",
    );
  });
});
