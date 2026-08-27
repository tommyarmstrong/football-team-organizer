import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  createCard,
  deleteCard,
  getCard,
  listCardsForMatch,
  updateCard,
} from "@/lib/data/cards";

const cardRow = {
  id: "card-1",
  match_id: "match-1",
  player_id: "player-1",
  coach_id: null,
  guardian_id: null,
  type: "yellow_1st",
  coach_notes: null,
  referee_notes: null,
  club_notes: null,
  created_at: "2025-01-01T00:00:00Z",
  player: {
    id: "player-1",
    person: { first_name: "Sam", last_name: "Striker" },
  },
  coach: null,
  guardian: null,
};

describe("cards data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and gets cards with mapped people", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ cards: okResult([cardRow]) }),
    );
    const listed = await listCardsForMatch("match-1");
    expect(listed.data[0]?.player?.first_name).toBe("Sam");

    createClientMock.mockResolvedValue(
      mockFromClient({ cards: okResult(cardRow) }),
    );
    expect((await getCard("card-1")).data?.id).toBe("card-1");
  });

  it("creates cards only when match allows events", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "match-1", status: "scheduled" }),
      }),
    );
    expect(
      await createCard({
        match_id: "match-1",
        type: "yellow_1st",
        player_id: "player-1",
      }),
    ).toMatchObject({
      error: expect.stringMatching(/in progress or played/i),
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "match-1", status: "played" }),
        cards: okResult({ id: "card-1", type: "yellow_1st" }),
      }),
    );
    expect(
      (
        await createCard({
          match_id: "match-1",
          type: "yellow_1st",
          player_id: "player-1",
        })
      ).data?.id,
    ).toBe("card-1");
  });

  it("maps friendly card constraint errors and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        cards: errResult("cards_exactly_one_person violated"),
      }),
    );
    expect(await updateCard("card-1", { type: "red" })).toMatchObject({
      error: expect.stringMatching(/exactly one/i),
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ cards: okResult(null) }),
    );
    expect(await deleteCard("card-1")).toEqual({ error: null });
  });
});
