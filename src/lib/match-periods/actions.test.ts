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
}));

import {
  createPeriodAction,
  deletePeriodAction,
  deletePeriodAndReturnToMatchAction,
  savePeriodAndReturnToMatchAction,
  savePeriodStartersAction,
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

  it("saves period renames and starters", async () => {
    await expect(
      savePeriodAndReturnToMatchAction(
        "match-1",
        "period-1",
        {},
        formDataFrom({ name: "Extra time 2" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");

    expect(
      await savePeriodStartersAction(
        "match-1",
        "period-1",
        {},
        formDataFrom({ player_id: ["p1"] }),
      ),
    ).toMatchObject({ success: expect.stringMatching(/starting players/i) });
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
