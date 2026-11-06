import { describe, expect, it } from "vitest";
import { fitWithin } from "@/lib/venues/client-photo";

describe("fitWithin", () => {
  it("scales the longest edge down to the maximum", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("never enlarges", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
