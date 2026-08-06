import {
  VENUE_FOOD_AND_DRINK_EMOJIS,
  VENUE_FOOD_AND_DRINK_LABELS,
  VENUE_PARKING_EMOJI,
  VENUE_PARKING_LABELS,
  VENUE_SURFACE_LABELS,
} from "@/lib/constants";
import type {
  VenueFoodAndDrink,
  VenueParking,
  VenueSurface,
} from "@/lib/supabase/database.types";
import { RoleChip } from "@/components/shared/role-chip";

export function VenueSurfaceChips({
  surfaces,
}: {
  surfaces: VenueSurface[] | null | undefined;
}) {
  const values = surfaces ?? [];
  if (values.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Surfaces">
      {values.map((surface) => (
        <li key={surface}>
          <RoleChip className="border-green-600 text-green-800 dark:text-green-200">
            {VENUE_SURFACE_LABELS[surface]}
          </RoleChip>
        </li>
      ))}
    </ul>
  );
}

export function VenueParkingChip({
  parking,
}: {
  parking: VenueParking | null | undefined;
}) {
  if (!parking) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Parking">
      <li>
        <RoleChip>
          <span aria-hidden="true">{VENUE_PARKING_EMOJI}</span>
          <span>{VENUE_PARKING_LABELS[parking]}</span>
        </RoleChip>
      </li>
    </ul>
  );
}

export function VenueAmenityChips({
  amenities,
}: {
  amenities: VenueFoodAndDrink[] | null | undefined;
}) {
  const values = amenities ?? [];
  if (values.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Amenities">
      {values.map((amenity) => (
        <li key={amenity}>
          <RoleChip>
            <span aria-hidden="true">
              {VENUE_FOOD_AND_DRINK_EMOJIS[amenity]}
            </span>
            <span>{VENUE_FOOD_AND_DRINK_LABELS[amenity]}</span>
          </RoleChip>
        </li>
      ))}
    </ul>
  );
}
