import { describe, expect, it } from "vitest";
import {
  stackedActionButtonClassName,
  stackedActionsRowClassName,
} from "@/components/shared/stacked-actions";

describe("stackedActionsRowClassName", () => {
  it("stacks content-sized equal-width buttons, row from sm up", () => {
    const className = stackedActionsRowClassName();
    expect(className).toContain("inline-grid");
    expect(className).toContain("grid-cols-1");
    expect(className).toContain("sm:grid-flow-col");
    expect(className).toContain("sm:auto-cols-fr");
    expect(className).not.toContain("w-full");
  });
});

describe("stackedActionButtonClassName", () => {
  it("fills the shared grid cell without forcing screen width", () => {
    const className = stackedActionButtonClassName();
    expect(className).toContain("w-full");
    expect(className).not.toContain("sm:w-auto");
  });
});
