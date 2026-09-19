import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("people page", () => {
  it("opens add person in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("AddPersonDialog");
    expect(source).not.toContain('href="/people/new"');
  });
});
