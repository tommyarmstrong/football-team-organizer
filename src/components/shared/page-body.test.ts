import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pageBodyClassName } from "@/components/shared/page-body";

const appDir = path.join(import.meta.dirname, "..", "..", "app", "(app)");

const pages = [
  "matches/page.tsx",
  "matches/[id]/page.tsx",
  "dashboard/page.tsx",
  "team/page.tsx",
  "venues/page.tsx",
  "venues/[id]/page.tsx",
  "club/page.tsx",
  "people/page.tsx",
  "people/[id]/page.tsx",
] as const;

describe("pageBodyClassName", () => {
  it("caps width and stays left-aligned", () => {
    const className = pageBodyClassName("space-y-8");
    expect(className).toContain("w-full");
    expect(className).toContain("max-w-lg");
    expect(className).toContain("space-y-8");
    expect(className).not.toContain("mx-auto");
  });

  it.each(pages)("is used by %s", (relative) => {
    const source = readFileSync(path.join(appDir, relative), "utf8");
    expect(source).toContain("pageBodyClassName");
    expect(source).not.toContain("mx-auto");
  });
});
