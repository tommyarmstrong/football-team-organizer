import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PERIOD_PAGE_SECTION_TITLES } from "@/components/matches/match-period-edit-section";

const root = path.resolve(import.meta.dirname, "../../..");

function readSrc(relativePath: string) {
  return readFileSync(path.join(root, "src", relativePath), "utf8");
}

describe("PERIOD_PAGE_SECTION_TITLES", () => {
  it("matches the match-page section heading style", () => {
    expect(PERIOD_PAGE_SECTION_TITLES.starters).toBe("Starting players");
    expect(PERIOD_PAGE_SECTION_TITLES.goals).toBe("Goals");
  });
});

describe("period page layout", () => {
  it("drops the outer Card wrapper on the edit and create pages", () => {
    const editPage = readSrc(
      "app/(app)/matches/[id]/periods/[periodId]/page.tsx",
    );
    const createPage = readSrc("app/(app)/matches/[id]/periods/new/page.tsx");

    expect(editPage).not.toContain("@/components/ui/card");
    expect(editPage).not.toMatch(/\bCard\b/);
    expect(createPage).not.toContain("@/components/ui/card");
    expect(createPage).not.toMatch(/\bCard\b/);
  });

  it("uses Section headings for starters and goals on the edit section", () => {
    const editSection = readSrc(
      "components/matches/match-period-edit-section.tsx",
    );
    expect(editSection).toContain('from "@/components/shared/section"');
    expect(editSection).toContain(
      "Section title={PERIOD_PAGE_SECTION_TITLES.starters}",
    );
    expect(editSection).toContain(
      "Section title={PERIOD_PAGE_SECTION_TITLES.goals}",
    );
    expect(editSection).not.toContain(
      '<h3 className="text-sm font-medium">Starting players</h3>',
    );
    expect(editSection).not.toContain(
      '<h3 className="text-sm font-medium">Goals</h3>',
    );
  });

  it("uses a Section heading for starters on the create section", () => {
    const createSection = readSrc(
      "components/matches/match-period-create-section.tsx",
    );
    expect(createSection).toContain('from "@/components/shared/section"');
    expect(createSection).toContain(
      "Section title={PERIOD_PAGE_SECTION_TITLES.starters}",
    );
    expect(createSection).not.toContain(
      '<h3 className="text-sm font-medium">Starting players</h3>',
    );
  });
});
