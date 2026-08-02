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
  surface: VenueSurface[];
  food_and_drink: VenueFoodAndDrink[];
};

export type VenueFormParseResult = VenueFormFields | { error: string };

function parseEnumMultiSelect<T extends string>(
  formData: FormData,
  fieldName: string,
  allowed: readonly T[],
  invalidMessage: string,
): T[] | { error: string } {
  const selected = formData
    .getAll(fieldName)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );

  const values: T[] = [];
  for (const value of selected) {
    if (!(allowed as readonly string[]).includes(value)) {
      return { error: invalidMessage };
    }
    if (!values.includes(value as T)) {
      values.push(value as T);
    }
  }

  return values;
}

export function parseVenueForm(formData: FormData): VenueFormParseResult {
  const name = str(formData, "name");
  const address_line1 = str(formData, "address_line1") || null;
  const address_line2 = str(formData, "address_line2") || null;
  const town_city = str(formData, "town_city") || null;
  const postcode = str(formData, "postcode") || null;

  if (!name) {
    return { error: "Name is required." };
  }

  const surface = parseEnumMultiSelect(
    formData,
    "surface",
    VENUE_SURFACES,
    "Select a valid surface.",
  );
  if ("error" in surface) {
    return surface;
  }

  const food_and_drink = parseEnumMultiSelect(
    formData,
    "food_and_drink",
    VENUE_FOOD_AND_DRINKS,
    "Select a valid amenity.",
  );
  if ("error" in food_and_drink) {
    return food_and_drink;
  }

  return {
    name,
    address_line1,
    address_line2,
    town_city,
    postcode,
    surface,
    food_and_drink,
  };
}
