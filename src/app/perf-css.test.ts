import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CSS and font loading (§8.1, §8.3)", () => {
  const globals = readFileSync(
    resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const layout = readFileSync(
    resolve(process.cwd(), "src/app/layout.tsx"),
    "utf8",
  );
  const binder = readFileSync(
    resolve(process.cwd(), "src/components/layout/club-colour-binder.tsx"),
    "utf8",
  );

  it("paints the body background on a fixed pseudo-element instead of attachment:fixed", () => {
    expect(globals).not.toMatch(/background-attachment:\s*fixed/);
    expect(globals).toMatch(/body::before/);
    expect(globals).toMatch(/position:\s*fixed/);
  });

  it("uses font-display swap and does not load Geist Mono globally", () => {
    expect(layout).toMatch(/display:\s*"swap"/);
    expect(layout).not.toMatch(/Geist_Mono/);
    expect(layout).not.toMatch(/geistMono/);
    expect(globals).not.toMatch(/--font-geist-mono/);
  });

  it("applies club colour from useEffect rather than useLayoutEffect (§2.2)", () => {
    expect(binder).toMatch(/useEffect/);
    expect(binder).not.toMatch(/useLayoutEffect/);
  });

  it("does not mix club colour into --border or --input", () => {
    const clubBlock = globals.match(
      /\[data-club-colour="true"\]\s*\{[^}]+\}/,
    )?.[0];
    expect(clubBlock).toBeTruthy();
    expect(clubBlock).not.toMatch(/--border:/);
    expect(clubBlock).not.toMatch(/--input:/);
    expect(clubBlock).not.toMatch(/--hero:\s*var\(--header\)/);
    expect(globals).not.toMatch(
      /\[data-club-colour="true"\] \.divide-y > :not\(:first-child\)/,
    );
  });

  it("registers a hero-rail token for paper match heroes", () => {
    expect(globals).toContain("--color-hero-rail: var(--hero-rail)");
    expect(globals).toContain("--hero-rail: var(--pitch-deep)");
    expect(globals).toContain("--hero-rail: var(--primary)");
  });

  it("paints the dashboard title as a vibrant club-colour gradient, not a pale wash", () => {
    expect(globals).toMatch(/linear-gradient\(\s*145deg/);
    expect(globals).toContain("var(--primary) 58%");
    expect(globals).toContain("var(--club-colour) 58%");
    expect(globals).not.toContain(
      "color-mix(in srgb, var(--club-colour) 12%, var(--card))",
    );
  });
});
