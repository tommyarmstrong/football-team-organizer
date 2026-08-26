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
});
