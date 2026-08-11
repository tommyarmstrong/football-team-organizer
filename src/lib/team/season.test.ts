import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEASON,
  isTeamArchived,
  isValidSeasonLabel,
  SEASON_OPTIONS,
  sortTeamsForDisplay,
} from "@/lib/team/season";
import type { Team } from "@/lib/supabase/database.types";

function team(overrides: Partial<Team> & Pick<Team, "id" | "name">): Team {
  return {
    club_id: "club-1",
    display_name: null,
    age_group: "U10",
    gender: "boys",
    home_venue_id: null,
    training_venue_id: null,
    training_days: null,
    season_label: "2025/26",
    photo_url: null,
    archived_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("isValidSeasonLabel", () => {
  it("accepts YYYY/YY where YY is the following year", () => {
    expect(isValidSeasonLabel("2025/26")).toBe(true);
    expect(isValidSeasonLabel("1965/66")).toBe(true);
    expect(isValidSeasonLabel("1995/96")).toBe(true);
    expect(isValidSeasonLabel("1999/00")).toBe(true);
  });

  it("rejects malformed or non-consecutive seasons", () => {
    expect(isValidSeasonLabel("2025")).toBe(false);
    expect(isValidSeasonLabel("2025-26")).toBe(false);
    expect(isValidSeasonLabel("1956/66")).toBe(false);
    expect(isValidSeasonLabel("2025/25")).toBe(false);
    expect(isValidSeasonLabel("")).toBe(false);
  });

  it("exposes presets with 2026/27 as default", () => {
    expect(SEASON_OPTIONS).toContain(DEFAULT_SEASON);
    expect(DEFAULT_SEASON).toBe("2026/27");
  });
});

describe("isTeamArchived", () => {
  it("is false when archived_at is null", () => {
    expect(isTeamArchived(team({ id: "1", name: "Lions" }))).toBe(false);
  });

  it("is true when archived_at is set", () => {
    expect(
      isTeamArchived(
        team({ id: "1", name: "Lions", archived_at: "2026-05-01T00:00:00Z" }),
      ),
    ).toBe(true);
  });
});

describe("sortTeamsForDisplay", () => {
  it("sorts active teams before archived, then by name and season", () => {
    const sorted = sortTeamsForDisplay([
      team({
        id: "a",
        name: "Lions",
        season_label: "2024/25",
        archived_at: "2025-06-01T00:00:00Z",
      }),
      team({ id: "b", name: "Tigers", season_label: "2025/26" }),
      team({ id: "c", name: "Lions", season_label: "2025/26" }),
      team({
        id: "d",
        name: "Lions",
        season_label: "2023/24",
        archived_at: "2024-06-01T00:00:00Z",
      }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual(["c", "b", "a", "d"]);
  });
});
