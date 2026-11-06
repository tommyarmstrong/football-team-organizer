import { describe, expect, it } from "vitest";
import { teamPhotoStoragePath, validateTeamPhoto } from "@/lib/team/photo";

describe("team photo helpers", () => {
  it("validates type and size", () => {
    expect(
      validateTeamPhoto(new File(["x"], "a.png", { type: "image/png" })),
    ).toBeNull();
    expect(
      validateTeamPhoto(new File(["x"], "a.pdf", { type: "application/pdf" })),
    ).toMatch(/png|jpeg/i);
    expect(
      validateTeamPhoto(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", {
          type: "image/png",
        }),
      ),
    ).toMatch(/5 MB/);
  });

  it("derives the storage path from a public URL", () => {
    expect(
      teamPhotoStoragePath(
        "https://x.supabase.co/storage/v1/object/public/team-photos/team-1/a.webp?t=1",
      ),
    ).toBe("team-1/a.webp");
    expect(teamPhotoStoragePath("https://example.com/other.jpg")).toBeNull();
    expect(teamPhotoStoragePath(null)).toBeNull();
  });
});
