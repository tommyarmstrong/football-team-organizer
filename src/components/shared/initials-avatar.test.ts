import { describe, expect, it } from "vitest";
import { initialsFromName } from "@/components/shared/initials-avatar";

describe("initialsFromName", () => {
  it("uses the first letter of the first two words", () => {
    expect(initialsFromName("Harry Kane")).toBe("HK");
  });

  it("handles a single name", () => {
    expect(initialsFromName("Neymar")).toBe("N");
  });

  it("falls back when the name is blank", () => {
    expect(initialsFromName("   ")).toBe("?");
  });
});
