import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";

const {
  revalidatePathMock,
  redirectMock,
  getActiveTeamMock,
  resolveStaffClubIdMock,
  createCoachMock,
  updateCoachMock,
  updateCoachTextMock,
  deleteCoachMock,
  getCoachMock,
  addCoachToTeamMock,
  removeCoachFromTeamMock,
  createCoachObjectiveMock,
  updateCoachObjectiveMock,
  deleteCoachObjectiveMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getActiveTeamMock: vi.fn(),
  resolveStaffClubIdMock: vi.fn(),
  createCoachMock: vi.fn(),
  updateCoachMock: vi.fn(),
  updateCoachTextMock: vi.fn(),
  deleteCoachMock: vi.fn(),
  getCoachMock: vi.fn(),
  addCoachToTeamMock: vi.fn(),
  removeCoachFromTeamMock: vi.fn(),
  createCoachObjectiveMock: vi.fn(),
  updateCoachObjectiveMock: vi.fn(),
  deleteCoachObjectiveMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));
vi.mock("@/lib/data/clubs", () => ({
  resolveStaffClubId: resolveStaffClubIdMock,
}));
vi.mock("@/lib/data/coaches", () => ({
  createCoach: createCoachMock,
  updateCoach: updateCoachMock,
  updateCoachText: updateCoachTextMock,
  deleteCoach: deleteCoachMock,
  getCoach: getCoachMock,
  addCoachToTeam: addCoachToTeamMock,
  removeCoachFromTeam: removeCoachFromTeamMock,
}));
vi.mock("@/lib/data/coach-objectives", () => ({
  createCoachObjective: createCoachObjectiveMock,
  updateCoachObjective: updateCoachObjectiveMock,
  deleteCoachObjective: deleteCoachObjectiveMock,
}));

import {
  addCoachObjectiveAction,
  addCoachToTeamAction,
  createCoachAction,
  createTeamCoachAction,
  deleteCoachAction,
  deleteCoachObjectiveAction,
  deleteCoachObjectiveAndReturnAction,
  removeCoachFromTeamAction,
  updateCoachAction,
  updateCoachObjectiveAction,
  updateCoachTextAction,
} from "@/lib/coaches/actions";

const coachForm = formDataFrom({
  first_name: "Casey",
  second_name: "Coach",
  joined_date: "2024-01-01",
});

const objectiveForm = formDataFrom({
  body: "Improve set pieces",
  objective_type: "coaching",
  status: "in_progress",
});

describe("coach actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue({ id: "team-1", club_id: "club-1" });
    resolveStaffClubIdMock.mockResolvedValue("club-1");
    createCoachMock.mockResolvedValue({
      data: { id: "coach-1", person_id: "person-1" },
      error: null,
    });
    updateCoachMock.mockResolvedValue({ error: null });
    updateCoachTextMock.mockResolvedValue({ error: null });
    deleteCoachMock.mockResolvedValue({ error: null });
    getCoachMock.mockResolvedValue({
      data: { id: "coach-1", person_id: "person-1" },
      error: null,
    });
    addCoachToTeamMock.mockResolvedValue({ error: null });
    removeCoachFromTeamMock.mockResolvedValue({ error: null });
    createCoachObjectiveMock.mockResolvedValue({
      data: { id: "obj-1" },
      error: null,
    });
    updateCoachObjectiveMock.mockResolvedValue({ error: null });
    deleteCoachObjectiveMock.mockResolvedValue({ error: null });
  });

  it("requires a club and valid form to create", async () => {
    resolveStaffClubIdMock.mockResolvedValue(null);
    expect(await createCoachAction({}, coachForm)).toMatchObject({
      error: expect.stringMatching(/no club/i),
    });

    resolveStaffClubIdMock.mockResolvedValue("club-1");
    expect(
      await createCoachAction({}, formDataFrom({ first_name: "Casey" })),
    ).toMatchObject({ error: expect.stringMatching(/required/i) });
  });

  it("creates, updates, and deletes coaches", async () => {
    await expect(createCoachAction({}, coachForm)).rejects.toThrow(
      "redirect:/people/person-1",
    );

    await expect(updateCoachAction("coach-1", {}, coachForm)).rejects.toThrow(
      "redirect:/people/person-1",
    );

    await expect(
      updateCoachTextAction(
        "coach-1",
        {},
        formDataFrom({ biography: "Bio", philosophy: "Play out" }),
      ),
    ).rejects.toThrow("redirect:/people/person-1");

    await expect(deleteCoachAction("coach-1")).rejects.toThrow(
      "redirect:/people/person-1",
    );
  });

  it("assigns and removes coaches from teams", async () => {
    expect(
      await addCoachToTeamAction(
        "coach-1",
        {},
        formDataFrom({ team_id: "team-1", role: "assistant" }),
      ),
    ).toMatchObject({ success: expect.stringMatching(/assigned/i) });

    expect(
      await addCoachToTeamAction("coach-1", {}, formDataFrom({})),
    ).toMatchObject({ error: expect.stringMatching(/select a team/i) });

    expect(await removeCoachFromTeamAction("tc-1", "coach-1")).toMatchObject({
      success: expect.stringMatching(/removed/i),
    });
  });

  it("creates a team coach in one step", async () => {
    expect(
      await createTeamCoachAction("team-1", "club-1", {}, coachForm),
    ).toMatchObject({ success: expect.stringMatching(/added to team/i) });
    expect(addCoachToTeamMock).toHaveBeenCalledWith("team-1", "coach-1", null);
  });

  it("manages coach objectives", async () => {
    await expect(
      addCoachObjectiveAction("coach-1", {}, objectiveForm),
    ).rejects.toThrow("redirect:/people/person-1");

    await expect(
      updateCoachObjectiveAction("coach-1", "obj-1", {}, objectiveForm),
    ).rejects.toThrow("redirect:/people/person-1");

    expect(await deleteCoachObjectiveAction("coach-1", "obj-1")).toMatchObject({
      success: expect.stringMatching(/removed/i),
    });

    await expect(
      deleteCoachObjectiveAndReturnAction("coach-1", "obj-1"),
    ).rejects.toThrow("redirect:/people/person-1");
  });
});
