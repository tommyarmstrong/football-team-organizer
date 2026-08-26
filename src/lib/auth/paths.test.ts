import { describe, expect, it } from "vitest";
import {
  isMembershipExemptPath,
  isPasswordSetupPath,
  isPublicPath,
  parsePasswordSetupKind,
  passwordSetupDestination,
} from "@/lib/auth/paths";

describe("auth path helpers", () => {
  it("treats invite and reset routes as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/onboarding/accept")).toBe(true);
    expect(isPublicPath("/auth/invite")).toBe(true);
    expect(isPublicPath("/auth/reset-password")).toBe(true);
    expect(isPublicPath("/auth/forgot-password")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/account/password")).toBe(false);
  });

  it("treats any /auth prefix as public", () => {
    expect(isPublicPath("/auth/anything")).toBe(true);
  });

  it("exempts invite completion from the membership gate", () => {
    expect(isMembershipExemptPath("/auth/invite")).toBe(true);
    expect(isMembershipExemptPath("/auth/forgot-password")).toBe(true);
    expect(isMembershipExemptPath("/onboarding/complete")).toBe(true);
    expect(isMembershipExemptPath("/no-access")).toBe(true);
    expect(isMembershipExemptPath("/dashboard")).toBe(false);
    expect(isMembershipExemptPath("/account/password")).toBe(false);
  });

  it("keeps invite sessions on the password page", () => {
    expect(isPasswordSetupPath("/auth/invite", "invite")).toBe(true);
    expect(isPasswordSetupPath("/auth/callback", "invite")).toBe(true);
    expect(isPasswordSetupPath("/auth/confirm", "invite")).toBe(true);
    expect(isPasswordSetupPath("/onboarding/complete", "invite")).toBe(true);
    expect(isPasswordSetupPath("/dashboard", "invite")).toBe(false);
    expect(passwordSetupDestination("invite")).toBe("/auth/invite");
  });

  it("keeps recovery sessions on the reset page", () => {
    expect(isPasswordSetupPath("/auth/reset-password", "recovery")).toBe(true);
    expect(isPasswordSetupPath("/auth/callback", "recovery")).toBe(true);
    expect(isPasswordSetupPath("/auth/invite", "recovery")).toBe(false);
    expect(isPasswordSetupPath("/onboarding/complete", "recovery")).toBe(false);
    expect(passwordSetupDestination("recovery")).toBe("/auth/reset-password");
  });

  it("parses password-setup cookie values", () => {
    expect(parsePasswordSetupKind("invite")).toBe("invite");
    expect(parsePasswordSetupKind("recovery")).toBe("recovery");
    expect(parsePasswordSetupKind("other")).toBeNull();
    expect(parsePasswordSetupKind(undefined)).toBeNull();
  });
});
