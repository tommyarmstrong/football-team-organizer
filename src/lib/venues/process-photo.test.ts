import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  VENUE_PHOTO_MAX_EDGE,
  processVenuePhoto,
} from "@/lib/venues/process-photo";

async function jpegWithMetadata(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: "#2a7a3b" },
  })
    .withExif({
      IFD0: {
        Copyright: "Jane Smith",
        Artist: "Jane Smith",
        Make: "SecretCam",
      },
    })
    .withXmp(
      '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Jane Smith</dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>',
    )
    .withIccProfile("srgb")
    .jpeg()
    .toBuffer();
}

describe("processVenuePhoto", () => {
  it("strips EXIF, XMP and ICC metadata", async () => {
    const input = await jpegWithMetadata(800, 450);
    const before = await sharp(input).metadata();
    expect(before.exif).toBeDefined();
    expect(before.xmp).toBeDefined();

    const result = await processVenuePhoto(input);
    const after = await sharp(result.bytes).metadata();
    expect(after.format).toBe("webp");
    expect(after.exif).toBeUndefined();
    expect(after.xmp).toBeUndefined();
    expect(after.icc).toBeUndefined();
    expect(after.iptc).toBeUndefined();
    expect(Buffer.from(result.bytes).includes("Jane Smith")).toBe(false);
    expect(Buffer.from(result.bytes).includes("SecretCam")).toBe(false);
  });

  it("shrinks large images to the maximum edge, keeping the ratio", async () => {
    const input = await jpegWithMetadata(4000, 2250);
    const result = await processVenuePhoto(input);
    const meta = await sharp(result.bytes).metadata();
    expect(meta.width).toBe(VENUE_PHOTO_MAX_EDGE);
    expect(meta.height).toBe(900);
    expect(result.bytes.byteLength).toBeLessThan(input.byteLength);
  });

  it("does not enlarge small images", async () => {
    const result = await processVenuePhoto(await jpegWithMetadata(640, 360));
    const meta = await sharp(result.bytes).metadata();
    expect([meta.width, meta.height]).toEqual([640, 360]);
  });

  it("applies EXIF orientation before dropping it", async () => {
    const input = await sharp({
      create: { width: 400, height: 200, channels: 3, background: "#fff" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(input).metadata()).orientation).toBe(6);
    const result = await processVenuePhoto(input);
    const meta = await sharp(result.bytes).metadata();
    expect([meta.width, meta.height]).toEqual([200, 400]);
    expect(meta.orientation).toBeUndefined();
  });

  it("rejects bytes that are not an image", async () => {
    await expect(
      processVenuePhoto(new TextEncoder().encode("not an image")),
    ).rejects.toThrow();
  });
});
