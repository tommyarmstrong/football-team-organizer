import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import {
  clubManagerViewer,
  personFixture,
  personWithRolesFixture,
  viewerFixture,
} from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  getPrimaryClubMock,
  createPersonMock,
  deletePersonMock,
  reactivatePersonMock,
  getPersonMock,
  updatePersonMock,
  linkRoleToPersonMock,
  createPlayerMock,
  createCoachMock,
  createGuardianMock,
  createManagerMock,
  deletePlayerMock,
  deleteCoachMock,
  deleteGuardianMock,
  deleteManagerMock,
  getPlayerMock,
  getCoachMock,
  getGuardianMock,
  getManagerMock,
  setPlayerActiveRoleMock,
  setCoachActiveRoleMock,
  setGuardianActiveRoleMock,
  setManagerActiveRoleMock,
  updatePlayerMock,
  sendPersonInvitationMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  createPersonMock: vi.fn(),
  deletePersonMock: vi.fn(),
  reactivatePersonMock: vi.fn(),
  getPersonMock: vi.fn(),
  updatePersonMock: vi.fn(),
  linkRoleToPersonMock: vi.fn(),
  createPlayerMock: vi.fn(),
  createCoachMock: vi.fn(),
  createGuardianMock: vi.fn(),
  createManagerMock: vi.fn(),
  deletePlayerMock: vi.fn(),
  deleteCoachMock: vi.fn(),
  deleteGuardianMock: vi.fn(),
  deleteManagerMock: vi.fn(),
  getPlayerMock: vi.fn(),
  getCoachMock: vi.fn(),
  getGuardianMock: vi.fn(),
  getManagerMock: vi.fn(),
  setPlayerActiveRoleMock: vi.fn(),
  setCoachActiveRoleMock: vi.fn(),
  setGuardianActiveRoleMock: vi.fn(),
  setManagerActiveRoleMock: vi.fn(),
  updatePlayerMock: vi.fn(),
  sendPersonInvitationMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  deletePerson: deletePersonMock,
  reactivatePerson: reactivatePersonMock,
  getPerson: getPersonMock,
  updatePerson: updatePersonMock,
  linkRoleToPerson: linkRoleToPersonMock,
}));
vi.mock("@/lib/data/players", () => ({
  createPlayer: createPlayerMock,
  deletePlayer: deletePlayerMock,
  getPlayer: getPlayerMock,
  setPlayerActiveRole: setPlayerActiveRoleMock,
  updatePlayer: updatePlayerMock,
}));
vi.mock("@/lib/data/coaches", () => ({
  createCoach: createCoachMock,
  deleteCoach: deleteCoachMock,
  getCoach: getCoachMock,
  setCoachActiveRole: setCoachActiveRoleMock,
}));
vi.mock("@/lib/data/guardians", () => ({
  createGuardian: createGuardianMock,
  deleteGuardian: deleteGuardianMock,
  getGuardian: getGuardianMock,
  setGuardianActiveRole: setGuardianActiveRoleMock,
}));
vi.mock("@/lib/data/managers", () => ({
  createManager: createManagerMock,
  deleteManager: deleteManagerMock,
  getManager: getManagerMock,
  setManagerActiveRole: setManagerActiveRoleMock,
}));
vi.mock("@/lib/people/invitations", () => ({
  sendPersonInvitation: sendPersonInvitationMock,
}));

import {
  addClubRoleToPersonAction,
  completePersonProfileAction,
  createPersonAction,
  deletePersonAction,
  linkRoleToPersonAction,
  reactivatePersonAction,
  removeClubRoleFromPersonAction,
  sendInvitationAction,
  updatePersonAction,
} from "@/lib/people/actions";

const club = { id: "club-1", name: "Example FC" };

describe("createPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
  });

  it("requires sign-in", async () => {
    getViewerContextMock.mockResolvedValue(null);
    const result = await createPersonAction(
      {},
      formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
    );
    expect(result.error).toMatch(/not signed in/i);
  });

  it("requires club management", async () => {
    getViewerContextMock.mockResolvedValue(viewerFixture());
    const result = await createPersonAction(
      {},
      formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
    );
    expect(result.error).toMatch(/only club management/i);
  });

  it("returns parse errors", async () => {
    const result = await createPersonAction(
      {},
      formDataFrom({ first_name: "Ada" }),
    );
    expect(result.error).toMatch(/first and last name/i);
  });

  it("creates a person and redirects", async () => {
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    await expect(
      createPersonAction(
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          email: "ada@example.com",
        }),
      ),
    ).rejects.toThrow("redirect:/people/person-new");
  });

  it("maps create failures and missing rows", async () => {
    createPersonMock.mockResolvedValue({ data: null, error: "insert failed" });
    expect(
      await createPersonAction(
        {},
        formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
      ),
    ).toEqual({ error: "insert failed" });

    createPersonMock.mockResolvedValue({ data: null, error: null });
    expect(
      await createPersonAction(
        {},
        formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
      ),
    ).toEqual({ error: "Could not create person." });
  });

  it("creates club roles requested on the form", async () => {
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    createPlayerMock.mockResolvedValue({ error: null });
    createCoachMock.mockResolvedValue({ error: null });
    createGuardianMock.mockResolvedValue({ error: null });
    createManagerMock.mockResolvedValue({ error: null });
    await expect(
      createPersonAction(
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          role_player: "on",
          role_coach: "on",
          role_guardian: "on",
          role_manager: "on",
        }),
      ),
    ).rejects.toThrow("redirect:/people/person-new");
    expect(createPlayerMock).toHaveBeenCalled();
    expect(createCoachMock).toHaveBeenCalled();
    expect(createGuardianMock).toHaveBeenCalled();
    expect(createManagerMock).toHaveBeenCalled();
  });

  it("returns the first role-create error", async () => {
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    createPlayerMock.mockResolvedValue({ error: "roster locked" });
    expect(
      await createPersonAction(
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          role_player: "on",
        }),
      ),
    ).toEqual({ error: "roster locked" });
  });
});

describe("deletePersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await deletePersonAction("person-2")).toEqual({
      error: "Not signed in.",
    });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(await deletePersonAction("person-2")).toMatchObject({
      error: expect.stringMatching(/only club management/i),
    });
  });

  it("maps load and delete errors", async () => {
    getPersonMock.mockResolvedValue({ data: null, error: "db" });
    expect(await deletePersonAction("person-2")).toEqual({ error: "db" });

    getPersonMock.mockResolvedValue({ data: null, error: null });
    expect(await deletePersonAction("person-2")).toEqual({
      error: "Person not found.",
    });

    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ id: "person-2", auth_user_id: "other" }),
      error: null,
    });
    deletePersonMock.mockResolvedValue({ error: "still linked" });
    expect(await deletePersonAction("person-2")).toEqual({
      error: "still linked",
    });
  });

  it("blocks deleting your own person record", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({
        id: "person-self",
        auth_user_id: "user-1",
      }),
      error: null,
    });
    const result = await deletePersonAction("person-self");
    expect(result.error).toMatch(/cannot delete your own/i);
    expect(deletePersonMock).not.toHaveBeenCalled();
  });

  it("deletes and redirects", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ id: "person-2", auth_user_id: "other" }),
      error: null,
    });
    deletePersonMock.mockResolvedValue({ error: null });
    await expect(deletePersonAction("person-2")).rejects.toThrow(
      "redirect:/people",
    );
  });
});

describe("reactivatePersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await reactivatePersonAction("person-1")).toEqual({
      error: "Not signed in.",
    });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(await reactivatePersonAction("person-1")).toMatchObject({
      error: expect.stringMatching(/only club management/i),
    });
  });

  it("maps reactivate errors", async () => {
    reactivatePersonMock.mockResolvedValue({ error: "not disabled" });
    expect(await reactivatePersonAction("person-1")).toEqual({
      error: "not disabled",
    });
  });

  it("reactivates a previous member", async () => {
    reactivatePersonMock.mockResolvedValue({ error: null });
    const result = await reactivatePersonAction("person-1");
    expect(result.success).toMatch(/re-activated/i);
    expect(reactivatePersonMock).toHaveBeenCalledWith("person-1");
  });
});

describe("linkRoleToPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    linkRoleToPersonMock.mockResolvedValue({ error: null });
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await linkRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player", role_id: "player-1" }),
      ),
    ).toEqual({ error: "Not signed in." });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(
      await linkRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player", role_id: "player-1" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/only club management/i) });
  });

  it("validates role type and id", async () => {
    expect(
      await linkRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "wizard", role_id: "x" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/valid role/i) });

    expect(
      await linkRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/select a role/i) });
  });

  it("links a role", async () => {
    const result = await linkRoleToPersonAction(
      "person-1",
      {},
      formDataFrom({ role: "player", role_id: "player-1" }),
    );
    expect(result.success).toMatch(/linked/i);
  });

  it("maps link errors", async () => {
    linkRoleToPersonMock.mockResolvedValue({ error: "already taken" });
    expect(
      await linkRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player", role_id: "player-1" }),
      ),
    ).toEqual({ error: "already taken" });
  });
});

describe("addClubRoleToPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    createPlayerMock.mockResolvedValue({ error: null });
  });

  it("requires sign-in, management, and a valid role", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toEqual({ error: "Not signed in." });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/only club management/i) });

    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "wizard" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/valid role/i) });
  });

  it("maps person load errors", async () => {
    getPersonMock.mockResolvedValue({ data: null, error: "db" });
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toEqual({ error: "db" });

    getPersonMock.mockResolvedValue({ data: null, error: null });
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toEqual({ error: "Person not found." });
  });

  it("rejects duplicate active roles", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({
        players: [
          {
            id: "p1",
            club_id: "club-1",
            active_role: true,
            position: null,
            school: null,
            date_of_birth: null,
          },
        ],
      }),
      error: null,
    });
    const result = await addClubRoleToPersonAction(
      "person-1",
      {},
      formDataFrom({ role: "player" }),
    );
    expect(result.error).toMatch(/already has a player role/i);
  });

  it("creates a new club role", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture(),
      error: null,
    });
    const result = await addClubRoleToPersonAction(
      "person-1",
      {},
      formDataFrom({ role: "player" }),
    );
    expect(result.success).toMatch(/added/i);
    expect(createPlayerMock).toHaveBeenCalled();
  });

  it("reactivates an inactive club role", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({
        players: [
          {
            id: "p1",
            club_id: "club-1",
            active_role: false,
            position: null,
            school: null,
            date_of_birth: null,
          },
        ],
      }),
      error: null,
    });
    setPlayerActiveRoleMock.mockResolvedValue({ error: null });
    const result = await addClubRoleToPersonAction(
      "person-1",
      {},
      formDataFrom({ role: "player" }),
    );
    expect(result.success).toMatch(/reactivated/i);
    expect(setPlayerActiveRoleMock).toHaveBeenCalledWith("p1", true);
  });

  it("creates coach, guardian, and manager roles", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture(),
      error: null,
    });
    createCoachMock.mockResolvedValue({ error: null });
    createGuardianMock.mockResolvedValue({ error: null });
    createManagerMock.mockResolvedValue({ error: null });

    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "coach" }),
        )
      ).success,
    ).toMatch(/added/i);
    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "guardian" }),
        )
      ).success,
    ).toMatch(/added/i);
    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "manager" }),
        )
      ).success,
    ).toMatch(/added/i);
  });

  it("reactivates inactive coach, guardian, and manager roles", async () => {
    const inactive = (id: string) => ({
      id,
      club_id: "club-1",
      active_role: false,
    });
    setCoachActiveRoleMock.mockResolvedValue({ error: null });
    setGuardianActiveRoleMock.mockResolvedValue({ error: null });
    setManagerActiveRoleMock.mockResolvedValue({ error: null });

    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ coaches: [inactive("c1")] }),
      error: null,
    });
    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "coach" }),
        )
      ).success,
    ).toMatch(/reactivated/i);

    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ guardians: [inactive("g1")] }),
      error: null,
    });
    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "guardian" }),
        )
      ).success,
    ).toMatch(/reactivated/i);

    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ managers: [inactive("m1")] }),
      error: null,
    });
    expect(
      (
        await addClubRoleToPersonAction(
          "person-1",
          {},
          formDataFrom({ role: "manager" }),
        )
      ).success,
    ).toMatch(/reactivated/i);
  });

  it("maps role-create errors", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture(),
      error: null,
    });
    createPlayerMock.mockResolvedValue({ error: "no roster" });
    expect(
      await addClubRoleToPersonAction(
        "person-1",
        {},
        formDataFrom({ role: "player" }),
      ),
    ).toEqual({ error: "no roster" });
  });
});

describe("removeClubRoleFromPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await removeClubRoleFromPersonAction("person-1", "player", "player-1"),
    ).toEqual({ error: "Not signed in." });

    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(
      await removeClubRoleFromPersonAction("person-1", "player", "player-1"),
    ).toMatchObject({ error: expect.stringMatching(/only club management/i) });
  });

  it("blocks removing your own manager role", async () => {
    getManagerMock.mockResolvedValue({
      data: {
        id: "mgr-1",
        person_id: "person-1",
        user_id: "user-1",
        club_id: "club-1",
      },
      error: null,
    });
    const result = await removeClubRoleFromPersonAction(
      "person-1",
      "manager",
      "mgr-1",
    );
    expect(result.error).toMatch(/cannot remove your own manager/i);
  });

  it("deactivates a player role", async () => {
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1", club_id: "club-1" },
      error: null,
    });
    deletePlayerMock.mockResolvedValue({ error: null });
    const result = await removeClubRoleFromPersonAction(
      "person-1",
      "player",
      "player-1",
    );
    expect(result.success).toMatch(/deactivated/i);
  });

  it("maps missing and failed player/coach/guardian/manager removals", async () => {
    getPlayerMock.mockResolvedValue({ data: null, error: "db" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "player", "player-1"),
    ).toEqual({ error: "db" });
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "other" },
      error: null,
    });
    expect(
      await removeClubRoleFromPersonAction("person-1", "player", "player-1"),
    ).toEqual({ error: "Player role not found for this person." });
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-1" },
      error: null,
    });
    deletePlayerMock.mockResolvedValue({ error: "still in squad" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "player", "player-1"),
    ).toEqual({ error: "still in squad" });

    getCoachMock.mockResolvedValue({ data: null, error: "db" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "coach", "coach-1"),
    ).toEqual({ error: "db" });
    getCoachMock.mockResolvedValue({
      data: { id: "coach-1", person_id: "other" },
      error: null,
    });
    expect(
      await removeClubRoleFromPersonAction("person-1", "coach", "coach-1"),
    ).toEqual({ error: "Coach role not found for this person." });
    getCoachMock.mockResolvedValue({
      data: { id: "coach-1", person_id: "person-1" },
      error: null,
    });
    deleteCoachMock.mockResolvedValue({ error: "still assigned" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "coach", "coach-1"),
    ).toEqual({ error: "still assigned" });
    deleteCoachMock.mockResolvedValue({ error: null });
    expect(
      (await removeClubRoleFromPersonAction("person-1", "coach", "coach-1"))
        .success,
    ).toMatch(/deactivated/i);

    getGuardianMock.mockResolvedValue({
      data: { id: "g-1", person_id: "person-1" },
      error: null,
    });
    deleteGuardianMock.mockResolvedValue({ error: "still linked" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "guardian", "g-1"),
    ).toEqual({ error: "still linked" });
    deleteGuardianMock.mockResolvedValue({ error: null });
    expect(
      (await removeClubRoleFromPersonAction("person-1", "guardian", "g-1"))
        .success,
    ).toMatch(/removed/i);

    getGuardianMock.mockResolvedValue({ data: null, error: null });
    expect(
      await removeClubRoleFromPersonAction("person-1", "guardian", "g-1"),
    ).toEqual({ error: "Guardian role not found for this person." });

    getManagerMock.mockResolvedValue({
      data: { id: "mgr-1", person_id: "person-1", user_id: "other" },
      error: null,
    });
    deleteManagerMock.mockResolvedValue({ error: "last manager" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "manager", "mgr-1"),
    ).toEqual({ error: "last manager" });
    deleteManagerMock.mockResolvedValue({ error: null });
    expect(
      (await removeClubRoleFromPersonAction("person-1", "manager", "mgr-1"))
        .success,
    ).toMatch(/removed/i);

    getManagerMock.mockResolvedValue({ data: null, error: "db" });
    expect(
      await removeClubRoleFromPersonAction("person-1", "manager", "mgr-1"),
    ).toEqual({ error: "db" });
    getManagerMock.mockResolvedValue({
      data: { id: "mgr-1", person_id: "other" },
      error: null,
    });
    expect(
      await removeClubRoleFromPersonAction("person-1", "manager", "mgr-1"),
    ).toEqual({ error: "Manager role not found for this person." });
  });

  it("rejects an unknown role type", async () => {
    expect(
      await removeClubRoleFromPersonAction("person-1", "wizard" as never, "x"),
    ).toMatchObject({ error: expect.stringMatching(/valid role/i) });
  });
});

describe("sendInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture(),
      error: null,
    });
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await sendInvitationAction("person-1")).toEqual({
      error: "Not signed in.",
    });
    getViewerContextMock.mockResolvedValue(viewerFixture());
    expect(await sendInvitationAction("person-1")).toMatchObject({
      error: expect.stringMatching(/only club management/i),
    });
  });

  it("maps person load errors", async () => {
    getPersonMock.mockResolvedValue({ data: null, error: "db" });
    expect(await sendInvitationAction("person-1")).toEqual({ error: "db" });
    getPersonMock.mockResolvedValue({ data: null, error: null });
    expect(await sendInvitationAction("person-1")).toEqual({
      error: "Person not found.",
    });
  });

  it("returns invitation success when email is sent", async () => {
    sendPersonInvitationMock.mockResolvedValue({
      ok: true,
      emailSent: true,
    });
    const result = await sendInvitationAction("person-1");
    expect(result.success).toBe("Invitation sent.");
  });

  it("explains when an auth account already exists", async () => {
    sendPersonInvitationMock.mockResolvedValue({
      ok: true,
      emailSent: false,
      alreadyRegistered: true,
      acceptUrl: "https://example.com/accept",
    });
    const result = await sendInvitationAction("person-1");
    expect(result.success).toMatch(/already exists/i);
    expect(result.success).toMatch(/accept link/i);
  });

  it("surfaces thrown service-role failures", async () => {
    sendPersonInvitationMock.mockRejectedValue(new Error("missing key"));
    const result = await sendInvitationAction("person-1");
    expect(result.error).toBe("missing key");
  });

  it("maps invitation failures and unsent email copy", async () => {
    sendPersonInvitationMock.mockResolvedValue({
      ok: false,
      error: "no email",
    });
    expect(await sendInvitationAction("person-1")).toEqual({
      error: "no email",
    });

    sendPersonInvitationMock.mockResolvedValue({
      ok: true,
      emailSent: false,
      emailError: "rate limited",
      acceptUrl: "https://example.com/accept",
    });
    expect((await sendInvitationAction("person-1")).success).toMatch(
      /rate limited/i,
    );

    sendPersonInvitationMock.mockResolvedValue({
      ok: true,
      emailSent: false,
    });
    expect((await sendInvitationAction("person-1")).success).toMatch(
      /may need configuration/i,
    );

    sendPersonInvitationMock.mockRejectedValue("boom");
    expect(await sendInvitationAction("person-1")).toEqual({
      error: "Could not send invitation (service role key required).",
    });
  });
});

describe("completePersonProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    updatePersonMock.mockResolvedValue({ error: null });
  });

  it("requires sign-in", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await completePersonProfileAction(
        {},
        formDataFrom({ person_id: "person-1" }),
      ),
    ).toEqual({ error: "Not signed in." });
  });

  it("only allows the linked auth user", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ auth_user_id: "someone-else" }),
      error: null,
    });
    const result = await completePersonProfileAction(
      {},
      formDataFrom({
        person_id: "person-1",
        first_name: "Ada",
        last_name: "Lovelace",
      }),
    );
    expect(result.error).toMatch(/only complete your own/i);
  });

  it("updates and redirects to dashboard", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ auth_user_id: "user-1" }),
      error: null,
    });
    await expect(
      completePersonProfileAction(
        {},
        formDataFrom({
          person_id: "person-1",
          first_name: "Ada",
          last_name: "Lovelace",
        }),
      ),
    ).rejects.toThrow("redirect:/dashboard");
  });

  it("requires a person id and maps load/update errors", async () => {
    expect(
      await completePersonProfileAction({}, formDataFrom({})),
    ).toMatchObject({ error: expect.stringMatching(/person is required/i) });

    getPersonMock.mockResolvedValue({ data: null, error: "db" });
    expect(
      await completePersonProfileAction(
        {},
        formDataFrom({ person_id: "person-1" }),
      ),
    ).toEqual({ error: "db" });

    getPersonMock.mockResolvedValue({ data: null, error: null });
    expect(
      await completePersonProfileAction(
        {},
        formDataFrom({ person_id: "person-1" }),
      ),
    ).toEqual({ error: "Person not found." });

    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ auth_user_id: "user-1" }),
      error: null,
    });
    expect(
      await completePersonProfileAction(
        {},
        formDataFrom({ person_id: "person-1", first_name: "Ada" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/first and last name/i) });

    updatePersonMock.mockResolvedValue({ error: "write failed" });
    expect(
      await completePersonProfileAction(
        {},
        formDataFrom({
          person_id: "person-1",
          first_name: "Ada",
          last_name: "Lovelace",
        }),
      ),
    ).toEqual({ error: "write failed" });
  });
});

const playerRole = {
  id: "player-1",
  club_id: "club-1",
  active_role: true,
  position: "FWD" as const,
  school: "Ridge",
  date_of_birth: "2014-01-01",
};

describe("updatePersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({ players: [playerRole] }),
      error: null,
    });
    updatePersonMock.mockResolvedValue({ error: null });
    updatePlayerMock.mockResolvedValue({ error: null });
    getPlayerMock.mockResolvedValue({
      data: {
        id: "player-1",
        person_id: "person-1",
        club_id: "club-1",
        position: "MID",
      },
      error: null,
    });
  });

  it("requires sign-in and a loadable person", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await updatePersonAction("person-1", {}, formDataFrom({}))).toEqual({
      error: "Not signed in.",
    });

    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPersonMock.mockResolvedValue({ data: null, error: "db" });
    expect(await updatePersonAction("person-1", {}, formDataFrom({}))).toEqual({
      error: "db",
    });

    getPersonMock.mockResolvedValue({ data: null, error: null });
    expect(await updatePersonAction("person-1", {}, formDataFrom({}))).toEqual({
      error: "Person not found.",
    });
  });

  it("rejects viewers who cannot edit the person", async () => {
    getViewerContextMock.mockResolvedValue(viewerFixture());
    const result = await updatePersonAction(
      "person-1",
      {},
      formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
    );
    expect(result.error).toMatch(/cannot edit this person/i);
  });

  it("returns person and player parse errors", async () => {
    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({ first_name: "Ada" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/first and last name/i) });

    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
          position: "STRIKER",
        }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/valid position/i) });
  });

  it("rejects a player role that does not belong to the person", async () => {
    const result = await updatePersonAction(
      "person-1",
      {},
      formDataFrom({
        first_name: "Ada",
        last_name: "Lovelace",
        player_id: "player-other",
      }),
    );
    expect(result.error).toMatch(/player role not found/i);
  });

  it("maps player load errors and person mismatches", async () => {
    getPlayerMock.mockResolvedValue({ data: null, error: "player db" });
    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
        }),
      ),
    ).toEqual({ error: "player db" });

    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "other", club_id: "club-1" },
      error: null,
    });
    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
        }),
      ),
    ).toEqual({ error: "Player role not found for this person." });
  });

  it("updates person and player as club management then redirects", async () => {
    updatePersonMock.mockResolvedValue({ error: null });
    await expect(
      updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
          date_of_birth: "2014-01-01",
          position: "FWD",
          school: "Ridge",
        }),
      ),
    ).rejects.toThrow("redirect:/people/person-1");
    expect(updatePlayerMock).toHaveBeenCalledWith(
      "player-1",
      expect.objectContaining({ position: "FWD", school: "Ridge" }),
    );
  });

  it("lets a guardian edit DOB and school but not position", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ guardianPlayerIds: ["player-1"] }),
    );
    await expect(
      updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
          date_of_birth: "2014-06-02",
          position: "FWD",
          school: "Hill",
        }),
      ),
    ).rejects.toThrow("redirect:/people/person-1");
    expect(updatePlayerMock).toHaveBeenCalledWith(
      "player-1",
      expect.objectContaining({
        position: "MID",
        school: "Hill",
        date_of_birth: "2014-06-02",
      }),
    );
  });

  it("maps updatePerson and updatePlayer errors", async () => {
    updatePersonMock.mockResolvedValue({ error: "person write" });
    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({ first_name: "Ada", last_name: "Lovelace" }),
      ),
    ).toEqual({ error: "person write" });

    updatePersonMock.mockResolvedValue({ error: null });
    updatePlayerMock.mockResolvedValue({ error: "player write" });
    expect(
      await updatePersonAction(
        "person-1",
        {},
        formDataFrom({
          first_name: "Ada",
          last_name: "Lovelace",
          player_id: "player-1",
        }),
      ),
    ).toEqual({ error: "player write" });
  });
});
