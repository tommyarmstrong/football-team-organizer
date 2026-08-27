import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clubManagerViewer,
  personWithRolesFixture,
  teamFixture,
  viewerFixture,
} from "@/test/fixtures";

const {
  notFoundMock,
  redirectMock,
  getViewerContextMock,
  getPrimaryClubMock,
  getPersonMock,
  getPlayerTeamsMock,
  listPlayersMock,
  getPlayerGuardiansMock,
  getGuardianPlayersMock,
  listGuardiansMock,
  listPlayerObjectivesMock,
  getCoachMock,
  getCoachTeamsMock,
  listCoachObjectivesMock,
} = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("notFound");
  }),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  getPersonMock: vi.fn(),
  getPlayerTeamsMock: vi.fn(),
  listPlayersMock: vi.fn(),
  getPlayerGuardiansMock: vi.fn(),
  getGuardianPlayersMock: vi.fn(),
  listGuardiansMock: vi.fn(),
  listPlayerObjectivesMock: vi.fn(),
  getCoachMock: vi.fn(),
  getCoachTeamsMock: vi.fn(),
  listCoachObjectivesMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/people", () => ({ getPerson: getPersonMock }));
vi.mock("@/lib/data/players", () => ({
  getPlayerTeams: getPlayerTeamsMock,
  listPlayers: listPlayersMock,
}));
vi.mock("@/lib/data/guardians", () => ({
  getPlayerGuardians: getPlayerGuardiansMock,
  getGuardianPlayers: getGuardianPlayersMock,
  listGuardians: listGuardiansMock,
}));
vi.mock("@/lib/data/player-objectives", () => ({
  listPlayerObjectives: listPlayerObjectivesMock,
}));
vi.mock("@/lib/data/coaches", () => ({
  getCoach: getCoachMock,
  getCoachTeams: getCoachTeamsMock,
}));
vi.mock("@/lib/data/coach-objectives", () => ({
  listCoachObjectives: listCoachObjectivesMock,
}));
vi.mock("@/components/players/player-guardians-section", () => ({
  PlayerGuardiansSection: (props: Record<string, unknown>) => ({
    type: "PlayerGuardiansSection",
    props,
  }),
}));
vi.mock("@/components/guardians/guardian-players-section", () => ({
  GuardianPlayersSection: (props: Record<string, unknown>) => ({
    type: "GuardianPlayersSection",
    props,
  }),
}));
vi.mock("@/components/people/delete-person-button", () => ({
  DeletePersonButton: () => null,
}));
vi.mock("@/components/people/reactivate-person-button", () => ({
  ReactivatePersonButton: () => null,
}));
vi.mock("@/components/people/person-admin-panels", () => ({
  PersonClubRolesSection: () => null,
  PersonInvitationPanel: () => null,
}));
vi.mock("@/components/players/player-teams-section", () => ({
  PlayerTeamsSection: () => null,
}));
vi.mock("@/components/coaches/coach-teams-section", () => ({
  CoachTeamsSection: () => null,
}));
vi.mock("@/components/players/player-objectives-section", () => ({
  PlayerObjectivesSection: () => null,
}));
vi.mock("@/components/coaches/coach-objectives-section", () => ({
  CoachObjectivesSection: () => null,
}));

import PersonDetailPage from "@/app/(app)/people/[id]/page";

function findNamed(node: unknown, name: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const el = value as { type?: unknown; props?: Record<string, unknown> };
    const typeName =
      typeof el.type === "string"
        ? el.type
        : typeof el.type === "function"
          ? el.type.name
          : undefined;
    if (typeName === name && el.props) found.push(el.props);
    if (el.props) {
      for (const child of Object.values(el.props)) visit(child);
    }
  };
  visit(node);
  return found;
}

const playerPerson = personWithRolesFixture({
  id: "person-p",
  first_name: "Ada",
  last_name: "Lovelace",
  players: [
    {
      id: "player-1",
      club_id: "club-1",
      active_role: true,
      position: null,
      school: null,
      date_of_birth: null,
    },
  ],
});

const guardianPerson = personWithRolesFixture({
  id: "person-g",
  first_name: "Pat",
  last_name: "Parent",
  auth_user_id: "user-g",
  guardians: [{ id: "g-1", club_id: "club-1", active_role: true }],
});

const playerGuardianLink = {
  player_guardian_id: "link-1",
  guardian_id: "g-1",
  guardian_person_id: "person-g",
  first_name: "Pat",
  second_name: "Parent",
  phone: null,
  relationship: "parent" as const,
  legal_guardian: true,
  emergency_contact: true,
};

const guardianPlayerLink = {
  player_guardian_id: "link-1",
  player_id: "player-1",
  player_person_id: "person-p",
  player_first_name: "Ada",
  player_last_name: "Lovelace",
  relationship: "parent" as const,
  legal_guardian: true,
  emergency_contact: true,
};

describe("PersonDetailPage guardian relationships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPrimaryClubMock.mockResolvedValue({ id: "club-1", name: "Example FC" });
    getPlayerTeamsMock.mockResolvedValue({ data: [{ team_id: "team-1" }] });
    getPlayerGuardiansMock.mockResolvedValue({ data: [playerGuardianLink] });
    getGuardianPlayersMock.mockResolvedValue({ data: [guardianPlayerLink] });
    listPlayerObjectivesMock.mockResolvedValue({ data: [], error: null });
    listPlayersMock.mockResolvedValue({ data: [] });
    listGuardiansMock.mockResolvedValue({ data: [] });
    getCoachMock.mockResolvedValue({ data: null, error: null });
    getCoachTeamsMock.mockResolvedValue({ data: [] });
    listCoachObjectivesMock.mockResolvedValue({ data: [], error: null });
  });

  it("shows an error when the person cannot be loaded", async () => {
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPersonMock.mockResolvedValue({ data: null, error: "load failed" });
    const tree = await PersonDetailPage({
      params: Promise.resolve({ id: "person-p" }),
    });
    expect(JSON.stringify(tree)).toContain("load failed");
  });

  it("not-founds when there is no viewer or person", async () => {
    getViewerContextMock.mockResolvedValue(null);
    await expect(
      PersonDetailPage({ params: Promise.resolve({ id: "person-p" }) }),
    ).rejects.toThrow("notFound");

    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPersonMock.mockResolvedValue({ data: null, error: null });
    await expect(
      PersonDetailPage({ params: Promise.resolve({ id: "person-p" }) }),
    ).rejects.toThrow("notFound");
  });

  it("lets club managers manage guardian links on a player", async () => {
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPersonMock.mockResolvedValue({ data: playerPerson, error: null });
    listGuardiansMock.mockResolvedValue({
      data: [
        {
          id: "g-1",
          club_id: "club-1",
          first_name: "Pat",
          last_name: "Parent",
        },
        {
          id: "g-2",
          club_id: "club-1",
          first_name: "Other",
          last_name: "Adult",
        },
      ],
    });

    const tree = await PersonDetailPage({
      params: Promise.resolve({ id: "person-p" }),
    });
    const sections = findNamed(tree, "PlayerGuardiansSection");
    expect(sections[0]).toMatchObject({
      playerId: "player-1",
      canManageLinks: true,
      selfGuardianIds: [],
    });
    expect(sections[0].availableGuardians).toEqual([
      { id: "g-2", club_id: "club-1", first_name: "Other", last_name: "Adult" },
    ]);
  });

  it("passes the viewer's guardian ids so they can edit their own player link", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        userId: "user-g",
        personId: "person-g",
        coachTeamIds: [],
        editableTeamIds: [],
        managementClubIds: [],
        isManagement: false,
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
        visibleTeams: [teamFixture()],
      }),
    );
    getPersonMock.mockResolvedValue({ data: playerPerson, error: null });

    const tree = await PersonDetailPage({
      params: Promise.resolve({ id: "person-p" }),
    });
    const sections = findNamed(tree, "PlayerGuardiansSection");
    expect(sections[0]).toMatchObject({
      playerId: "player-1",
      canManageLinks: false,
      selfGuardianIds: ["g-1"],
      availableGuardians: [],
    });
    expect(listGuardiansMock).not.toHaveBeenCalled();
  });

  it("passes the viewer's guardian ids on their own player-relationships section", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        userId: "user-g",
        personId: "person-g",
        coachTeamIds: [],
        editableTeamIds: [],
        managementClubIds: [],
        isManagement: false,
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
        visibleTeams: [teamFixture()],
      }),
    );
    getPersonMock.mockResolvedValue({ data: guardianPerson, error: null });

    const tree = await PersonDetailPage({
      params: Promise.resolve({ id: "person-g" }),
    });
    const sections = findNamed(tree, "GuardianPlayersSection");
    expect(sections[0]).toMatchObject({
      guardianId: "g-1",
      canManageLinks: false,
      selfGuardianIds: ["g-1"],
      availablePlayers: [],
    });
    expect(listPlayersMock).not.toHaveBeenCalled();
  });
});
