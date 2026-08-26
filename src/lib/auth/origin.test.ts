import { afterEach, describe, expect, it, vi } from "vitest";
import { appOrigin } from "@/lib/auth/origin";

describe("appOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_APP_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tracker.example.com/");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(appOrigin()).toBe("https://tracker.example.com");
  });

  it("uses the Vercel URL when the app URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "my-app.vercel.app/");
    expect(appOrigin()).toBe("https://my-app.vercel.app");
  });

  it("falls back to localhost for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(appOrigin()).toBe("http://localhost:3000");
  });
});
