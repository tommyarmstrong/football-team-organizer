import { describe, expect, it } from "vitest";
import { config } from "@/proxy";

describe("proxy matcher (§3.3)", () => {
  const matcher = config.matcher[0];

  it("excludes static Next.js assets and image files", () => {
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("_next/image");
    expect(matcher).toContain("favicon.ico");
    expect(matcher).toContain("svg|png|jpg|jpeg|gif|webp");
  });

  it("excludes auth callback/confirm and /api routes that handle their own session", () => {
    expect(matcher).toContain("auth/callback");
    expect(matcher).toContain("auth/confirm");
    expect(matcher).toContain("api(?:/|$)");
  });

  it("does not exclude /auth/session/verify so post-login cookies still set", () => {
    expect(matcher).not.toContain("auth/session");
  });
});
