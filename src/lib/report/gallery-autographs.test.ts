import { describe, expect, it } from "vitest";
import {
  GALLERY_CARDS_PER_PAGE,
  GALLERY_COLUMNS,
  GALLERY_ROWS_PER_PAGE,
  PLAYER_CARD_ASPECT,
} from "@/lib/report/card-path";
import { galleryEntries } from "@/lib/report/gallery";
import { chunkAtLeastOne } from "@/lib/report/paginate";
import {
  samplePlayers,
  sampleCoaches,
  sampleReportData,
  sampleVenues,
} from "@/lib/report/sample";
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_TITLES,
  VENUES_PER_PAGE,
} from "@/lib/report/sections";
import { emptySeasonAwards } from "@/lib/report/season-awards";
import { sortSquad } from "@/lib/report/summary";

describe("report section order", () => {
  it("puts Autographs straight after Looking ahead", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("autographs")).toBe(order.indexOf("lookingAhead") + 1);
  });

  it("puts a blank inside cover straight after the cover", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("coverInside")).toBe(order.indexOf("cover") + 1);
  });

  it("puts the team info on page 3, straight after the inside cover", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("teamInfo")).toBe(order.indexOf("coverInside") + 1);
    expect(order.indexOf("teamInfo")).toBe(2);
  });

  it("puts the sections in the printed order", () => {
    expect(REPORT_SECTION_ORDER).toEqual([
      "cover",
      "coverInside",
      "teamInfo",
      "coachNotes",
      "glance",
      "numbers",
      "competitions",
      "gallery",
      "venues",
      "results",
      "records",
      "lookingAhead",
      "autographs",
    ]);
  });

  it("puts the competitions after the numbers and before the gallery", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("competitions")).toBe(order.indexOf("numbers") + 1);
    expect(order.indexOf("gallery")).toBe(order.indexOf("competitions") + 1);
  });

  it("puts the results after the venues and before the awards", () => {
    const order: readonly string[] = REPORT_SECTION_ORDER;
    expect(order.indexOf("results")).toBe(order.indexOf("venues") + 1);
    expect(order.indexOf("records")).toBe(order.indexOf("results") + 1);
  });

  it("calls the records page Awards", () => {
    expect(REPORT_SECTION_TITLES.records).toBe("Awards");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("Records");
  });

  it("lists every section once", () => {
    expect(new Set(REPORT_SECTION_ORDER).size).toBe(
      REPORT_SECTION_ORDER.length,
    );
  });

  it("starts with the cover", () => {
    expect(REPORT_SECTION_ORDER[0]).toBe("cover");
  });

  it("names the squad section Player Gallery and adds Autographs", () => {
    expect(REPORT_SECTION_TITLES.gallery).toBe("Player Gallery");
    expect(REPORT_SECTION_TITLES.autographs).toBe("Autographs");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("The squad");
    expect(Object.values(REPORT_SECTION_TITLES)).not.toContain("Squad");
  });

  it("gives every section except the cover pages a title", () => {
    for (const id of REPORT_SECTION_ORDER) {
      if (id === "cover" || id === "coverInside") continue;
      expect(REPORT_SECTION_TITLES).toHaveProperty(id);
    }
  });
});

describe("gallery paging", () => {
  it("fits three columns by three rows on a page", () => {
    expect(GALLERY_COLUMNS).toBe(3);
    expect(GALLERY_ROWS_PER_PAGE).toBe(3);
    expect(GALLERY_CARDS_PER_PAGE).toBe(9);
  });

  it("keeps the 4:5 card shape", () => {
    expect(PLAYER_CARD_ASPECT).toEqual({ width: 4, height: 5 });
  });

  it("keeps a squad of nine on one page", () => {
    const squad = samplePlayers().slice(0, 9);
    const pages = chunkAtLeastOne(squad, GALLERY_CARDS_PER_PAGE);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(9);
  });

  it("runs a large squad onto the next page without losing anyone", () => {
    const squad = Array.from({ length: 21 }, (_, i) => ({
      ...samplePlayers()[0]!,
      id: `p${i}`,
      shirtNumber: i + 1,
    }));
    const pages = chunkAtLeastOne(sortSquad(squad), GALLERY_CARDS_PER_PAGE);
    expect(pages.map((page) => page.length)).toEqual([9, 9, 3]);
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
        seasonAwards: emptySeasonAwards("c"),
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

describe("gallery entries", () => {
  const data = { coaches: sampleCoaches(), players: samplePlayers() };

  it("puts every coach before every player", () => {
    const entries = galleryEntries(data);
    const kinds = entries.map((e) => e.kind);
    expect(kinds.slice(0, data.coaches.length)).toEqual(
      data.coaches.map(() => "coach"),
    );
    expect(kinds.slice(data.coaches.length)).toEqual(
      data.players.map(() => "player"),
    );
  });

  it("starts with the head coach, then the other coaches", () => {
    const [first, ...rest] = galleryEntries(data).filter(
      (e) => e.kind === "coach",
    );
    expect(first!.label).toBe("Sam Whitfield, Head Coach");
    expect(rest.map((e) => e.label)).toEqual([
      "Dan Mercer, Goalkeeping Coach",
      "Priya Raman, Assistant Coach",
    ]);
  });

  it("orders the players by shirt number after the coaches", () => {
    const players = galleryEntries(data).filter((e) => e.kind === "player");
    expect(players[0]!.card).toMatchObject({ shirtNumber: 1 });
    expect(players.at(-1)!.card).toMatchObject({ shirtNumber: null });
  });

  it("keeps every card once, with unique ids", () => {
    const entries = galleryEntries(data);
    expect(entries).toHaveLength(data.coaches.length + data.players.length);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it("works with no coaches, or no players", () => {
    expect(
      galleryEntries({ coaches: [], players: samplePlayers() }),
    ).toHaveLength(samplePlayers().length);
    expect(
      galleryEntries({ coaches: sampleCoaches(), players: [] }),
    ).toHaveLength(sampleCoaches().length);
    expect(galleryEntries({ coaches: [], players: [] })).toEqual([]);
  });

  it("leaves out players with no league or cup match, but keeps the coaches", () => {
    const players = samplePlayers().map((p, i) =>
      i === 0 ? { ...p, appearances: 0 } : p,
    );
    const entries = galleryEntries({ coaches: sampleCoaches(), players });
    const ids = entries.map((e) => e.id);
    expect(ids).not.toContain(`player-${players[0]!.id}`);
    expect(entries.filter((e) => e.kind === "player")).toHaveLength(
      players.length - 1,
    );
    expect(entries.filter((e) => e.kind === "coach")).toHaveLength(
      sampleCoaches().length,
    );
  });

  it("has no player cards when nobody has played a league or cup match", () => {
    const players = samplePlayers().map((p) => ({ ...p, appearances: 0 }));
    expect(galleryEntries({ coaches: [], players })).toEqual([]);
  });

  it("counts coaches towards the cards on a page", () => {
    const pages = chunkAtLeastOne(galleryEntries(data), GALLERY_CARDS_PER_PAGE);
    expect(pages.flat()).toHaveLength(
      data.coaches.length + data.players.length,
    );
    // 3 coaches + 16 sample players = 19 cards: two full pages and one spare.
    expect(pages.map((page) => page.length)).toEqual([9, 9, 1]);
  });
});
