import { str } from "@/lib/form-parse";
import { VENUE_FOOD_AND_DRINKS, VENUE_SURFACES } from "@/lib/constants";
import type {
  VenueFoodAndDrink,
  VenueSurface,
} from "@/lib/supabase/database.types";

export type VenueFormFields = {
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  town_city: string | null;
  postcode: string | null;
  surface: VenueSurface;
  food_and_drink: VenueFoodAndDrink[];
};

export type VenueFormParseResult = VenueFormFields | { error: string };

function parseFoodAndDrink(
  formData: FormData,
): VenueFoodAndDrink[] | { error: string } {
  const selected = formData
    .getAll("food_and_drink")
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );

  const food_and_drink: VenueFoodAndDrink[] = [];
  for (const value of selected) {
    if (!(VENUE_FOOD_AND_DRINKS as readonly string[]).includes(value)) {
      return { error: "Select a valid food & drink option." };
    }
    if (!food_and_drink.includes(value as VenueFoodAndDrink)) {
      food_and_drink.push(value as VenueFoodAndDrink);
    }
  }

  return food_and_drink;
}

export function parseVenueForm(formData: FormData): VenueFormParseResult {
  const name = str(formData, "name");
  const address_line1 = str(formData, "address_line1") || null;
  const address_line2 = str(formData, "address_line2") || null;
  const town_city = str(formData, "town_city") || null;
  const postcode = str(formData, "postcode") || null;
  const surfaceRaw = str(formData, "surface");

  if (!name) {
    return { error: "Name is required." };
  }

  if (!(VENUE_SURFACES as readonly string[]).includes(surfaceRaw)) {
    return { error: "Select a valid surface." };
  }

  const food_and_drink = parseFoodAndDrink(formData);
  if ("error" in food_and_drink) {
    return food_and_drink;
  }

  return {
    name,
    address_line1,
    address_line2,
    town_city,
    postcode,
    surface: surfaceRaw as VenueSurface,
    food_and_drink,
  };
}
