import { describe, expect, it } from "vitest";
import {
  isMembershipExemptPath,
  isPasswordSetupPath,
  isPublicPath,
  passwordSetupDestination,
} from "@/lib/auth/paths";

describe("auth path helpers", () => {
  it("treats invite and reset routes as public", () => {
    expect(isPublicPath("/auth/invite")).toBe(true);
    expect(isPublicPath("/auth/reset-password")).toBe(true);
    expect(isPublicPath("/auth/forgot-password")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("exempts invite completion from the membership gate", () => {
    expect(isMembershipExemptPath("/auth/invite")).toBe(true);
    expect(isMembershipExemptPath("/onboarding/complete")).toBe(true);
    expect(isMembershipExemptPath("/dashboard")).toBe(false);
  });

  it("keeps invite sessions on the password page", () => {
    expect(isPasswordSetupPath("/auth/invite", "invite")).toBe(true);
    expect(isPasswordSetupPath("/auth/callback", "invite")).toBe(true);
    expect(isPasswordSetupPath("/dashboard", "invite")).toBe(false);
    expect(passwordSetupDestination("invite")).toBe("/auth/invite");
  });

  it("keeps recovery sessions on the reset page", () => {
    expect(isPasswordSetupPath("/auth/reset-password", "recovery")).toBe(true);
    expect(isPasswordSetupPath("/auth/invite", "recovery")).toBe(false);
    expect(passwordSetupDestination("recovery")).toBe("/auth/reset-password");
  });
});
