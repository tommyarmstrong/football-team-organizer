import { describe, expect, it } from "vitest";
import { parseVenueForm } from "@/lib/venues/parse";

function venueFormData(
  fields: Record<string, string>,
  foodAndDrink: string[] = [],
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  for (const value of foodAndDrink) {
    formData.append("food_and_drink", value);
  }
  return formData;
}

const validFields = {
  name: "Aylward Academy",
  surface: "grass",
};

describe("parseVenueForm", () => {
  it("parses required fields and empty optionals", () => {
    expect(parseVenueForm(venueFormData(validFields))).toEqual({
      name: "Aylward Academy",
      address_line1: null,
      address_line2: null,
      town_city: null,
      postcode: null,
      surface: "grass",
      food_and_drink: [],
    });
  });

  it("trims values and maps blank address fields to null", () => {
    expect(
      parseVenueForm(
        venueFormData({
          name: "  Home Pitch  ",
          address_line1: "  1 Windmill Road  ",
          address_line2: "  ",
          town_city: "London",
          postcode: "N18 1NB",
          surface: "astro",
        }),
      ),
    ).toEqual({
      name: "Home Pitch",
      address_line1: "1 Windmill Road",
      address_line2: null,
      town_city: "London",
      postcode: "N18 1NB",
      surface: "astro",
      food_and_drink: [],
    });
  });

  it("collects unique food and drink options", () => {
    expect(
      parseVenueForm(
        venueFormData(validFields, ["cafe", "bbq", "cafe", "tuck_shop"]),
      ),
    ).toEqual({
      name: "Aylward Academy",
      address_line1: null,
      address_line2: null,
      town_city: null,
      postcode: null,
      surface: "grass",
      food_and_drink: ["cafe", "bbq", "tuck_shop"],
    });
  });

  it("requires a name", () => {
    expect(
      parseVenueForm(venueFormData({ name: "", surface: "grass" })),
    ).toEqual({ error: "Name is required." });
  });

  it("rejects an invalid surface", () => {
    expect(
      parseVenueForm(venueFormData({ name: "Pitch", surface: "concrete" })),
    ).toEqual({ error: "Select a valid surface." });
  });

  it("rejects an invalid food and drink option", () => {
    expect(parseVenueForm(venueFormData(validFields, ["pizza_van"]))).toEqual({
      error: "Select a valid food & drink option.",
    });
  });
});
