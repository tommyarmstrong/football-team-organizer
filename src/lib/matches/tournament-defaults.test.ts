import { describe, expect, it } from "vitest";
import type { Competition } from "@/lib/supabase/database.types";
import {
  applyTournamentMatchFields,
  competitionHasMatchStage,
  resolveMatchStage,
  tournamentScheduleFromForm,
} from "@/lib/matches/tournament-defaults";

const schedule = {
  date: "2026-05-01",
  meetup_time: "08:30",
  home_away: "away" as const,
  venue_id: "venue-form",
  periods: "4" as const,
};

function tournament(
  overrides: Partial<
    Pick<
      Competition,
      | "kind"
      | "date"
      | "meetup_time"
      | "home_away"
      | "venue_mode"
      | "venue_id"
      | "periods"
    >
  > = {},
) {
  return {
    kind: "tournament" as const,
    date: "2026-06-01",
    meetup_time: "09:00:00",
    home_away: "neutral" as const,
    venue_mode: "venue",
    venue_id: "venue-tournament",
    periods: "1" as const,
    ...overrides,
  };
}

describe("tournamentScheduleFromForm", () => {
  it("drops shared schedule fields unless the competition is a tournament", () => {
    expect(
      tournamentScheduleFromForm({
        kind: "league",
        date: "2026-06-01",
        meetupTime: "09:00",
        homeAway: "home",
      }),
    ).toEqual({ date: null, meetup_time: null, home_away: null });
  });

  it("keeps a valid tournament date, meet-up, and home/away", () => {
    expect(
      tournamentScheduleFromForm({
        kind: "tournament",
        date: "2026-06-01",
        meetupTime: "09:00",
        homeAway: "neutral",
      }),
    ).toEqual({
      date: "2026-06-01",
      meetup_time: "09:00",
      home_away: "neutral",
    });
  });

  it("allows a tournament schedule to be left blank", () => {
    expect(
      tournamentScheduleFromForm({
        kind: "tournament",
        date: "",
        meetupTime: "",
        homeAway: "",
      }),
    ).toEqual({ date: null, meetup_time: null, home_away: null });
  });

  it("rejects an invalid tournament date, meet-up, or home/away", () => {
    expect(
      tournamentScheduleFromForm({
        kind: "tournament",
        date: "2026-02-31",
        meetupTime: "09:00",
        homeAway: "home",
      }),
    ).toEqual({ error: "Date must be a valid date." });
    expect(
      tournamentScheduleFromForm({
        kind: "tournament",
        date: "2026-06-01",
        meetupTime: "25:00",
        homeAway: "home",
      }),
    ).toEqual({ error: "Meet-up must be a time." });
    expect(
      tournamentScheduleFromForm({
        kind: "tournament",
        date: "2026-06-01",
        meetupTime: "09:00",
        homeAway: "sideways",
      }),
    ).toEqual({ error: "Invalid home/away value." });
  });
});

describe("applyTournamentMatchFields", () => {
  it("copies date, meet-up, home/away, venue, and periods from a tournament", () => {
    expect(applyTournamentMatchFields(schedule, tournament())).toEqual({
      date: "2026-06-01",
      meetup_time: "09:00:00",
      home_away: "neutral",
      venue_id: "venue-tournament",
      periods: "1",
    });
  });

  it("leaves the match values when the competition is not a tournament", () => {
    expect(
      applyTournamentMatchFields(schedule, tournament({ kind: "cup" })),
    ).toEqual(schedule);
    expect(applyTournamentMatchFields(schedule, null)).toEqual(schedule);
  });

  it("keeps a per-match venue when the tournament venue is multiple", () => {
    expect(
      applyTournamentMatchFields(
        schedule,
        tournament({ venue_mode: "multiple", venue_id: null }),
      ).venue_id,
    ).toBe("venue-form");
  });

  it("clears the venue when the tournament venue is unknown", () => {
    expect(
      applyTournamentMatchFields(
        schedule,
        tournament({ venue_mode: "unknown", venue_id: null }),
      ).venue_id,
    ).toBeNull();
  });

  it("keeps match values the tournament has not set", () => {
    expect(
      applyTournamentMatchFields(
        schedule,
        tournament({
          date: null,
          meetup_time: null,
          home_away: null,
          venue_mode: "multiple",
          venue_id: null,
        }),
      ),
    ).toEqual({
      ...schedule,
      periods: "1",
    });
  });
});

describe("resolveMatchStage", () => {
  it("exposes stage only for cups and tournaments", () => {
    expect(competitionHasMatchStage("cup")).toBe(true);
    expect(competitionHasMatchStage("tournament")).toBe(true);
    expect(competitionHasMatchStage("league")).toBe(false);
  });

  it("defaults a cup or tournament match to group", () => {
    expect(resolveMatchStage("", "tournament")).toEqual({ stage: "group" });
    expect(resolveMatchStage("", "cup")).toEqual({ stage: "group" });
  });

  it("accepts each stage and rejects unknown values", () => {
    expect(resolveMatchStage("semi_final", "cup")).toEqual({
      stage: "semi_final",
    });
    expect(resolveMatchStage("final", "tournament")).toEqual({
      stage: "final",
    });
    expect(resolveMatchStage("bronze", "cup")).toEqual({
      error: "Invalid stage.",
    });
  });

  it("clears stage for other competition kinds and friendlies", () => {
    expect(resolveMatchStage("final", "league")).toEqual({ stage: null });
    expect(resolveMatchStage("final", null)).toEqual({ stage: null });
  });
});
