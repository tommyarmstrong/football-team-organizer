import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("skips falsy values", () => {
    expect(cn("base", false && "hidden", undefined, "active")).toBe(
      "base active",
    );
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe(
      "text-sm text-blue-500",
    );
  });
});
