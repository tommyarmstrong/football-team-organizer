import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";

const {
  revalidatePathMock,
  setMatchSquadMock,
  addTeamMemberMock,
  removeTeamMemberMock,
  getGuardianMock,
  createGoalMock,
  deleteGoalMock,
  updateGoalMock,
  createClientMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  setMatchSquadMock: vi.fn(),
  addTeamMemberMock: vi.fn(),
  removeTeamMemberMock: vi.fn(),
  getGuardianMock: vi.fn(),
  createGoalMock: vi.fn(),
  deleteGoalMock: vi.fn(),
  updateGoalMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("@/lib/data/match-players", () => ({
  setMatchSquad: setMatchSquadMock,
}));
vi.mock("@/lib/data/members", () => ({
  addTeamMember: addTeamMemberMock,
  removeTeamMember: removeTeamMemberMock,
}));
vi.mock("@/lib/data/guardians", () => ({ getGuardian: getGuardianMock }));
vi.mock("@/lib/data/goals", () => ({
  createGoal: createGoalMock,
  deleteGoal: deleteGoalMock,
  updateGoal: updateGoalMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { saveMatchSquadAction } from "@/lib/match-players/actions";
import {
  addGuardianAssistantAction,
  addTeamMemberAction,
  removeGuardianAssistantAction,
  removeTeamMemberAction,
} from "@/lib/members/actions";
import {
  createGoalAndReturnToMatchAction,
  deleteGoalAndReturnToMatchAction,
} from "@/lib/goals/actions";

describe("saveMatchSquadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMatchSquadMock.mockResolvedValue({ error: null });
  });

  it("saves selected player ids", async () => {
    const result = await saveMatchSquadAction(
      "match-1",
      {},
      formDataFrom({ player_id: ["p1", "p2", ""] }),
    );
    expect(result.success).toMatch(/saved/i);
    expect(setMatchSquadMock).toHaveBeenCalledWith("match-1", ["p1", "p2"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/matches/match-1");
  });

  it("returns squad errors", async () => {
    setMatchSquadMock.mockResolvedValue({ error: "boom" });
    const result = await saveMatchSquadAction("match-1", {}, formDataFrom({}));
    expect(result.error).toBe("boom");
  });
});

describe("member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addTeamMemberMock.mockResolvedValue({ error: null });
    removeTeamMemberMock.mockResolvedValue({ error: null });
  });

  it("validates auth user uuid and role", async () => {
    expect(
      await addTeamMemberAction(
        "team-1",
        {},
        formDataFrom({ user_id: "not-a-uuid", role: "coach" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/uuid/i) });

    expect(
      await addTeamMemberAction(
        "team-1",
        {},
        formDataFrom({
          user_id: "11111111-1111-1111-1111-111111111111",
          role: "wizard",
        }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/valid role/i) });
  });

  it("adds and removes members", async () => {
    const added = await addTeamMemberAction(
      "team-1",
      {},
      formDataFrom({
        user_id: "11111111-1111-1111-1111-111111111111",
        role: "coach",
      }),
    );
    expect(added.success).toMatch(/added/i);

    const removed = await removeTeamMemberAction("tm-1");
    expect(removed.success).toMatch(/removed/i);
  });

  it("requires a guardian with a linked login", async () => {
    getGuardianMock.mockResolvedValue({
      data: { id: "g1", user_id: null },
      error: null,
    });
    const result = await addGuardianAssistantAction(
      "team-1",
      {},
      formDataFrom({ guardian_id: "g1" }),
    );
    expect(result.error).toMatch(/no linked login/i);
  });

  it("adds and removes guardian assistants", async () => {
    getGuardianMock.mockResolvedValue({
      data: { id: "g1", user_id: "11111111-1111-1111-1111-111111111111" },
      error: null,
    });
    const added = await addGuardianAssistantAction(
      "team-1",
      {},
      formDataFrom({ guardian_id: "g1" }),
    );
    expect(added.success).toMatch(/assistant added/i);
    expect(addTeamMemberMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "guardian_assistant" }),
    );

    const removed = await removeGuardianAssistantAction("tm-ga-1");
    expect(removed.success).toMatch(/assistant removed/i);
  });
});

describe("goal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createGoalMock.mockResolvedValue({
      data: { id: "goal-1" },
      error: null,
    });
    deleteGoalMock.mockResolvedValue({ error: null });
  });

  it("requires a scorer", async () => {
    const result = await createGoalAndReturnToMatchAction(
      "match-1",
      {},
      formDataFrom({}),
    );
    expect(result.error).toMatch(/select a scorer/i);
  });

  it("rejects assist equal to scorer", async () => {
    const result = await createGoalAndReturnToMatchAction(
      "match-1",
      {},
      formDataFrom({
        player_id: "player-1",
        assist_player_id: "player-1",
      }),
    );
    expect(result.error).toMatch(/assist player must be different/i);
  });

  it("creates an opposition goal and redirects", async () => {
    await expect(
      createGoalAndReturnToMatchAction(
        "match-1",
        {},
        formDataFrom({ player_id: "__opposition__" }),
      ),
    ).rejects.toThrow("redirect:/matches/match-1");
    expect(createGoalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        match_id: "match-1",
        is_opposition: true,
        player_id: null,
      }),
    );
  });

  it("deletes a goal and returns to the match", async () => {
    await expect(
      deleteGoalAndReturnToMatchAction("match-1", "goal-1"),
    ).rejects.toThrow("redirect:/matches/match-1");
  });
});
