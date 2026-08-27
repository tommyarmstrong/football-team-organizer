import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";

const { createClientMock, createPersonMock, updatePersonMock } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    createPersonMock: vi.fn(),
    updatePersonMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  updatePerson: updatePersonMock,
}));

import {
  createManager,
  deleteManager,
  getManager,
  listManagers,
  setManagerActiveRole,
  updateManager,
} from "@/lib/data/managers";

const managerRow = {
  id: "mgr-1",
  club_id: "club-1",
  person_id: "person-1",
  notes: null,
  active_role: true,
  user_id: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  person: personFixture({
    id: "person-1",
    first_name: "Mo",
    last_name: "Boss",
  }),
};

describe("managers data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    updatePersonMock.mockResolvedValue({ error: null });
  });

  it("lists and gets managers", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ managers: okResult([managerRow]) }),
    );
    const listed = await listManagers("club-1");
    expect(listed.data[0]?.first_name).toBe("Mo");

    createClientMock.mockResolvedValue(
      mockFromClient({ managers: okResult(managerRow) }),
    );
    expect((await getManager("mgr-1")).data?.id).toBe("mgr-1");
  });

  it("creates, updates, toggles, and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ managers: okResult(managerRow) }),
    );
    expect(
      (
        await createManager({
          club_id: "club-1",
          first_name: "Mo",
          second_name: "Boss",
        })
      ).data?.id,
    ).toBe("mgr-1");
    expect(createPersonMock).toHaveBeenCalled();

    createClientMock.mockResolvedValue(
      mockFromClient({
        managers: [okResult(managerRow), okResult(managerRow)],
      }),
    );
    expect(
      (
        await updateManager("mgr-1", {
          first_name: "Mo",
          second_name: "Boss",
          notes: "Note",
        })
      ).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ managers: okResult(null) }),
    );
    expect(await setManagerActiveRole("mgr-1", false)).toEqual({
      error: null,
    });
    expect(await deleteManager("mgr-1")).toEqual({ error: null });
  });

  it("maps list errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ managers: errResult("boom") }),
    );
    expect(await listManagers()).toEqual({ data: [], error: "boom" });
  });
});
