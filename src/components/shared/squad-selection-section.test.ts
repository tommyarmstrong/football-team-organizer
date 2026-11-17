import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: unknown;
    href: string;
    className?: string;
  }) => createElement("a", { href, className }, children as never),
}));
vi.mock("@/lib/match-players/actions", () => ({
  saveMatchSquadAction: { bind: () => vi.fn() },
}));

import type { RosterPlayer } from "@/lib/data/players";
import { MatchSquadSection } from "@/components/matches/match-squad-section";
import {
  SquadSelectionSection,
  sameSquadSelection,
  squadRemovalNeedsConfirmation,
  squadRowClassName,
  type SquadSelectionLabels,
} from "@/components/shared/squad-selection-section";

const squadSelection = readFileSync(
  path.join(import.meta.dirname, "squad-selection-section.tsx"),
  "utf8",
);
const tournamentSquad = readFileSync(
  path.join(
    import.meta.dirname,
    "..",
    "competitions",
    "tournament-squad-section.tsx",
  ),
  "utf8",
);
const matchSquad = readFileSync(
  path.join(import.meta.dirname, "..", "matches", "match-squad-section.tsx"),
  "utf8",
);

describe("sameSquadSelection", () => {
  it("ignores order and treats a different membership as a change", () => {
    expect(sameSquadSelection(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameSquadSelection(["a", "b"], ["a"])).toBe(false);
    expect(sameSquadSelection(["a"], ["a", "b"])).toBe(false);
    expect(sameSquadSelection([], [])).toBe(true);
  });
});

describe("tournament squad save", () => {
  it("writes the full squad once on Save", () => {
    expect(tournamentSquad).toContain("saveOnSubmit");
    expect(squadSelection).toContain('name="player_id"');
    expect(squadSelection).toContain("Saving…");
    expect(squadSelection).toContain("if (saveOnSubmit) return;");
    expect(matchSquad).not.toContain("saveOnSubmit");
  });
});

function rosterPlayer(
  id: string,
  first: string,
  last: string,
  shirt: number | null,
): RosterPlayer {
  return {
    id,
    person_id: `person-${id}`,
    first_name: first,
    last_name: last,
    shirt_number: shirt,
    active: true,
  } as RosterPlayer;
}

const labels: SquadSelectionLabels = {
  emptyTitle: "No squad",
  emptyDescription: "None yet",
  noRosterTitle: "No roster",
  noRosterDescription: "Add players",
  noneSelected: "Nobody selected",
  allSelected: "Everyone selected",
  squadName: "match-day squad",
  addInputId: "add_player",
};

const roster = [
  rosterPlayer("p1", "Alex", "Smith", 7),
  rosterPlayer("p2", "Sam", "Lee", null),
  rosterPlayer(
    "p3",
    "Bartholomew-Maximilian",
    "Featherstonehaugh-Cholmondeley",
    10,
  ),
  rosterPlayer("p4", "Jo", "Ng", 4),
];

function renderSquad(
  props: Partial<Parameters<typeof SquadSelectionSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(SquadSelectionSection, {
      roster,
      selectedPlayerIds: ["p3", "p1", "p2"],
      canEdit: true,
      saveAction: vi.fn(),
      labels,
      ...props,
    }),
  );
}

describe("squad row helpers", () => {
  it("only asks for removal confirmation on compact, save-on-every-change squads", () => {
    expect(
      squadRemovalNeedsConfirmation({ compact: true, saveOnSubmit: false }),
    ).toBe(true);
    expect(
      squadRemovalNeedsConfirmation({ compact: true, saveOnSubmit: true }),
    ).toBe(false);
    expect(
      squadRemovalNeedsConfirmation({ compact: false, saveOnSubmit: false }),
    ).toBe(false);
  });

  it("makes compact rows 52px and leaves the default row alone", () => {
    expect(squadRowClassName(true)).toContain("min-h-[3.25rem]");
    expect(squadRowClassName(false)).toBeUndefined();
  });
});

describe("compact squad list", () => {
  const html = renderSquad({ compact: true });

  it("shows shirt-number markers and names in roster order, not selection order", () => {
    const positions = ["Alex Smith", "Sam Lee", "Bartholomew-Maximilian"].map(
      (name) => html.indexOf(name),
    );
    expect(positions.every((position) => position > -1)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain(">7</span>");
    expect(html).toContain(">10</span>");
    // No shirt number falls back to a dash.
    expect(html).toContain(">—</span>");
  });

  it("does not list players outside the squad in the rows", () => {
    expect(html.match(/<li/g)).toHaveLength(3);
    expect(html).not.toContain("Jo Ng</span>");
  });

  it("uses 52px rows with 44px remove targets", () => {
    expect(html).toContain("min-h-[3.25rem]");
    // One 44px remove button per row.
    expect(html.match(/ size-11"/g)).toHaveLength(3);
  });

  it("keeps an accessible remove label per player", () => {
    expect(html).toContain(
      'aria-label="Remove Alex Smith from match-day squad"',
    );
    expect(html).toContain('aria-label="Remove Sam Lee from match-day squad"');
  });

  it("truncates long names so they cannot push the remove control out", () => {
    expect(html).toContain("min-w-0 flex-1 truncate");
    expect(html).toContain("Featherstonehaugh-Cholmondeley");
  });

  it("offers only players not yet selected in the add control", () => {
    expect(html).toContain('id="add_player"');
    expect(html).toContain('for="add_player"');
    expect(html).toContain(">Add<");
    // Add control sits on the same row as its input on phones.
    expect(html).toContain("items-end gap-2");
  });

  it("is the variant used on the match page", () => {
    const matchPage = renderToStaticMarkup(
      createElement(MatchSquadSection, {
        matchId: "match-1",
        roster,
        selectedPlayerIds: ["p1"],
        canEdit: true,
      }),
    );
    expect(matchPage).toContain("min-h-[3.25rem]");
    expect(matchPage).toContain("from match-day squad");
  });
});

describe("default (non-compact) squad list", () => {
  it("keeps the original 36px remove target and row height", () => {
    const html = renderSquad();
    expect(html.match(/ size-9"/g)).toHaveLength(3);
    expect(html).not.toContain("min-h-[3.25rem]");
    expect(html).not.toContain(" size-11");
  });
});

describe("read-only squad list", () => {
  it("lists players with links but no controls", () => {
    const html = renderSquad({ canEdit: false, compact: true });
    expect(html).toContain('href="/people/person-p1"');
    expect(html).toContain("Alex Smith");
    expect(html).not.toContain("Remove");
    expect(html).not.toContain("<form");
  });

  it("shows the empty state when nobody is selected", () => {
    const html = renderSquad({ canEdit: false, selectedPlayerIds: [] });
    expect(html).toContain("No squad");
  });
});

describe("squad removal guard", () => {
  it("asks to confirm before removing from a compact squad", () => {
    expect(squadSelection).toContain("setConfirmRemoveId(player.id)");
    expect(squadSelection).toContain("Confirm remove");
    expect(squadSelection).toContain("setConfirmRemoveId(null)");
    expect(squadSelection).toContain("autoFocus");
  });

  it("still persists add and remove through the same save action", () => {
    expect(squadSelection).toContain('formData.append("player_id", id)');
    expect(squadSelection).toContain("formAction(formData)");
    expect(squadSelection).toContain("persist([...selectedIds, playerId])");
  });
});
