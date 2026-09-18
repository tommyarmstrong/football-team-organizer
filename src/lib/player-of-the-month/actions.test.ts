import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";

const { revalidatePathMock, redirectMock, createMock, updateMock, deleteMock } =
  vi.hoisted(() => ({
    revalidatePathMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    }),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/data/player-of-the-month", () => ({
  createPlayerOfTheMonth: createMock,
  updatePlayerOfTheMonth: updateMock,
  deletePlayerOfTheMonth: deleteMock,
}));

import {
  createPlayerOfTheMonthAction,
  createPlayerOfTheMonthOnPageAction,
  deletePlayerOfTheMonthAction,
  updatePlayerOfTheMonthAction,
  updatePlayerOfTheMonthOnPageAction,
} from "@/lib/player-of-the-month/actions";

const valid = formDataFrom({
  player_id: "player-1",
  month: "2025-09",
  notes: "Great month",
});

describe("player of the month actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ data: { id: "potm-1" }, error: null });
    updateMock.mockResolvedValue({ error: null });
    deleteMock.mockResolvedValue({ error: null });
  });

  it("validates player and month", async () => {
    expect(
      await createPlayerOfTheMonthAction(
        {},
        formDataFrom({ month: "2025-09" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/select a player/i) });

    expect(
      await createPlayerOfTheMonthAction(
        {},
        formDataFrom({ player_id: "p1", month: "09-2025" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/yyyy-mm/i) });

    expect(
      await createPlayerOfTheMonthAction(
        {},
        formDataFrom({ player_id: "p1", month: "2025-13" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/invalid month/i) });
  });

  it("creates, updates, and deletes", async () => {
    await expect(createPlayerOfTheMonthAction({}, valid)).rejects.toThrow(
      "redirect:/team",
    );
    expect(createMock).toHaveBeenCalledWith({
      player_id: "player-1",
      month: "2025-09-01",
      notes: "Great month",
    });

    await expect(
      updatePlayerOfTheMonthAction("potm-1", {}, valid),
    ).rejects.toThrow("redirect:/team");

    await expect(deletePlayerOfTheMonthAction("potm-1")).rejects.toThrow(
      "redirect:/team",
    );
  });

  it("creates and updates on the team page without redirecting", async () => {
    expect(await createPlayerOfTheMonthOnPageAction({}, valid)).toEqual({
      success: "Player of the month added.",
    });
    expect(
      await updatePlayerOfTheMonthOnPageAction("potm-1", {}, valid),
    ).toEqual({ success: "Player of the month saved." });
  });

  it("returns write errors", async () => {
    createMock.mockResolvedValue({ data: null, error: "fail" });
    expect(await createPlayerOfTheMonthAction({}, valid)).toEqual({
      error: "fail",
    });

    createMock.mockResolvedValue({ data: null, error: null });
    expect(await createPlayerOfTheMonthAction({}, valid)).toEqual({
      error: "Could not create player of the month.",
    });

    deleteMock.mockResolvedValue({ error: "nope" });
    expect(await deletePlayerOfTheMonthAction("potm-1")).toEqual({
      error: "nope",
    });
  });
});
