import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { clubManagerViewer, viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  getPrimaryClubMock,
  createManagerMock,
  updateManagerMock,
  getManagerMock,
  deletePersonMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  createManagerMock: vi.fn(),
  updateManagerMock: vi.fn(),
  getManagerMock: vi.fn(),
  deletePersonMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/managers", () => ({
  createManager: createManagerMock,
  updateManager: updateManagerMock,
  getManager: getManagerMock,
}));
vi.mock("@/lib/data/people", () => ({
  deletePerson: deletePersonMock,
}));

import {
  createManagerAction,
  deleteManagerAction,
  updateManagerAction,
} from "@/lib/managers/actions";

const managerForm = formDataFrom({
  first_name: "Mo",
  second_name: "Manager",
});

describe("manager actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue({ id: "club-1", name: "Club" });
    createManagerMock.mockResolvedValue({
      data: { id: "mgr-1" },
      error: null,
    });
    updateManagerMock.mockResolvedValue({ error: null });
    deletePersonMock.mockResolvedValue({ error: null });
    getManagerMock.mockResolvedValue({
      data: {
        id: "mgr-1",
        club_id: "club-1",
        person_id: "person-mgr",
        user_id: "other-user",
      },
      error: null,
    });
  });

  it("requires sign-in and club management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await createManagerAction({}, managerForm)).toMatchObject({
      error: expect.stringMatching(/not signed in/i),
    });

    getViewerContextMock.mockResolvedValue(
      viewerFixture({ managementClubIds: [], isManagement: false }),
    );
    expect(await createManagerAction({}, managerForm)).toMatchObject({
      error: expect.stringMatching(/only club management/i),
    });
  });

  it("validates form and creates", async () => {
    expect(
      await createManagerAction({}, formDataFrom({ first_name: "Mo" })),
    ).toMatchObject({ error: expect.stringMatching(/required/i) });

    await expect(createManagerAction({}, managerForm)).rejects.toThrow(
      "redirect:/managers/mgr-1",
    );
  });

  it("updates and deletes managers", async () => {
    await expect(updateManagerAction("mgr-1", {}, managerForm)).rejects.toThrow(
      "redirect:/managers/mgr-1",
    );

    await expect(deleteManagerAction("mgr-1")).rejects.toThrow(
      "redirect:/club",
    );
  });

  it("blocks self-delete", async () => {
    getManagerMock.mockResolvedValue({
      data: {
        id: "mgr-1",
        club_id: "club-1",
        person_id: "person-mgr",
        user_id: "user-1",
      },
      error: null,
    });
    expect(await deleteManagerAction("mgr-1")).toMatchObject({
      error: expect.stringMatching(/your own manager/i),
    });
  });

  it("maps not-found and load errors", async () => {
    getManagerMock.mockResolvedValue({ data: null, error: "db" });
    expect(await updateManagerAction("mgr-1", {}, managerForm)).toEqual({
      error: "db",
    });

    getManagerMock.mockResolvedValue({ data: null, error: null });
    expect(await deleteManagerAction("mgr-1")).toEqual({
      error: "Manager not found.",
    });
  });
});
