import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, deleteUserMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  deleteUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { deleteAuthUserById } from "@/lib/people/delete-auth-user";

describe("deleteAuthUserById", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    deleteUserMock.mockReset();
    createAdminClientMock.mockReturnValue({
      auth: { admin: { deleteUser: deleteUserMock } },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deletes the auth user and returns no error on success", async () => {
    deleteUserMock.mockResolvedValue({ error: null });

    const result = await deleteAuthUserById("auth-1");

    expect(deleteUserMock).toHaveBeenCalledWith("auth-1");
    expect(result).toEqual({ error: null });
  });

  it("returns the Supabase error message when deletion fails", async () => {
    deleteUserMock.mockResolvedValue({
      error: { message: "User not found" },
    });

    const result = await deleteAuthUserById("missing");
    expect(result).toEqual({ error: "User not found" });
  });

  it("returns a friendly message when the admin client cannot be created", async () => {
    createAdminClientMock.mockImplementation(() => {
      throw new Error("SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY");
    });

    const result = await deleteAuthUserById("auth-1");
    expect(result.error).toMatch(/SERVER-ONLY/);
  });

  it("handles non-Error throws from the admin client", async () => {
    createAdminClientMock.mockImplementation(() => {
      throw "broken";
    });

    const result = await deleteAuthUserById("auth-1");
    expect(result).toEqual({
      error: "Could not delete auth user (service role key required).",
    });
  });
});
