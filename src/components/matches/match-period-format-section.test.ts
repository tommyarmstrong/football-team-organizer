import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extraTimeUnit,
  periodFormatChangeLabel,
  periodFormatChangeTarget,
} from "@/components/matches/match-period-format-section";

const root = path.resolve(import.meta.dirname, "../../..");

function readSrc(relativePath: string) {
  return readFileSync(path.join(root, "src", relativePath), "utf8");
}

const names = (...list: string[]) => list.map((name) => ({ name }));

describe("periodFormatChangeTarget", () => {
  it("offers halves for a quarters match and quarters for a halves match", () => {
    expect(
      periodFormatChangeTarget(
        names("Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"),
      ),
    ).toBe("halves");
    expect(periodFormatChangeTarget(names("First half", "Second half"))).toBe(
      "quarters",
    );
  });

  it("offers a change when a halves match also has extra time", () => {
    expect(
      periodFormatChangeTarget(
        names("First half", "Second half", "Extra time 1", "Extra time 2"),
      ),
    ).toBe("quarters");
  });

  it("offers nothing for single-period, empty or mixed matches", () => {
    expect(periodFormatChangeTarget([])).toBeNull();
    expect(periodFormatChangeTarget(names("Single period match"))).toBeNull();
    expect(
      periodFormatChangeTarget(names("Quarter 1", "Second half")),
    ).toBeNull();
  });
});

describe("labels", () => {
  it("labels the button after the format it switches to", () => {
    expect(periodFormatChangeLabel("halves")).toBe("Change to halves");
    expect(periodFormatChangeLabel("quarters")).toBe("Change to quarters");
  });

  it("words the extra time checkbox for the target format", () => {
    expect(extraTimeUnit("quarters", 1)).toBe("a quarter");
    expect(extraTimeUnit("quarters", 2)).toBe("quarters");
    expect(extraTimeUnit("halves", 1)).toBe("a half");
    expect(extraTimeUnit("halves", 2)).toBe("halves");
  });
});

describe("format change wiring", () => {
  it("submits the target and the extra time choice to the action", () => {
    const section = readSrc(
      "components/matches/match-period-format-section.tsx",
    );
    expect(section).toContain("changePeriodFormatAction.bind(null, matchId)");
    expect(section).toContain('name="target"');
    expect(section).toContain('name="use_extra_time"');
    expect(section).toContain("planFormatChange(");
    expect(section).toContain("planPreviewRows(");
  });

  it("adds a Change period format dialog next to Add goal and Add period", () => {
    const goals = readSrc("components/matches/match-goals-section.tsx");
    expect(goals).toContain('title="Change period format"');
    expect(goals).toContain("periodFormatChangeLabel(changeFormatTarget)");
    expect(goals).toContain("changeFormatTarget && changeFormat");
    expect(goals).toContain("<MatchPeriodFormatSection");
  });

  it("only passes the format change to editors on the match page", () => {
    const page = readSrc("app/(app)/matches/[id]/page.tsx");
    expect(page).toContain(
      "changeFormat={canEdit ? { periods: formatChangePeriods } : null}",
    );
    expect(page).toContain("starterCount: period.starter_player_ids.length");
    expect(page).toContain("goal.period_id === period.id");
  });
});
