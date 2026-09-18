import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(import.meta.dirname, "use-toast-action-state.ts"),
  "utf8",
);

describe("useToastActionState", () => {
  it("toasts ActionState success after pending settles", () => {
    expect(source).toContain("toastSuccess(state.success)");
    expect(source).toContain("wasPending.current && !pending");
    expect(source).toContain("useActionState");
  });
});
