import { afterEach, describe, expect, it, vi } from "vitest";
import {
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
  venueMapsQuery,
} from "@/lib/maps";

describe("venueMapsQuery", () => {
  it("returns null when there is no address", () => {
    expect(
      venueMapsQuery({
        name: "Training Pitch",
        address_line1: null,
        address_line2: null,
        town_city: null,
        postcode: null,
      }),
    ).toBeNull();
  });

  it("builds a query from name and address", () => {
    expect(
      venueMapsQuery({
        name: "Aylward Academy",
        address_line1: "1 Windmill Road",
        address_line2: "Edmonton",
        town_city: "London",
        postcode: "N18 1NB",
      }),
    ).toBe("Aylward Academy, 1 Windmill Road, Edmonton, London, N18 1NB");
  });

  it("does not duplicate the name when it is already the address line", () => {
    expect(
      venueMapsQuery({
        name: "Wembley Stadium",
        address_line1: "Wembley Stadium",
        address_line2: "Wembley",
        town_city: "London",
        postcode: "HA9 0WS",
      }),
    ).toBe("Wembley Stadium, Wembley, London, HA9 0WS");
  });

  it("uses the address alone when the venue name is blank", () => {
    expect(
      venueMapsQuery({
        name: "  ",
        address_line1: "1 Windmill Road",
        address_line2: null,
        town_city: "London",
        postcode: "N18 1NB",
      }),
    ).toBe("1 Windmill Road, London, N18 1NB");
  });
});

describe("googleMapsSearchUrl", () => {
  it("builds a Google Maps search URL for the query", () => {
    expect(googleMapsSearchUrl("Wembley Stadium, London")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Wembley+Stadium%2C+London",
    );
  });
});

describe("googleMapsEmbedUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the Maps Embed API when a key is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY", "test-key");
    expect(googleMapsEmbedUrl("Wembley Stadium, London")).toBe(
      "https://www.google.com/maps/embed/v1/place?key=test-key&q=Wembley+Stadium%2C+London",
    );
  });

  it("falls back to a query embed without an API key", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY", "");
    expect(googleMapsEmbedUrl("Wembley Stadium, London")).toBe(
      "https://www.google.com/maps?q=Wembley+Stadium%2C+London&output=embed",
    );
  });
});
