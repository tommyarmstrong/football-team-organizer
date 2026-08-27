import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clubManagerViewer,
  personFixture,
  viewerFixture,
} from "@/test/fixtures";

const {
  notFoundMock,
  getViewerContextMock,
  getGuardianMock,
  getGuardianPlayersMock,
  listPlayersMock,
} = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("notFound");
  }),
  getViewerContextMock: vi.fn(),
  getGuardianMock: vi.fn(),
  getGuardianPlayersMock: vi.fn(),
  listPlayersMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/guardians", () => ({
  getGuardian: getGuardianMock,
  getGuardianPlayers: getGuardianPlayersMock,
}));
vi.mock("@/lib/data/players", () => ({ listPlayers: listPlayersMock }));
vi.mock("@/components/guardians/guardian-players-section", () => ({
  GuardianPlayersSection: (props: Record<string, unknown>) => ({
    type: "GuardianPlayersSection",
    props,
  }),
}));
vi.mock("@/components/guardians/guardian-form", () => ({
  GuardianForm: (props: Record<string, unknown>) => ({
    type: "GuardianForm",
    props,
  }),
}));
vi.mock("@/components/guardians/delete-guardian-button", () => ({
  DeleteGuardianButton: (props: Record<string, unknown>) => ({
    type: "DeleteGuardianButton",
    props,
  }),
}));

import GuardianDetailPage from "@/app/(app)/guardians/[id]/page";

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

const guardian = {
  id: "g-1",
  club_id: "club-1",
  person_id: "person-g",
  first_name: "Pat",
  last_name: "Parent",
  email: "pat@example.com",
  phone: null,
  person: personFixture({
    id: "person-g",
    first_name: "Pat",
    last_name: "Parent",
  }),
};

describe("GuardianDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getGuardianMock.mockResolvedValue({ data: guardian, error: null });
    getGuardianPlayersMock.mockResolvedValue({
      data: [
        {
          player_guardian_id: "link-1",
          player_id: "player-1",
          player_person_id: "person-p",
          player_first_name: "Ada",
          player_last_name: "Lovelace",
          relationship: "parent",
          legal_guardian: true,
          emergency_contact: true,
        },
      ],
    });
    listPlayersMock.mockResolvedValue({
      data: [
        {
          id: "player-1",
          club_id: "club-1",
          first_name: "Ada",
          last_name: "Lovelace",
        },
        {
          id: "player-2",
          club_id: "club-1",
          first_name: "Sam",
          last_name: "Squad",
        },
      ],
    });
  });

  it("shows an error when the guardian cannot be loaded", async () => {
    getGuardianMock.mockResolvedValue({ data: null, error: "load failed" });
    const tree = await GuardianDetailPage({
      params: Promise.resolve({ id: "g-1" }),
    });
    expect(JSON.stringify(tree)).toContain("load failed");
  });

  it("not-founds a missing guardian or unsigned-in viewer", async () => {
    getGuardianMock.mockResolvedValue({ data: null, error: null });
    await expect(
      GuardianDetailPage({ params: Promise.resolve({ id: "g-1" }) }),
    ).rejects.toThrow("notFound");

    getGuardianMock.mockResolvedValue({ data: guardian, error: null });
    getViewerContextMock.mockResolvedValue(null);
    await expect(
      GuardianDetailPage({ params: Promise.resolve({ id: "g-1" }) }),
    ).rejects.toThrow("notFound");
  });

  it("lets club managers add and remove player links", async () => {
    const tree = await GuardianDetailPage({
      params: Promise.resolve({ id: "g-1" }),
    });
    const sections = findNamed(tree, "GuardianPlayersSection");
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      guardianId: "g-1",
      canManageLinks: true,
      selfGuardianIds: [],
    });
    expect(sections[0].availablePlayers).toEqual([
      {
        id: "player-2",
        club_id: "club-1",
        first_name: "Sam",
        last_name: "Squad",
      },
    ]);
    expect(findNamed(tree, "GuardianForm")).toHaveLength(1);
    expect(findNamed(tree, "DeleteGuardianButton")).toHaveLength(1);
    expect(listPlayersMock).toHaveBeenCalled();
  });

  it("lets a linked guardian edit their own links but not add or unlink", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        personId: "person-g",
        coachTeamIds: [],
        editableTeamIds: [],
        managementClubIds: [],
        guardianPlayerIds: ["player-1"],
        guardianIds: ["g-1"],
      }),
    );

    const tree = await GuardianDetailPage({
      params: Promise.resolve({ id: "g-1" }),
    });
    const sections = findNamed(tree, "GuardianPlayersSection");
    expect(sections[0]).toMatchObject({
      guardianId: "g-1",
      canManageLinks: false,
      selfGuardianIds: ["g-1"],
      availablePlayers: [],
    });
    expect(findNamed(tree, "GuardianForm")).toHaveLength(0);
    expect(findNamed(tree, "DeleteGuardianButton")).toHaveLength(0);
    expect(listPlayersMock).not.toHaveBeenCalled();
  });
});
