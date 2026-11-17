import { describe, expect, it } from "vitest";
import {
  competitionListToday,
  listedCompetitionResult,
} from "@/components/team/competition-list-badge";

const today = "2026-11-17";

describe("listedCompetitionResult", () => {
  it("leaves the everyday Ongoing state blank", () => {
    expect(
      listedCompetitionResult({ result: "ongoing", date: "2026-09-01" }, today),
    ).toBeNull();
    expect(
      listedCompetitionResult({ result: "none", date: null }, today),
    ).toBeNull();
    expect(
      listedCompetitionResult({ result: null, date: null }, today),
    ).toBeNull();
  });

  it("keeps a stored result such as Completed", () => {
    expect(
      listedCompetitionResult(
        { result: "completed", date: "2099-01-01" },
        today,
      ),
    ).toBe("completed");
    expect(
      listedCompetitionResult({ result: "champions", date: null }, today),
    ).toBe("champions");
    expect(
      listedCompetitionResult(
        { result: "cancelled", date: "2026-01-01" },
        today,
      ),
    ).toBe("cancelled");
  });

  it("shows Upcoming when the date is still to come and there is no result yet", () => {
    expect(
      listedCompetitionResult({ result: "ongoing", date: "2026-12-01" }, today),
    ).toBe("upcoming");
    expect(
      listedCompetitionResult(
        { result: "none", date: "2026-11-18T18:00:00" },
        today,
      ),
    ).toBe("upcoming");
  });

  it("treats today as already started", () => {
    expect(
      listedCompetitionResult({ result: "ongoing", date: today }, today),
    ).toBeNull();
  });
});

describe("competitionListToday", () => {
  it("returns the UTC calendar day", () => {
    expect(competitionListToday(new Date("2026-11-17T23:30:00Z"))).toBe(
      "2026-11-17",
    );
  });
});
