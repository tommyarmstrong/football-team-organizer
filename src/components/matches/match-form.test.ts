import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-form.tsx"),
  "utf8",
);

function fieldIds(markup: string): string[] {
  return [...markup.matchAll(/htmlFor="([^"]+)"/g)].map((match) => match[1]);
}

describe("MatchForm", () => {
  it("orders fixture fields from opponent through club notes", () => {
    expect(fieldIds(source)).toEqual([
      "opponent_name",
      "competition_id",
      "stage",
      "date",
      "kickoff_time",
      "meetup_time",
      "home_away",
      "venue_id",
      "periods",
      "status",
      "match_day_squad_count",
      "player_of_the_match_id",
      "players_player_of_the_match_id",
      "notes",
      "club_notes",
    ]);
  });

  it("shows stage only for cups and tournaments", () => {
    expect(source).toContain("competitionHasMatchStage");
    expect(source).toContain("{showStage ? (");
  });

  it("lets a tournament match override the shared schedule", () => {
    expect(source).toContain("applyTournamentMatchFields");
    expect(source).toContain("You can change them for this match.");
    expect(source).not.toContain("dateLocked");
    expect(source).not.toContain("meetupLocked");
    expect(source).not.toContain("homeAwayLocked");
    expect(source).not.toContain("venueLocked");
    expect(source).not.toContain("periodsLocked");
    expect(source).not.toContain("readOnly={dateLocked}");
  });

  it("keeps date, kick-off, and meet-up inside the dialog width", () => {
    for (const id of ["date", "kickoff_time", "meetup_time"]) {
      const index = source.indexOf(`htmlFor="${id}"`);
      const field = source.slice(Math.max(0, index - 80), index);
      expect(field).toContain("overflow-hidden");
    }
  });
});
