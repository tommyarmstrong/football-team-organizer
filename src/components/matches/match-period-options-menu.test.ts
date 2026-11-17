import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  matchPeriodOptionItemClassName,
  matchPeriodOptionsItems,
} from "@/components/matches/match-period-options-menu";

const source = readFileSync(
  path.join(import.meta.dirname, "match-period-options-menu.tsx"),
  "utf8",
);

describe("matchPeriodOptionsItems", () => {
  it("offers Add period then Change format when both apply", () => {
    expect(
      matchPeriodOptionsItems({
        showAddPeriod: true,
        changeFormatTarget: "quarters",
      }),
    ).toEqual(["add-period", "change-format"]);
  });

  it("offers only what applies", () => {
    expect(
      matchPeriodOptionsItems({
        showAddPeriod: true,
        changeFormatTarget: null,
      }),
    ).toEqual(["add-period"]);
    expect(
      matchPeriodOptionsItems({
        showAddPeriod: false,
        changeFormatTarget: "halves",
      }),
    ).toEqual(["change-format"]);
  });

  it("offers nothing (so no Options button) when neither applies", () => {
    expect(
      matchPeriodOptionsItems({
        showAddPeriod: false,
        changeFormatTarget: null,
      }),
    ).toEqual([]);
  });
});

describe("MatchPeriodOptionsMenu", () => {
  it("gives menu items a 44px touch target", () => {
    expect(matchPeriodOptionItemClassName).toContain("min-h-11");
    expect(matchPeriodOptionItemClassName).toContain("w-full");
  });

  it("uses the existing popover and button components, with no new dependency", () => {
    expect(source).toContain('from "@/components/ui/popover"');
    expect(source).toContain('from "@/components/ui/button"');
    expect(source).toContain('from "lucide-react"');
  });

  it("keeps the same dialogs, so the format-change confirmation is preserved", () => {
    expect(source).toContain('title="Add extra time or penalties"');
    expect(source).toContain('title="Change period format"');
    expect(source).toContain("<MatchPeriodCreateSection");
    expect(source).toContain("<MatchPeriodFormatSection");
    expect(source).toContain("stayOnPage");
  });

  it("owns the dialogs outside the popover so they survive it closing", () => {
    const popoverEnd = source.indexOf("</Popover>");
    expect(source.indexOf("<InlineFormDialog")).toBeGreaterThan(popoverEnd);
    expect(source).toContain("setMenuOpen(false)");
    expect(source).toContain("setDialog(item)");
  });

  it("does not steal focus back from a dialog it just opened", () => {
    expect(source).toContain("finalFocus={dialog === null}");
  });

  it("keeps the fallback link to the add-period page", () => {
    expect(source).toContain("/matches/${matchId}/periods/new");
  });

  it("anchors to the trigger's end and flips near the viewport edge", () => {
    expect(source).toContain('align="end"');
    expect(source).toContain("max-w-[calc(100vw-2rem)]");
  });
});
