import { describe, expect, it } from "vitest";
import {
  GALLERY_CARDS_PER_PAGE,
  GALLERY_COLUMNS,
  GALLERY_ROWS_PER_PAGE,
  PLAYER_CARD_ASPECT,
} from "@/lib/report/card-path";
import { chunkAtLeastOne } from "@/lib/report/paginate";
import {
  samplePlayers,
  sampleReportData,
  sampleVenues,
} from "@/lib/report/sample";
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_TITLES,
  VENUES_PER_PAGE,
} from "@/lib/report/sections";
import { sortSquad } from "@/lib/report/summary";

describe("report section order", () => {
  it("puts Autographs straight after Looking ahead", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("autographs")).toBe(order.indexOf("lookingAhead") + 1);
  });

  it("puts the team info straight after the cover", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("teamInfo")).toBe(order.indexOf("cover") + 1);
  });

  it("puts venues after competitions and before the gallery", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("venues")).toBeGreaterThan(
      order.indexOf("competitions"),
    );
    expect(order.indexOf("venues")).toBeLessThan(order.indexOf("gallery"));
  });

  it("renames Awards to Records", () => {
    expect(REPORT_SECTION_TITLES.records).toBe("Records");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("Awards");
    expect(REPORT_SECTION_ORDER).not.toContain("awards");
  });

  it("lists every section once", () => {
    expect(new Set(REPORT_SECTION_ORDER).size).toBe(
      REPORT_SECTION_ORDER.length,
    );
  });

  it("starts with the cover and keeps the gallery before the awards", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order[0]).toBe("cover");
    expect(order.indexOf("gallery")).toBeLessThan(order.indexOf("records"));
  });

  it("names the squad section Player Gallery and adds Autographs", () => {
    expect(REPORT_SECTION_TITLES.gallery).toBe("Player Gallery");
    expect(REPORT_SECTION_TITLES.autographs).toBe("Autographs");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("The squad");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("Squad");
  });

  it("gives every section except the cover a title", () => {
    for (const id of REPORT_SECTION_ORDER) {
      if (id === "cover") continue;
      expect(REPORT_SECTION_TITLES).toHaveProperty(id);
    }
  });
});

describe("gallery paging", () => {
  it("fits four columns by four rows on a page", () => {
    expect(GALLERY_COLUMNS).toBe(4);
    expect(GALLERY_ROWS_PER_PAGE).toBe(4);
    expect(GALLERY_CARDS_PER_PAGE).toBe(16);
  });

  it("keeps the 4:5 card shape", () => {
    expect(PLAYER_CARD_ASPECT).toEqual({ width: 4, height: 5 });
  });

  it("keeps a small squad on one page", () => {
    const pages = chunkAtLeastOne(samplePlayers(), GALLERY_CARDS_PER_PAGE);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(samplePlayers().length);
  });

  it("runs a large squad onto the next page without losing anyone", () => {
    const squad = Array.from({ length: 21 }, (_, i) => ({
      ...samplePlayers()[0]!,
      id: `p${i}`,
      shirtNumber: i + 1,
    }));
    const pages = chunkAtLeastOne(sortSquad(squad), GALLERY_CARDS_PER_PAGE);
    expect(pages.map((page) => page.length)).toEqual([16, 5]);
    expect(pages.flat().map((p) => p.id)).toHaveLength(21);
  });

  it("still yields a page for an empty squad", () => {
    expect(chunkAtLeastOne([], GALLERY_CARDS_PER_PAGE)).toEqual([[]]);
  });

  it("orders cards by shirt number", () => {
    const sorted = sortSquad(samplePlayers());
    expect(sorted[0]!.shirtNumber).toBe(1);
    expect(sorted.at(-1)!.shirtNumber).toBeNull();
  });
});

describe("sample gallery data", () => {
  it("gives every sample player a card and first name", () => {
    for (const player of samplePlayers()) {
      expect(player.card.playerId).toBe(player.id);
      expect(player.card.firstName).toBe(player.name.split(" ")[0]);
      expect(player.firstName).toBe(player.card.firstName);
    }
  });

  it("carries the club colour onto every card", () => {
    const data = sampleReportData(
      {
        coachNotes: { expectedPath: "a", markdown: null },
        lookingAhead: { expectedPath: "b", markdown: null },
      },
      { colour: "#FFD400" },
    );
    expect(data.players.every((p) => p.card.clubColour === "#FFD400")).toBe(
      true,
    );
  });

  it("builds a card with a first name only", () => {
    const player = samplePlayers().find((p) => p.id === "sample-player-9")!;
    expect(player.card).toMatchObject({
      firstName: "Isaac",
      lastName: null,
      shirtNumber: 9,
      positionLabel: "Forward",
    });
    expect(player.card.stats.goals).toBe(18);
    const { wins, draws, losses, appearances } = player.card.stats;
    expect(wins + draws + losses).toBe(appearances);
  });
});

describe("venue paging", () => {
  it("fits the sample venues on one page", () => {
    expect(chunkAtLeastOne(sampleVenues(), VENUES_PER_PAGE)).toHaveLength(1);
  });

  it("runs many venues onto further pages without losing any", () => {
    const venues = Array.from({ length: VENUES_PER_PAGE + 2 }, (_, i) => ({
      ...sampleVenues()[0]!,
      id: `v${i}`,
    }));
    const pages = chunkAtLeastOne(venues, VENUES_PER_PAGE);
    expect(pages.map((page) => page.length)).toEqual([VENUES_PER_PAGE, 2]);
  });

  it("still yields a page when no venue was recorded", () => {
    expect(chunkAtLeastOne([], VENUES_PER_PAGE)).toEqual([[]]);
  });
});
