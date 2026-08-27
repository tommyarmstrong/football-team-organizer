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
  getPerson: getPersonMock,
  updatePerson: updatePersonMock,
  linkRoleToPerson: linkRoleToPersonMock,
}));
vi.mock("@/lib/data/players", () => ({
  createPlayer: createPlayerMock,
  deletePlayer: deletePlayerMock,
  getPlayer: getPlayerMock,
  setPlayerActiveRole: setPlayerActiveRoleMock,
  updatePlayer: vi.fn(),
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
  removeClubRoleFromPersonAction,
  sendInvitationAction,
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
});

describe("deletePersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
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

describe("linkRoleToPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    linkRoleToPersonMock.mockResolvedValue({ error: null });
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
});

describe("addClubRoleToPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
    createPlayerMock.mockResolvedValue({ error: null });
  });

  it("rejects duplicate active roles", async () => {
    getPersonMock.mockResolvedValue({
      data: personWithRolesFixture({
        players: [{ id: "p1", club_id: "club-1", active_role: true }],
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
});

describe("removeClubRoleFromPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue(club);
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
});

describe("completePersonProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    updatePersonMock.mockResolvedValue({ error: null });
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
});
