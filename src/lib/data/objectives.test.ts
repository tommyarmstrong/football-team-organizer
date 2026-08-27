import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  createCoachObjective,
  deleteCoachObjective,
  getCoachObjective,
  listCoachObjectives,
  updateCoachObjective,
} from "@/lib/data/coach-objectives";
import {
  createPlayerObjective,
  deletePlayerObjective,
  getPlayerObjective,
  listPlayerObjectives,
  updatePlayerObjective,
} from "@/lib/data/player-objectives";

describe("objective data helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("covers coach objectives CRUD", async () => {
    const row = {
      id: "obj-1",
      coach_id: "coach-1",
      body: "Improve",
      objective_type: "coaching",
      status: "in_progress",
      target_date: null,
      sort_order: 0,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    createClientMock.mockResolvedValue(
      mockFromClient({ coach_development_objectives: okResult([row]) }),
    );
    expect((await listCoachObjectives("coach-1")).data).toHaveLength(1);

    createClientMock.mockResolvedValue(
      mockFromClient({ coach_development_objectives: okResult(row) }),
    );
    expect((await getCoachObjective("obj-1")).data?.id).toBe("obj-1");
    expect(
      (await createCoachObjective({ coach_id: "coach-1", body: "Improve" }))
        .data?.id,
    ).toBe("obj-1");
    expect(
      (await updateCoachObjective("obj-1", { body: "Updated" })).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ coach_development_objectives: okResult(null) }),
    );
    expect(await deleteCoachObjective("obj-1")).toEqual({ error: null });
  });

  it("covers player objectives CRUD", async () => {
    const row = {
      id: "pobj-1",
      player_id: "player-1",
      body: "Shoot",
      objective_type: "skills",
      status: "in_progress",
      target_date: null,
      sort_order: 0,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    createClientMock.mockResolvedValue(
      mockFromClient({ player_development_objectives: okResult([row]) }),
    );
    expect((await listPlayerObjectives("player-1")).data).toHaveLength(1);

    createClientMock.mockResolvedValue(
      mockFromClient({ player_development_objectives: okResult(row) }),
    );
    expect((await getPlayerObjective("pobj-1")).data?.id).toBe("pobj-1");
    expect(
      (
        await createPlayerObjective({
          player_id: "player-1",
          body: "Shoot",
        })
      ).data?.id,
    ).toBe("pobj-1");
    expect(
      (await updatePlayerObjective("pobj-1", { body: "Pass" })).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ player_development_objectives: okResult(null) }),
    );
    expect(await deletePlayerObjective("pobj-1")).toEqual({ error: null });
  });

  it("maps objective query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        coach_development_objectives: errResult("x"),
        player_development_objectives: errResult("y"),
      }),
    );
    expect(await listCoachObjectives("c")).toEqual({ data: [], error: "x" });
    expect(await listPlayerObjectives("p")).toEqual({ data: [], error: "y" });
  });
});
