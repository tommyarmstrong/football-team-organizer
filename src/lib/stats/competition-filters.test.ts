import { describe, expect, it } from "vitest";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  ALL_COMPETITIVE,
  ALL_LEAGUE_AND_CUP,
  FRIENDLY_KIND,
  FRIENDLY_MATCHES,
  matchesCompetitionFilters,
  NO_COMPETITION,
} from "@/lib/stats/competition-filters";

describe("matchesCompetitionFilters", () => {
  it("allows everything when filters are all", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "league",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(true);
  });

  it("filters by competition id", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "league",
        selectedCompetitionId: "c1",
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c2",
        competitionKind: "league",
        selectedCompetitionId: "c1",
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: "c1",
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(false);
  });

  it("filters matches with unknown competitions (excluding friendlies)", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        selectedCompetitionId: NO_COMPETITION,
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "cup",
        selectedCompetitionId: NO_COMPETITION,
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: NO_COMPETITION,
        selectedCompetitionKind: ALL_COMPETITION_KINDS,
      }),
    ).toBe(false);
  });

  it("filters by competition kind", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "cup",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: "cup",
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "league",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: "cup",
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: "cup",
      }),
    ).toBe(false);
  });

  it("filters friendly fixtures from the competition type filter", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: FRIENDLY_KIND,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "league",
        isFriendly: false,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: FRIENDLY_KIND,
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: false,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: FRIENDLY_KIND,
      }),
    ).toBe(false);
  });

  it("still accepts the legacy friendly competitions filter value", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: FRIENDLY_MATCHES,
        selectedCompetitionKind: FRIENDLY_KIND,
      }),
    ).toBe(true);
  });

  it("filters all league and cup competitions", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "league",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_LEAGUE_AND_CUP,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c2",
        competitionKind: "cup",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_LEAGUE_AND_CUP,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c3",
        competitionKind: "tournament",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_LEAGUE_AND_CUP,
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_LEAGUE_AND_CUP,
      }),
    ).toBe(false);
  });

  it("filters all competitive competitions", () => {
    expect(
      matchesCompetitionFilters({
        competitionId: "c1",
        competitionKind: "tournament",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_COMPETITIVE,
      }),
    ).toBe(true);
    expect(
      matchesCompetitionFilters({
        competitionId: "c2",
        competitionKind: "other",
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_COMPETITIVE,
      }),
    ).toBe(false);
    expect(
      matchesCompetitionFilters({
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
        selectedCompetitionId: ALL_COMPETITIONS,
        selectedCompetitionKind: ALL_COMPETITIVE,
      }),
    ).toBe(false);
  });
});
