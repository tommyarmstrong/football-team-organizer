import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () =>
  (await import("@/components/matches/match-card-test-utils")).nextLinkMock(),
);
vi.mock("@/components/postcards/match-card-share", () => ({
  MatchCardShare: () => null,
}));

import { createElement, type ReactElement } from "react";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { MatchStatus } from "@/lib/supabase/database.types";
import { matchCompetitionLabel } from "@/lib/format";
import { renderCard } from "@/components/matches/match-card-test-utils";
import { MatchHero } from "@/components/matches/match-hero";
import {
  MatchSummaryCard,
  matchCardShare,
} from "@/components/matches/match-summary-card";

function match(
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    id: "match-1",
    opponent_name: "France",
    home_away: "home",
    status: "scheduled",
    goals_for: 0,
    goals_against: 0,
    date: "2026-11-15",
    kickoff_time: "20:08:00",
    meetup_time: "19:08:00",
    is_friendly: false,
    stage: null,
    venue: { id: "venue-1", name: "Anfield" },
    competition: {
      id: "comp-1",
      name: "North London League",
      display_name: "North London League",
      kind: "league",
    },
    ...overrides,
  } as MatchWithRelations;
}

function cardProps(element: ReactElement) {
  return element.props as {
    href: string;
    status: string;
    venueName: string | null;
    venueId?: string | null;
    meetupTime: string | null;
    kickoffTime: string | null;
    competitionName: string | null;
    actions?: ReactElement;
  };
}

describe("MatchSummaryCard", () => {
  it("uses the scheduled fixture fields and the fixture share control", () => {
    const props = cardProps(
      MatchSummaryCard({ match: match(), teamName: "MGA Select" }),
    );
    expect(props).not.toHaveProperty("size");
    expect(props.venueId).toBeUndefined();
    expect(props.href).toBe("/matches/match-1");
    expect(props.status).toBe("scheduled");
    expect(props.venueName).toBe("Anfield");
    expect(props.meetupTime).toBe("19:08:00");
    expect(props.kickoffTime).toBe("20:08:00");
    expect(props.competitionName).toBe("North London League");
    expect(props.actions?.props).toMatchObject({
      matchId: "match-1",
      kind: "scheduled",
    });
  });

  it("uses the same card and share control for a played result", () => {
    const played = match({
      status: "played",
      goals_for: 2,
      goals_against: 1,
    });
    const props = cardProps(
      MatchSummaryCard({ match: played, teamName: "MGA Select" }),
    );
    expect(props).not.toHaveProperty("size");
    expect(props.href).toBe("/matches/match-1");
    expect(props.status).toBe("played");
    expect(props.actions?.props).toMatchObject({
      matchId: "match-1",
      kind: "played",
    });
    expect(
      (matchCardShare(played) as ReactElement | undefined)?.props,
    ).toMatchObject({
      matchId: "match-1",
      kind: "played",
    });
  });

  it("keeps one card for every other status and shares only when a postcard exists", () => {
    const statuses: MatchStatus[] = ["in_progress", "postponed", "cancelled"];
    for (const status of statuses) {
      const props = cardProps(
        MatchSummaryCard({
          match: match({ status }),
          teamName: "MGA Select",
        }),
      );
      expect(props).not.toHaveProperty("size");
      expect(props.status).toBe(status);
      expect(props.actions).toBeUndefined();
      expect(matchCardShare(match({ status }))).toBeUndefined();
    }
  });
});

describe("MatchSummaryCard rendering", () => {
  it("renders the same card as the match page", () => {
    const statuses: MatchStatus[] = [
      "scheduled",
      "in_progress",
      "played",
      "postponed",
      "cancelled",
    ];
    for (const status of statuses) {
      const fixture = match({
        status,
        goals_for: 2,
        goals_against: 1,
        home_away: status === "played" ? "away" : "home",
      });
      const summary = renderCard(
        createElement(MatchSummaryCard, {
          match: fixture,
          teamName: "MGA Select",
        }),
      );
      const hero = renderCard(
        createElement(MatchHero, {
          teamName: "MGA Select",
          opponentName: fixture.opponent_name,
          homeAway: fixture.home_away,
          status: fixture.status,
          goalsFor: fixture.goals_for,
          goalsAgainst: fixture.goals_against,
          competitionName: matchCompetitionLabel(fixture),
          date: fixture.date,
          kickoffTime: fixture.kickoff_time,
          meetupTime: fixture.meetup_time,
          venueName: fixture.venue?.name ?? null,
          href: `/matches/${fixture.id}`,
          actions: matchCardShare(fixture),
        }),
      );
      expect(summary).toBe(hero);
    }
  });
});

describe("match page share", () => {
  it("uses the shared match card share control", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "../../app/(app)/matches/[id]/page.tsx"),
      "utf8",
    );
    expect(source).toContain("matchCardShare(match)");
    expect(source).not.toContain("SharePostcardButton");
    expect(source).not.toContain("buildMatchPostcardPayload");
  });
});
