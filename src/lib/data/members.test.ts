import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  addTeamMember,
  listGuardianAssistantCandidates,
  listGuardianAssistants,
  listTeamMembers,
  removeTeamMember,
} from "@/lib/data/members";

describe("members data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists team members", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_members: okResult([
          { id: "tm-1", team_id: "team-1", user_id: "u1", role: "coach" },
        ]),
      }),
    );
    expect((await listTeamMembers("team-1")).data).toHaveLength(1);
  });

  it("lists guardian assistants with names", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_members: okResult([
          {
            id: "tm-1",
            team_id: "team-1",
            user_id: "auth-1",
            role: "guardian_assistant",
          },
        ]),
        guardians: okResult([
          {
            id: "g-1",
            person: personFixture({
              id: "person-1",
              auth_user_id: "auth-1",
              first_name: "Pat",
              last_name: "Parent",
            }),
          },
        ]),
      }),
    );
    const result = await listGuardianAssistants("team-1", "club-1");
    expect(result.data[0]).toMatchObject({
      guardian_id: "g-1",
      name: "Pat Parent",
    });
  });

  it("lists assistant candidates excluding assigned users", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        guardians: okResult([
          {
            id: "g-1",
            person: personFixture({
              auth_user_id: "auth-1",
              first_name: "A",
              last_name: "One",
            }),
          },
          {
            id: "g-2",
            person: personFixture({
              id: "person-2",
              auth_user_id: "auth-2",
              first_name: "B",
              last_name: "Two",
            }),
          },
        ]),
        team_members: okResult([{ user_id: "auth-1" }]),
      }),
    );
    const result = await listGuardianAssistantCandidates("team-1", "club-1");
    expect(result.data.map((g) => g.id)).toEqual(["g-2"]);
  });

  it("adds and removes members with friendly unique errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_members: errResult("team_members_team_user_role_unique"),
      }),
    );
    expect(
      await addTeamMember({
        team_id: "team-1",
        user_id: "u1",
        role: "coach",
      }),
    ).toMatchObject({ error: expect.stringMatching(/already has that role/i) });

    createClientMock.mockResolvedValue(
      mockFromClient({ team_members: okResult(null) }),
    );
    expect(await removeTeamMember("tm-1")).toEqual({ error: null });
  });
});
