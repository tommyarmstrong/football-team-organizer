import { describe, expect, it } from "vitest";
import {
  matchStatusActionButtonClassName,
  matchStatusActionsRowClassName,
} from "@/components/matches/match-status-actions";

describe("matchStatusActionsRowClassName", () => {
  it("stacks vertically on mobile and horizontally from sm up", () => {
    const className = matchStatusActionsRowClassName();
    expect(className).toContain("flex-col");
    expect(className).toContain("sm:flex-row");
  });
});

describe("matchStatusActionButtonClassName", () => {
  it("uses full width on mobile and auto width from sm up", () => {
    const className = matchStatusActionButtonClassName();
    expect(className).toContain("w-full");
    expect(className).toContain("sm:w-auto");
  });
});
