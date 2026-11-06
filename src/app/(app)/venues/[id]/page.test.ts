import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("venue detail page", () => {
  it("opens venue edit in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("EditVenueDialog");
    expect(source).not.toContain("href={`/venues/${venue.id}/edit`}");
  });

  it("shows the venue photo above the location section", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("<VenuePhoto");
    expect(source.indexOf("<VenuePhoto")).toBeLessThan(
      source.indexOf("<VenueMap"),
    );
  });
});
