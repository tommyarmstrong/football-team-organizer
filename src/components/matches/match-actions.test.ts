import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () =>
  (await import("@/components/matches/match-card-test-utils")).nextLinkMock(),
);
vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  usePathname: () => "/",
}));
vi.mock("@/lib/matches/actions", () => ({ updateMatchStatusAction: vi.fn() }));
vi.mock("@/lib/match-periods/actions", () => ({}));

import {
  MatchActions,
  STATUS_CONFIRMATIONS,
  matchOptionEntries,
  matchOptionItemClassName,
} from "@/components/matches/match-actions";
import type { MatchStatus } from "@/lib/supabase/database.types";

const source = readFileSync(
  path.join(import.meta.dirname, "match-actions.tsx"),
  "utf8",
);

const periods = (names: string[]) =>
  names.map((name, index) => ({
    id: `p${index}`,
    name,
    sort_order: index,
    goalCount: 0,
    starterCount: 0,
  }));

function render(status: MatchStatus, periodNames: string[] = []) {
  return renderToStaticMarkup(
    createElement(MatchActions, {
      matchId: "m1",
      status,
      addPeriod: {
        availablePeriodNames: ["Extra time 1"],
        squadPlayers: [],
        defaultStarterPlayerIds: [],
      },
      changeFormat: { periods: periods(periodNames) as never },
    }),
  );
}

describe("matchOptionEntries", () => {
  it("scheduled: Full time, Cancelled, Postponed, then disabled period actions", () => {
    expect(
      matchOptionEntries({ status: "scheduled", changeFormatTarget: null }),
    ).toEqual([
      { kind: "status", status: "played" },
      { kind: "status", status: "cancelled" },
      { kind: "status", status: "postponed" },
      { kind: "add-period", enabled: false },
      { kind: "change-format", enabled: false, target: null },
    ]);
  });

  it("in progress: Scheduled, Cancelled, Postponed, then Add period and Change format", () => {
    expect(
      matchOptionEntries({
        status: "in_progress",
        changeFormatTarget: "quarters",
      }),
    ).toEqual([
      { kind: "status", status: "scheduled" },
      { kind: "status", status: "cancelled" },
      { kind: "status", status: "postponed" },
      { kind: "add-period", enabled: true },
      { kind: "change-format", enabled: true, target: "quarters" },
    ]);
  });

  it("omits Change format in progress when there is nothing to convert", () => {
    const kinds = matchOptionEntries({
      status: "in_progress",
      changeFormatTarget: null,
    }).map((entry) => entry.kind);
    expect(kinds).toEqual(["status", "status", "status", "add-period"]);
  });

  it("played: no status changes, but Add period and Change format stay", () => {
    expect(
      matchOptionEntries({ status: "played", changeFormatTarget: "halves" }),
    ).toEqual([
      { kind: "add-period", enabled: true },
      { kind: "change-format", enabled: true, target: "halves" },
    ]);
    expect(
      matchOptionEntries({ status: "played", changeFormatTarget: null }),
    ).toEqual([{ kind: "add-period", enabled: true }]);
  });

  it("offers nothing for cancelled and postponed matches", () => {
    for (const status of ["cancelled", "postponed"] as const) {
      expect(
        matchOptionEntries({ status, changeFormatTarget: "halves" }),
      ).toEqual([]);
    }
  });
});

describe("MatchActions rendering", () => {
  it("scheduled: Kick off is the primary button, beside Options", () => {
    const html = render("scheduled");
    expect(html).toContain("Kick off");
    expect(html).toContain("Options");
    expect(html.indexOf("Kick off")).toBeLessThan(html.indexOf("Options"));
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).not.toContain("Full time");
  });

  it("in progress: Full time is the primary button, beside Options", () => {
    const html = render("in_progress", ["1st Half", "2nd Half"]);
    expect(html).toContain("Full time");
    expect(html).not.toContain("Kick off");
    expect(html.indexOf("Full time")).toBeLessThan(html.indexOf("Options"));
    expect(html.match(/<button/g)).toHaveLength(2);
  });

  it("played: no primary button, just Options", () => {
    const html = render("played", ["1st Half", "2nd Half"]);
    expect(html).toContain("Options");
    expect(html).not.toContain("Kick off");
    expect(html).not.toContain("Full time");
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it("cancelled and postponed: no buttons at all", () => {
    for (const status of ["cancelled", "postponed"] as const) {
      expect(render(status)).toBe("");
    }
  });

  it("uses the same primary + Options layout as under Goals", () => {
    const html = render("scheduled");
    expect(html).toContain("flex items-center gap-2");
    expect(html).toContain("h-11 min-w-0 flex-1 sm:h-8 sm:flex-none");
    expect(html).toContain("h-11 px-3 sm:h-8 sm:px-2.5");
  });

  it("keeps menu items closed until opened", () => {
    const html = render("in_progress", ["1st Half", "2nd Half"]);
    expect(html).not.toContain("Add period");
    expect(html).not.toContain("Postponed");
  });
});

describe("status confirmations", () => {
  it("asks before cancelling, postponing or moving back to scheduled", () => {
    expect(Object.keys(STATUS_CONFIRMATIONS).sort()).toEqual([
      "cancelled",
      "postponed",
      "scheduled",
    ]);
    expect(STATUS_CONFIRMATIONS.cancelled?.title).toBe("Cancel this match?");
  });

  it("applies Kick off and Full time straight away", () => {
    expect(STATUS_CONFIRMATIONS.in_progress).toBeUndefined();
    expect(STATUS_CONFIRMATIONS.played).toBeUndefined();
  });
});

describe("MatchActions wiring", () => {
  it("gives menu items a 44px touch target and a disabled style", () => {
    expect(matchOptionItemClassName).toContain("min-h-11");
    expect(matchOptionItemClassName).toContain("w-full");
    expect(matchOptionItemClassName).toContain("disabled:opacity-50");
  });

  it("uses the existing popover and button components, with no new dependency", () => {
    expect(source).toContain('from "@/components/ui/popover"');
    expect(source).toContain('from "@/components/ui/button"');
    expect(source).toContain('from "lucide-react"');
  });

  it("keeps the period dialogs and their confirmation", () => {
    expect(source).toContain('title="Add extra time or penalties"');
    expect(source).toContain('title="Change period format"');
    expect(source).toContain("<MatchPeriodCreateSection");
    expect(source).toContain("<MatchPeriodFormatSection");
    expect(source).toContain("stayOnPage");
  });

  it("owns the dialogs outside the popover so they survive it closing", () => {
    const popoverEnd = source.indexOf("</Popover>");
    expect(source.indexOf("<Dialog")).toBeGreaterThan(popoverEnd);
    expect(source.indexOf("<InlineFormDialog")).toBeGreaterThan(popoverEnd);
    expect(source).toContain("setMenuOpen(false)");
  });

  it("does not steal focus back from a dialog it just opened", () => {
    expect(source).toContain("finalFocus={!dialogOpen}");
  });

  it("anchors to the trigger's end and flips near the viewport edge", () => {
    expect(source).toContain('align="end"');
    expect(source).toContain("max-w-[calc(100vw-2rem)]");
  });

  it("goes through the status action, which re-checks the move on the server", () => {
    expect(source).toContain("updateMatchStatusAction(matchId, next)");
  });
});
