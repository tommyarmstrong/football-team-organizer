import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";

const {
  revalidatePathMock,
  redirectMock,
  createCardMock,
  updateCardMock,
  deleteCardMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  createCardMock: vi.fn(),
  updateCardMock: vi.fn(),
  deleteCardMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/data/cards", () => ({
  createCard: createCardMock,
  updateCard: updateCardMock,
  deleteCard: deleteCardMock,
}));

import {
  createCardAndReturnToMatchAction,
  deleteCardAction,
  deleteCardAndReturnToMatchAction,
  saveCardAndReturnToMatchAction,
} from "@/lib/cards/actions";

describe("card actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCardMock.mockResolvedValue({ data: { id: "card-1" }, error: null });
    updateCardMock.mockResolvedValue({ error: null });
    deleteCardMock.mockResolvedValue({ error: null });
  });

  it("validates player and card type on create", async () => {
    expect(
      await createCardAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ type: "yellow_1st" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/select a player/i) });

    expect(
      await createCardAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ player_id: "p1", type: "rainbow" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/card type/i) });
  });

  it("creates a card and redirects", async () => {
    await expect(
      createCardAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ player_id: "p1", type: "yellow_1st" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(createCardMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/matches/match-1");
  });

  it("returns create errors", async () => {
    createCardMock.mockResolvedValue({ data: null, error: "boom" });
    expect(
      await createCardAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ player_id: "p1", type: "red" }),
      ),
    ).toEqual({ error: "boom" });

    createCardMock.mockResolvedValue({ data: null, error: null });
    expect(
      await createCardAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ player_id: "p1", type: "red" }),
      ),
    ).toEqual({ error: "Could not create card." });
  });

  it("saves and deletes cards", async () => {
    await expect(
      saveCardAndReturnToMatchAction(
        "match-1",
        "card-1",
        {},
        formDataFrom({ player_id: "p1", type: "timeout" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");

    expect(await deleteCardAction("match-1", "card-1")).toEqual({});
    await expect(
      deleteCardAndReturnToMatchAction("match-1", "card-1"),
    ).rejects.toThrow("redirect:/matches/match-1");
  });

  it("surfaces delete errors", async () => {
    deleteCardMock.mockResolvedValue({ error: "nope" });
    expect(await deleteCardAction("match-1", "card-1")).toEqual({
      error: "nope",
    });
  });
});
