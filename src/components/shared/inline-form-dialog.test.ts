import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "inline-form-dialog.tsx"),
  "utf8",
);

describe("InlineFormDialog", () => {
  it("matches the add-goal dialog shell", () => {
    expect(source).toContain("max-h-[min(90dvh,40rem)]");
    expect(source).toContain("overflow-y-auto");
    expect(source).toContain("sm:max-w-lg");
    expect(source).toContain("sm:max-w-2xl");
    expect(source).toContain("showCloseButton");
    expect(source).toContain("DialogTitle");
    expect(source).toContain("DialogDescription");
  });
});
