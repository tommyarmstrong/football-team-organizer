import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { matchFixture, viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  getMatchMock,
  listPeriodsForMatchMock,
  getPeriodMock,
  createPeriodMock,
  updatePeriodMock,
  deletePeriodMock,
  setPeriodStartersMock,
  changeMatchPeriodFormatMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getMatchMock: vi.fn(),
  listPeriodsForMatchMock: vi.fn(),
  getPeriodMock: vi.fn(),
  createPeriodMock: vi.fn(),
  updatePeriodMock: vi.fn(),
  deletePeriodMock: vi.fn(),
  setPeriodStartersMock: vi.fn(),
  changeMatchPeriodFormatMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/matches", () => ({ getMatch: getMatchMock }));
vi.mock("@/lib/data/match-periods", () => ({
  listPeriodsForMatch: listPeriodsForMatchMock,
  getPeriod: getPeriodMock,
  createPeriod: createPeriodMock,
  updatePeriod: updatePeriodMock,
  deletePeriod: deletePeriodMock,
  setPeriodStarters: setPeriodStartersMock,
  changeMatchPeriodFormat: changeMatchPeriodFormatMock,
}));

import {
  changePeriodFormatAction,
  createPeriodAction,
  createPeriodOnMatchAction,
  deletePeriodAction,
  deletePeriodAndReturnToMatchAction,
  savePeriodAndReturnToMatchAction,
} from "@/lib/match-periods/actions";

describe("match period actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "in_progress" }),
      error: null,
    });
    listPeriodsForMatchMock.mockResolvedValue({ data: [], error: null });
    getPeriodMock.mockResolvedValue({
      data: {
        id: "period-1",
        match_id: "match-1",
        name: "Extra time 1",
      },
      error: null,
    });
    createPeriodMock.mockResolvedValue({
      data: { id: "period-1" },
      error: null,
    });
    updatePeriodMock.mockResolvedValue({ error: null });
    deletePeriodMock.mockResolvedValue({ error: null });
    setPeriodStartersMock.mockResolvedValue({ error: null });
    changeMatchPeriodFormatMock.mockResolvedValue({ error: null });
  });

  it("rejects regulation periods and invalid names", async () => {
    expect(
      await createPeriodAction(
        "match-1",
        {},
        formDataFrom({ name: "First half" }),
      ),
    ).toMatchObject({
      error: expect.stringMatching(/extra time or a penalty/i),
    });

    expect(
      await createPeriodAction("match-1", {}, formDataFrom({})),
    ).toMatchObject({ error: expect.stringMatching(/period name/i) });
  });

  it("creates extra time with starters", async () => {
    await expect(
      createPeriodAction(
        "match-1",
        {},
        formDataFrom({
          name: "Extra time 1",
          player_id: ["p1", "p2"],
        }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(setPeriodStartersMock).toHaveBeenCalledWith("period-1", [
      "p1",
      "p2",
    ]);
  });

  it("creates a period on the match page without redirecting", async () => {
    expect(
      await createPeriodOnMatchAction(
        "match-1",
        {},
        formDataFrom({ name: "Extra time 1" }),
      ),
    ).toEqual({ success: "Period added." });
  });

  it("enforces permissions and match status", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await createPeriodAction(
        "match-1",
        {},
        formDataFrom({ name: "Extra time 1" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/permission/i) });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    expect(
      await createPeriodAction(
        "match-1",
        {},
        formDataFrom({ name: "Extra time 1" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/in progress or played/i) });
  });

  it("saves period renames and starters together", async () => {
    await expect(
      savePeriodAndReturnToMatchAction(
        "match-1",
        "period-1",
        {},
        formDataFrom({ name: "Extra time 2", player_id: ["p1", "p2"] }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(setPeriodStartersMock).toHaveBeenCalledWith("period-1", [
      "p1",
      "p2",
    ]);
  });

  it("clears starters when the saved list is empty", async () => {
    await expect(
      savePeriodAndReturnToMatchAction(
        "match-1",
        "period-1",
        {},
        formDataFrom({ name: "Extra time 1" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(setPeriodStartersMock).toHaveBeenCalledWith("period-1", []);
  });

  it("stays on the period page when starter save fails", async () => {
    setPeriodStartersMock.mockResolvedValue({
      error: "Could not save starters.",
    });
    expect(
      await savePeriodAndReturnToMatchAction(
        "match-1",
        "period-1",
        {},
        formDataFrom({ name: "Extra time 1", player_id: ["p1"] }),
      ),
    ).toEqual({ error: "Could not save starters." });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("deletes periods", async () => {
    expect(await deletePeriodAction("match-1", "period-1")).toEqual({});
    await expect(
      deletePeriodAndReturnToMatchAction("match-1", "period-1"),
    ).rejects.toThrow("redirect:/matches/match-1");
  });

  it("blocks duplicate extra-time names", async () => {
    listPeriodsForMatchMock.mockResolvedValue({
      data: [{ name: "Extra time 1" }],
      error: null,
    });
    expect(
      await createPeriodAction(
        "match-1",
        {},
        formDataFrom({ name: "Extra time 1" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/already on this match/i) });
  });
});

describe("changePeriodFormatAction", () => {
  const quarters = [
    { id: "q1", name: "Quarter 1", sort_order: 10 },
    { id: "q2", name: "Quarter 2", sort_order: 20 },
    { id: "q3", name: "Quarter 3", sort_order: 30 },
    { id: "q4", name: "Quarter 4", sort_order: 40 },
  ];
  const halves = [
    { id: "h1", name: "First half", sort_order: 50 },
    { id: "h2", name: "Second half", sort_order: 60 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "in_progress" }),
      error: null,
    });
    listPeriodsForMatchMock.mockResolvedValue({ data: quarters, error: null });
    changeMatchPeriodFormatMock.mockResolvedValue({ error: null });
  });

  it("changes quarters to halves, merging leftover quarters into the last half", async () => {
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ success: "Changed to halves." });

    expect(changeMatchPeriodFormatMock).toHaveBeenCalledTimes(1);
    const [matchId, plan] = changeMatchPeriodFormatMock.mock.calls[0] ?? [];
    expect(matchId).toBe("match-1");
    expect(plan.keep.map((k: { periodId: string }) => k.periodId)).toEqual([
      "q1",
      "q2",
    ]);
    expect(plan.merge).toEqual([
      expect.objectContaining({ periodId: "q3", intoPeriodId: "q2" }),
      expect.objectContaining({ periodId: "q4", intoPeriodId: "q2" }),
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/matches/match-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/stats");
  });

  it("changes halves to quarters and creates the missing periods", async () => {
    listPeriodsForMatchMock.mockResolvedValue({ data: halves, error: null });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "quarters" }),
      ),
    ).toEqual({ success: "Changed to quarters." });

    const plan = changeMatchPeriodFormatMock.mock.calls[0]?.[1];
    expect(plan.create.map((c: { name: string }) => c.name)).toEqual([
      "Quarter 3",
      "Quarter 4",
    ]);
    expect(plan.copyStartersFrom).toBe("h2");
  });

  it("only uses extra time as quarters when the checkbox is ticked", async () => {
    listPeriodsForMatchMock.mockResolvedValue({
      data: [
        ...halves,
        { id: "e1", name: "Extra time 1", sort_order: 80 },
        { id: "e2", name: "Extra time 2", sort_order: 90 },
      ],
      error: null,
    });

    await changePeriodFormatAction(
      "match-1",
      {},
      formDataFrom({ target: "quarters", use_extra_time: "on" }),
    );
    const used = changeMatchPeriodFormatMock.mock.calls[0]?.[1];
    expect(used.usesExtraTime).toBe(true);
    expect(used.create).toEqual([]);

    await changePeriodFormatAction(
      "match-1",
      {},
      formDataFrom({ target: "quarters" }),
    );
    const notUsed = changeMatchPeriodFormatMock.mock.calls[1]?.[1];
    expect(notUsed.usesExtraTime).toBe(false);
    expect(notUsed.create).toHaveLength(2);
  });

  it("rejects an invalid or missing target", async () => {
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "thirds" }),
      ),
    ).toEqual({ error: "Choose halves or quarters." });
    expect(
      await changePeriodFormatAction("match-1", {}, formDataFrom({})),
    ).toEqual({ error: "Choose halves or quarters." });
    expect(changeMatchPeriodFormatMock).not.toHaveBeenCalled();
  });

  it("requires match-day edit permission", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/permission/i) });
    expect(changeMatchPeriodFormatMock).not.toHaveBeenCalled();
  });

  it("only works when the match is in progress or played", async () => {
    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "scheduled" }),
      error: null,
    });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/in progress or played/i) });

    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "played" }),
      error: null,
    });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ success: "Changed to halves." });
  });

  it("reports a missing match and load errors", async () => {
    getMatchMock.mockResolvedValue({ data: null, error: null });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ error: "Match not found." });

    getMatchMock.mockResolvedValue({ data: null, error: "load failed" });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ error: "load failed" });

    getMatchMock.mockResolvedValue({
      data: matchFixture({ status: "in_progress" }),
      error: null,
    });
    listPeriodsForMatchMock.mockResolvedValue({
      data: [],
      error: "periods failed",
    });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ error: "periods failed" });
  });

  it("explains when the match is already in that format or has other periods", async () => {
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "quarters" }),
      ),
    ).toEqual({ error: "This match is already in quarters." });

    listPeriodsForMatchMock.mockResolvedValue({
      data: [{ id: "s", name: "Single period match", sort_order: 70 }],
      error: null,
    });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toMatchObject({
      error: expect.stringMatching(/not quarters or halves/i),
    });
    expect(changeMatchPeriodFormatMock).not.toHaveBeenCalled();
  });

  it("returns the database error without revalidating", async () => {
    changeMatchPeriodFormatMock.mockResolvedValue({ error: "rpc failed" });
    expect(
      await changePeriodFormatAction(
        "match-1",
        {},
        formDataFrom({ target: "halves" }),
      ),
    ).toEqual({ error: "rpc failed" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
