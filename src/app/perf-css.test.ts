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
});
