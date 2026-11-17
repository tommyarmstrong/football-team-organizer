import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { searchableSelectClassNames } from "@/components/shared/searchable-select";

const source = readFileSync(
  path.join(import.meta.dirname, "searchable-select.tsx"),
  "utf8",
);

describe("searchableSelectClassNames", () => {
  it("keeps the default 32px control unchanged", () => {
    expect(searchableSelectClassNames("default")).toEqual({
      group: "h-8",
      input: "pr-14",
      button: "size-7",
    });
  });

  it("makes the touch size 44px on phones and 32px from sm", () => {
    const touch = searchableSelectClassNames("touch");
    expect(touch.group).toBe("h-11 sm:h-8");
    expect(touch.button).toBe("size-9 sm:size-7");
    // Room for two 36px buttons on phones.
    expect(touch.input).toBe("pr-[4.75rem] sm:pr-14");
  });
});

describe("SearchableSelect", () => {
  it("keeps 16px input text on phones to avoid iOS Safari zoom", () => {
    expect(source).toContain("text-base");
    expect(source).toContain("md:text-sm");
  });

  it("keeps clear and open controls labelled", () => {
    expect(source).toContain('aria-label="Clear selection"');
    expect(source).toContain('aria-label="Open options"');
  });

  it("limits the list to the space left above the keyboard / viewport edge", () => {
    expect(source).toContain("--available-height");
  });
});
