import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockFromClient,
  okResult,
  errResult,
  queryChain,
} from "@/test/supabase-mock";
import { ARCHIVED_TEAM_READONLY_MESSAGE } from "@/lib/team/season";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  rejectIfMatchTeamArchived,
  rejectIfTeamArchived,
} from "@/lib/team/readonly-guard";

describe("readonly-guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows writes on active teams", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult({ archived_at: null }),
      }),
    );
    expect(await rejectIfTeamArchived("team-1")).toBeNull();
  });

  it("rejects writes on archived teams", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult({ archived_at: "2026-05-01T00:00:00Z" }),
      }),
    );
    expect(await rejectIfTeamArchived("team-1")).toBe(
      ARCHIVED_TEAM_READONLY_MESSAGE,
    );
  });

  it("reads a match's team archive state in one query", async () => {
    const matchesResults = vi.fn();
    createClientMock.mockResolvedValue({
      from(table: string) {
        matchesResults(table);
        return queryChain(
          okResult({
            team_id: "team-1",
            team: { archived_at: "2026-05-01T00:00:00Z" },
          }),
        );
      },
    });
    expect(await rejectIfMatchTeamArchived("match-1")).toBe(
      ARCHIVED_TEAM_READONLY_MESSAGE,
    );
    expect(matchesResults.mock.calls).toEqual([["matches"]]);
  });

  it("accepts an array-shaped team embed", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ team_id: "team-1", team: [{ archived_at: null }] }),
      }),
    );
    expect(await rejectIfMatchTeamArchived("match-1")).toBeNull();
  });

  it("reports a match whose team is not visible", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ team_id: "team-1", team: null }),
      }),
    );
    expect(await rejectIfMatchTeamArchived("match-1")).toBe("Team not found.");
  });

  it("maps missing match and team rows", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult(null),
      }),
    );
    expect(await rejectIfMatchTeamArchived("missing")).toBe("Match not found.");

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(null),
      }),
    );
    expect(await rejectIfTeamArchived("missing")).toBe("Team not found.");
  });

  it("maps query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: errResult("db down"),
      }),
    );
    expect(await rejectIfTeamArchived("team-1")).toBe("db down");
  });
});
