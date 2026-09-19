import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "form-actions.tsx"),
  "utf8",
);

describe("FormActions", () => {
  it("renders cancelHref as an outline control, not a primary button", () => {
    expect(source).toContain('buttonVariants({ variant: "outline" })');
    expect(source).not.toMatch(/cancelHref[\s\S]*buttonVariants\(\)/);
  });
});
