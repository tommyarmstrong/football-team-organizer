import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/auth/password";

describe("validateNewPassword", () => {
  it("rejects short passwords", () => {
    expect(validateNewPassword("short", "short")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("rejects mismatched confirmation", () => {
    expect(validateNewPassword("longenough", "different1")).toBe(
      "Passwords do not match.",
    );
  });

  it("accepts matching passwords of minimum length", () => {
    expect(validateNewPassword("password", "password")).toBeNull();
  });

  it("rejects empty and seven-character passwords before comparing", () => {
    expect(validateNewPassword("", "")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    expect(validateNewPassword("1234567", "1234567")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("accepts passwords longer than the minimum", () => {
    expect(validateNewPassword("longenough1", "longenough1")).toBeNull();
  });
});
