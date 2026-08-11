import { describe, expect, it } from "vitest";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
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
  });

  it("filters matches with no competition", () => {
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
  });
});
