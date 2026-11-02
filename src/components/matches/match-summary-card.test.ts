import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { MatchStatus } from "@/lib/supabase/database.types";
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
    size: string;
    href: string;
    status: string;
    venueName: string | null;
    meetupTime: string | null;
    kickoffTime: string | null;
    competitionName: string | null;
    actions?: ReactElement;
  };
}

describe("MatchSummaryCard", () => {
  it("uses one card size, the scheduled fixture fields, and the fixture share control", () => {
    const props = cardProps(
      MatchSummaryCard({ match: match(), teamName: "MGA Select" }),
    );
    expect(props.size).toBe("card");
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
    expect(props.size).toBe("card");
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
      expect(props.size).toBe("card");
      expect(props.status).toBe(status);
      expect(props.actions).toBeUndefined();
      expect(matchCardShare(match({ status }))).toBeUndefined();
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
