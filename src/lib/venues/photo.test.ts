import { describe, expect, it } from "vitest";
import { validateVenuePhoto, venuePhotoStoragePath } from "@/lib/venues/photo";

describe("venue photo helpers", () => {
  it("validates type and size", () => {
    expect(
      validateVenuePhoto(new File(["x"], "a.png", { type: "image/png" })),
    ).toBeNull();
    expect(
      validateVenuePhoto(new File(["x"], "a.pdf", { type: "application/pdf" })),
    ).toMatch(/png|jpeg/i);
    expect(
      validateVenuePhoto(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", {
          type: "image/png",
        }),
      ),
    ).toMatch(/5 MB/);
  });

  it("derives the storage path from a public URL", () => {
    expect(
      venuePhotoStoragePath(
        "https://x.supabase.co/storage/v1/object/public/venue-photos/club-1/a.jpg?t=1",
      ),
    ).toBe("club-1/a.jpg");
    expect(venuePhotoStoragePath("https://example.com/other.jpg")).toBeNull();
    expect(venuePhotoStoragePath(null)).toBeNull();
  });
});
