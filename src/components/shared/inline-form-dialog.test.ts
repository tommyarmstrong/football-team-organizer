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

  it("can be controlled from outside, with an optional trigger", () => {
    expect(source).toContain("open: controlledOpen");
    expect(source).toContain("onOpenChange");
    expect(source).toContain("trigger?.(");
    expect(source).toContain("controlledOpen === undefined");
  });

  it("stays uncontrolled (trigger-driven) when no open prop is passed", () => {
    expect(source).toContain("useState(false)");
    expect(source).toContain("controlledOpen ?? uncontrolledOpen");
  });
});
