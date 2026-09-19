import { describe, expect, it } from "vitest";
import {
  stackedActionButtonClassName,
  stackedActionCellClassName,
  stackedActionsRowClassName,
} from "@/components/shared/stacked-actions";

describe("stackedActionsRowClassName", () => {
  it("stacks content-sized equal-width buttons, row from sm up", () => {
    const className = stackedActionsRowClassName();
    const tokens = className.split(/\s+/);
    expect(tokens).toContain("inline-grid");
    expect(tokens).toContain("w-max");
    expect(tokens).toContain("max-w-full");
    expect(tokens).toContain("grid-cols-1");
    expect(tokens).toContain("sm:grid-flow-col");
    expect(tokens).toContain("sm:auto-cols-fr");
    expect(tokens).not.toContain("w-full");
  });
});

describe("stackedActionButtonClassName", () => {
  it("fills the shared grid cell without forcing screen width", () => {
    const className = stackedActionButtonClassName();
    expect(className).toContain("w-full");
    expect(className).not.toContain("sm:w-auto");
  });
});

describe("stackedActionCellClassName", () => {
  it("lets a dialog trigger fill its cell without widening the grid", () => {
    const className = stackedActionCellClassName();
    expect(className).toContain("flex");
    expect(className).toContain("w-full");
    expect(className).toContain("min-w-0");
  });
});
