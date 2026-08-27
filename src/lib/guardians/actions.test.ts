import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { clubManagerViewer, viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getActiveTeamMock,
  resolveStaffClubIdMock,
  createGuardianMock,
  updateGuardianMock,
  deleteGuardianMock,
  getGuardianMock,
  deletePersonMock,
  getViewerContextMock,
  linkGuardianToPlayerMock,
  unlinkGuardianFromPlayerMock,
  updateGuardianPlayerLinkMock,
  getPlayerMock,
  getPlayerTeamsMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getActiveTeamMock: vi.fn(),
  resolveStaffClubIdMock: vi.fn(),
  createGuardianMock: vi.fn(),
  updateGuardianMock: vi.fn(),
  deleteGuardianMock: vi.fn(),
  getGuardianMock: vi.fn(),
  deletePersonMock: vi.fn(),
  getViewerContextMock: vi.fn(),
  linkGuardianToPlayerMock: vi.fn(),
  unlinkGuardianFromPlayerMock: vi.fn(),
  updateGuardianPlayerLinkMock: vi.fn(),
  getPlayerMock: vi.fn(),
  getPlayerTeamsMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));
vi.mock("@/lib/data/clubs", () => ({
  resolveStaffClubId: resolveStaffClubIdMock,
}));
vi.mock("@/lib/data/people", () => ({ deletePerson: deletePersonMock }));
vi.mock("@/lib/data/guardians", () => ({
  createGuardian: createGuardianMock,
  updateGuardian: updateGuardianMock,
  deleteGuardian: deleteGuardianMock,
  getGuardian: getGuardianMock,
  linkGuardianToPlayer: linkGuardianToPlayerMock,
  unlinkGuardianFromPlayer: unlinkGuardianFromPlayerMock,
  updateGuardianPlayerLink: updateGuardianPlayerLinkMock,
}));
vi.mock("@/lib/data/players", () => ({
  getPlayer: getPlayerMock,
  getPlayerTeams: getPlayerTeamsMock,
}));

import {
  createGuardianAction,
  deleteGuardianAction,
  linkGuardianToPlayerAction,
  linkPlayerToGuardianAction,
  unlinkGuardianFromPlayerAction,
  updateGuardianAction,
  updateGuardianPlayerLinkAction,
} from "@/lib/guardians/actions";

const guardianForm = formDataFrom({
  first_name: "Pat",
  second_name: "Parent",
});

const linkForm = formDataFrom({
  player_id: "player-1",
  relationship: "parent",
  legal_guardian: "on",
  emergency_contact: "on",
});

describe("guardian actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue({ id: "team-1", club_id: "club-1" });
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    resolveStaffClubIdMock.mockResolvedValue("club-1");
    createGuardianMock.mockResolvedValue({
      data: { id: "g-1" },
      error: null,
    });
    updateGuardianMock.mockResolvedValue({ error: null });
    deleteGuardianMock.mockResolvedValue({ error: null });
    deletePersonMock.mockResolvedValue({ error: null });
    getGuardianMock.mockResolvedValue({
      data: {
        id: "g-1",
        person_id: "person-g",
        club_id: "club-1",
        user_id: "other-user",
      },
      error: null,
    });
    getPlayerMock.mockResolvedValue({
      data: { id: "player-1", person_id: "person-p", club_id: "club-1" },
      error: null,
    });
    getPlayerTeamsMock.mockResolvedValue({ data: [{ team_id: "team-1" }] });
    linkGuardianToPlayerMock.mockResolvedValue({ error: null });
    unlinkGuardianFromPlayerMock.mockResolvedValue({ error: null });
    updateGuardianPlayerLinkMock.mockResolvedValue({ error: null });
  });

  it("creates, updates, and deletes guardians", async () => {
    resolveStaffClubIdMock.mockResolvedValueOnce(null);
    expect(await createGuardianAction({}, guardianForm)).toMatchObject({
      error: expect.stringMatching(/no club/i),
    });

    resolveStaffClubIdMock.mockResolvedValue("club-1");
    await expect(createGuardianAction({}, guardianForm)).rejects.toThrow(
      "redirect:/guardians/g-1",
    );

    await expect(updateGuardianAction("g-1", {}, guardianForm)).rejects.toThrow(
      "redirect:/guardians/g-1",
    );

    await expect(deleteGuardianAction("g-1")).rejects.toThrow("redirect:/club");
  });

  it("links players both directions and updates/unlinks", async () => {
    expect(await linkGuardianToPlayerAction("g-1", {}, linkForm)).toMatchObject(
      { success: expect.stringMatching(/player linked/i) },
    );

    expect(
      await linkPlayerToGuardianAction(
        "player-1",
        {},
        formDataFrom({
          guardian_id: "g-1",
          relationship: "guardian",
        }),
      ),
    ).toMatchObject({ success: expect.stringMatching(/guardian linked/i) });

    expect(
      await updateGuardianPlayerLinkAction(
        "link-1",
        "g-1",
        "player-1",
        {},
        formDataFrom({ relationship: "other" }),
      ),
    ).toMatchObject({ success: expect.stringMatching(/link updated/i) });

    expect(
      await unlinkGuardianFromPlayerAction("link-1", "g-1", "player-1"),
    ).toMatchObject({ success: expect.stringMatching(/unlinked/i) });
  });

  it("validates link form fields", async () => {
    expect(
      await linkGuardianToPlayerAction("g-1", {}, formDataFrom({})),
    ).toMatchObject({ error: expect.stringMatching(/select a player/i) });

    expect(
      await linkPlayerToGuardianAction("player-1", {}, formDataFrom({})),
    ).toMatchObject({ error: expect.stringMatching(/select a guardian/i) });

    expect(
      await linkGuardianToPlayerAction(
        "g-1",
        {},
        formDataFrom({ player_id: "player-1", relationship: "cousin" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/relationship/i) });
  });

  it("rejects guardian link management from non-staff viewers", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
      }),
    );

    expect(await linkGuardianToPlayerAction("g-1", {}, linkForm)).toMatchObject(
      { error: expect.stringMatching(/club staff/i) },
    );
    expect(
      await linkPlayerToGuardianAction(
        "player-1",
        {},
        formDataFrom({ guardian_id: "g-1", relationship: "parent" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/club staff/i) });
    expect(
      await unlinkGuardianFromPlayerAction("link-1", "g-1", "player-1"),
    ).toMatchObject({ error: expect.stringMatching(/club staff/i) });
  });

  it("lets a linked guardian update their own relationship", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
      }),
    );

    expect(
      await updateGuardianPlayerLinkAction(
        "link-1",
        "g-1",
        "player-1",
        {},
        formDataFrom({ relationship: "parent", legal_guardian: "on" }),
      ),
    ).toMatchObject({ success: expect.stringMatching(/link updated/i) });
    expect(updateGuardianPlayerLinkMock).toHaveBeenCalled();
  });

  it("rejects guardian updates to another guardian's link", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
      }),
    );

    expect(
      await updateGuardianPlayerLinkAction(
        "link-1",
        "g-other",
        "player-1",
        {},
        formDataFrom({ relationship: "parent" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/cannot edit/i) });
  });
});
