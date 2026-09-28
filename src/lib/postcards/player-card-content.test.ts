import { describe, expect, it } from "vitest";
import {
  pickPlayerCardTeam,
  playerCardCaption,
  playerCardFileName,
  playerCardNames,
  playerPositionLabel,
} from "@/lib/postcards/player-card-content";
import { teamFixture } from "@/test/fixtures";

describe("playerPositionLabel", () => {
  it("expands the position codes", () => {
    expect(playerPositionLabel("GK")).toBe("Goalkeeper");
    expect(playerPositionLabel("DEF")).toBe("Defender");
    expect(playerPositionLabel("MID")).toBe("Midfielder");
    expect(playerPositionLabel("FWD")).toBe("Forward");
    expect(playerPositionLabel("fwd")).toBe("Forward");
  });

  it("keeps unknown positions as recorded and hides blanks", () => {
    expect(playerPositionLabel(" Winger ")).toBe("Winger");
    expect(playerPositionLabel("  ")).toBeNull();
    expect(playerPositionLabel(null)).toBeNull();
    expect(playerPositionLabel(undefined)).toBeNull();
  });
});

describe("playerCardNames", () => {
  const player = { first_name: "Maya", last_name: "Hall" };

  it("never includes a surname for youth and mixed teams", () => {
    for (const gender of ["boys", "girls", "mixed"] as const) {
      expect(playerCardNames(player, gender)).toEqual({
        firstName: "Maya",
        lastName: null,
      });
    }
  });

  it("includes the surname for adult teams", () => {
    for (const gender of ["men", "women"] as const) {
      expect(playerCardNames(player, gender)).toEqual({
        firstName: "Maya",
        lastName: "Hall",
      });
    }
  });

  it("falls back when names are blank", () => {
    expect(
      playerCardNames({ first_name: " ", last_name: "" }, "women"),
    ).toEqual({ firstName: "Player", lastName: null });
  });
});

describe("playerCardCaption", () => {
  const base = {
    player: { first_name: "Maya", last_name: "Hall" },
    gender: "girls" as const,
    shirtNumber: 7,
    clubName: "Mill Green",
    teamName: "U11 Girls",
    seasonLabel: "2025/26",
    positionLabel: "Forward",
    stats: { appearances: 14, goals: 9, assists: 4, potm: 2 },
  };

  it("uses first name and shirt number with no surname on youth teams", () => {
    const caption = playerCardCaption(base);
    expect(caption).toBe(
      [
        "Maya 7 · Forward",
        "Mill Green · U11 Girls · 2025/26",
        "",
        "Appearances: 14",
        "Goals: 9",
        "Assists: 4",
        "Coach's POTM: 2",
      ].join("\n"),
    );
    expect(caption).not.toContain("Hall");
  });

  it("uses the full name on adult teams", () => {
    const caption = playerCardCaption({ ...base, gender: "women" });
    expect(caption.split("\n")[0]).toBe("7 Maya Hall · Forward");
  });

  it("omits empty stats and a missing position or shirt number", () => {
    const caption = playerCardCaption({
      ...base,
      shirtNumber: null,
      positionLabel: null,
      stats: { appearances: 0, goals: 0, assists: 0, potm: 0 },
    });
    expect(caption).toBe(
      ["Maya", "Mill Green · U11 Girls · 2025/26", "", "Appearances: 0"].join(
        "\n",
      ),
    );
  });

  it("skips blank club names", () => {
    const caption = playerCardCaption({ ...base, clubName: " " });
    expect(caption.split("\n")[1]).toBe("U11 Girls · 2025/26");
  });
});

describe("playerCardFileName", () => {
  it("slugs the first name, team, and season", () => {
    expect(
      playerCardFileName({
        firstName: "Maya",
        teamName: "U11 Girls",
        seasonLabel: "2025/26",
      }),
    ).toBe("maya-u11-girls-2025-26-player-card.png");
  });
});

describe("pickPlayerCardTeam", () => {
  const current = teamFixture({ id: "current", name: "U11 Blues" });
  const other = teamFixture({ id: "other", name: "U12 Reds" });
  const archived = teamFixture({
    id: "archived",
    name: "U10 Blues",
    archived_at: "2025-06-01T00:00:00Z",
  });
  const teams = [archived, other, current];

  it("returns null when there are no teams", () => {
    expect(pickPlayerCardTeam([])).toBeNull();
  });

  it("honours an explicit request, even for an archived team", () => {
    expect(pickPlayerCardTeam(teams, { requestedTeamId: "archived" })).toBe(
      archived,
    );
  });

  it("returns null for a requested team that is not allowed", () => {
    expect(pickPlayerCardTeam(teams, { requestedTeamId: "nope" })).toBeNull();
  });

  it("prefers the viewer's active team", () => {
    expect(pickPlayerCardTeam(teams, { activeTeamId: "other" })).toBe(other);
  });

  it("ignores an active team the player is not on", () => {
    expect(pickPlayerCardTeam(teams, { activeTeamId: "elsewhere" })).toBe(
      current,
    );
  });

  it("prefers teams the player is currently active on", () => {
    expect(pickPlayerCardTeam(teams, { preferredTeamIds: ["other"] })).toBe(
      other,
    );
  });

  it("falls back to display order, current seasons before archived", () => {
    expect(pickPlayerCardTeam(teams)).toBe(current);
    expect(pickPlayerCardTeam([archived])).toBe(archived);
  });
});
