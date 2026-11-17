import { describe, expect, it } from "vitest";
import {
  optionsButtonClassName,
  primaryActionButtonClassName,
  primaryActionRowClassName,
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

describe("primary action + Options row", () => {
  it("lays the primary button and Options on one row", () => {
    const tokens = primaryActionRowClassName().split(/\s+/);
    expect(tokens).toContain("flex");
    expect(tokens).toContain("items-center");
    expect(tokens).toContain("gap-2");
  });

  it("lets the primary button grow on phones and size to content from sm", () => {
    const tokens = primaryActionButtonClassName().split(/\s+/);
    expect(tokens).toContain("h-11");
    expect(tokens).toContain("flex-1");
    expect(tokens).toContain("min-w-0");
    expect(tokens).toContain("sm:h-8");
    expect(tokens).toContain("sm:flex-none");
  });

  it("keeps Options a 44px target on phones", () => {
    const tokens = optionsButtonClassName().split(/\s+/);
    expect(tokens).toContain("h-11");
    expect(tokens).toContain("sm:h-8");
    expect(tokens).not.toContain("flex-1");
  });
});
