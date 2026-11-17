import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("match detail page", () => {
  it("opens match edit in a dialog", () => {
    expect(source).toContain("EditMatchDialog");
    expect(source).not.toContain("href={`/matches/${match.id}/edit`}");
    expect(source).toContain("meetupTime={match.meetup_time}");
  });

  it("keeps share, edit and delete in the summary card with 44px touch targets", () => {
    expect(source).toContain("{matchCardShare(match)}");
    expect(source).toContain("<EditMatchDialog");
    expect(source).toContain('triggerClassName="size-11 sm:size-9"');
    expect(source).toContain("Delete match vs ${opponentName}");
    expect(source).toContain("deleteMatchAction.bind(null, match.id)");
  });

  it("passes the real home/away, status and score to the summary card", () => {
    expect(source).toContain("homeAway={match.home_away}");
    expect(source).toContain("status={match.status}");
    expect(source).toContain("goalsFor={goalsFor}");
    expect(source).toContain("goalsAgainst={goalsAgainst}");
    expect(source).toContain("venueId={match.venue?.id ?? null}");
  });

  it("keeps the Player of the Match section for in-progress and played matches only", () => {
    const section = source.slice(
      source.indexOf("{allowsEvents ? (\n        <>"),
    );
    expect(section).toContain("<MatchPlayersOfTheMatchSection");
    expect(source).toContain("canEdit={canEditPlayerOfTheMatch}");
    expect(source).toContain(
      "coachPlayerOfTheMatchId={match.player_of_the_match_id}",
    );
    expect(source).toContain(
      "playersPlayerOfTheMatchId={match.players_player_of_the_match_id}",
    );
  });

  it("uses compact sections and a tighter hero stack on phones", () => {
    expect(source).toContain('<Section title="Goals" compact>');
    expect(source).toContain('<Section title="Match-day squad" compact>');
    expect(source).toContain('<Section title="Cards" compact>');
    expect(source).toContain('<div className="space-y-3">\n        <MatchHero');
    // Major sections stay clearly separated.
    expect(source).toContain('pageBodyClassName("space-y-6")');
  });

  it("only offers the match-period options to editors", () => {
    expect(source).toContain("showAddPeriod={canEdit}");
    expect(source).toContain("addPeriod={\n              canEdit");
    expect(source).toContain(
      "changeFormat={canEdit ? { periods: formatChangePeriods } : null}",
    );
  });

  it("does not touch the pitch background or page width", () => {
    expect(source).not.toContain("pitch-pattern");
    expect(source).toContain("pageBodyClassName");
  });
});
