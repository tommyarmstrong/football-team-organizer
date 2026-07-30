import { describe, expect, it } from "vitest";
import { resolveAuthDisplayName } from "@/lib/authz/context";

describe("resolveAuthDisplayName", () => {
  it("prefers full_name from user metadata", () => {
    expect(
      resolveAuthDisplayName({
        email: "alex@example.com",
        user_metadata: { full_name: "Alex Player", name: "Alex" },
      }),
    ).toBe("Alex Player");
  });

  it("falls back to name, then display_name", () => {
    expect(
      resolveAuthDisplayName({
        email: "alex@example.com",
        user_metadata: { name: "Alex" },
      }),
    ).toBe("Alex");
    expect(
      resolveAuthDisplayName({
        email: "alex@example.com",
        user_metadata: { display_name: "A. Player" },
      }),
    ).toBe("A. Player");
  });

  it("falls back to email local-part when metadata has no name", () => {
    expect(
      resolveAuthDisplayName({
        email: "alex@example.com",
        user_metadata: {},
      }),
    ).toBe("alex");
  });

  it("returns null when neither name nor email is available", () => {
    expect(resolveAuthDisplayName({})).toBeNull();
  });
});
