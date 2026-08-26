import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/auth/password";

describe("validateNewPassword", () => {
  it("rejects short passwords", () => {
    expect(validateNewPassword("Short1", "Short1")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("rejects mismatched confirmation after policy checks", () => {
    expect(validateNewPassword("Password1", "Different1")).toBe(
      "Passwords do not match.",
    );
  });

  it("rejects passwords missing an uppercase letter", () => {
    expect(validateNewPassword("password1", "password1")).toBe(
      "Password must include both uppercase and lowercase letters.",
    );
  });

  it("rejects passwords missing a lowercase letter", () => {
    expect(validateNewPassword("PASSWORD1", "PASSWORD1")).toBe(
      "Password must include both uppercase and lowercase letters.",
    );
  });

  it("rejects passwords missing a number", () => {
    expect(validateNewPassword("Password", "Password")).toBe(
      "Password must include at least one number.",
    );
  });

  it("accepts matching passwords that meet the policy", () => {
    expect(validateNewPassword("Password1", "Password1")).toBeNull();
  });

  it("rejects empty and seven-character passwords before comparing", () => {
    expect(validateNewPassword("", "")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    expect(validateNewPassword("Ab34567", "Ab34567")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("accepts passwords longer than the minimum", () => {
    expect(validateNewPassword("LongerPass1", "LongerPass1")).toBeNull();
  });
});
