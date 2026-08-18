"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  VENUE_FOOD_AND_DRINKS,
  VENUE_FOOD_AND_DRINK_LABELS,
  VENUE_PARKINGS,
  VENUE_PARKING_LABELS,
  VENUE_SURFACES,
  VENUE_SURFACE_LABELS,
} from "@/lib/constants";
import { createVenueAction, updateVenueAction } from "@/lib/venues/actions";
import type { Venue } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function VenueForm({
  venue,
  mode,
}: {
  venue?: Venue;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? createVenueAction
      : updateVenueAction.bind(null, venue!.id);

  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  const selectedSurfaces = new Set(
    Array.isArray(venue?.surface) ? venue.surface : [],
  );
  const selectedAmenities = new Set(
    Array.isArray(venue?.food_and_drink) ? venue.food_and_drink : [],
  );
  const selectedParking = venue?.parking ?? "unknown";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            aria-required="true"
            defaultValue={venue?.name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_line1">Address line 1</Label>
          <Input
            id="address_line1"
            name="address_line1"
            defaultValue={venue?.address_line1 ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_line2">Address line 2</Label>
          <Input
            id="address_line2"
            name="address_line2"
            defaultValue={venue?.address_line2 ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="town_city">Town / city</Label>
          <Input
            id="town_city"
            name="town_city"
            defaultValue={venue?.town_city ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            name="postcode"
            defaultValue={venue?.postcode ?? ""}
            disabled={pending}
          />
        </div>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">Surface</legend>
          <div className="flex flex-wrap gap-3">
            {VENUE_SURFACES.map((option) => (
              <label
                key={option}
                className="flex min-h-9 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="surface"
                  value={option}
                  defaultChecked={selectedSurfaces.has(option)}
                  disabled={pending}
                  className="border-input size-4 rounded"
                />
                {VENUE_SURFACE_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">Parking</legend>
          <div className="flex flex-wrap gap-3">
            {VENUE_PARKINGS.map((option) => (
              <label
                key={option}
                className="flex min-h-9 items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="parking"
                  value={option}
                  defaultChecked={selectedParking === option}
                  disabled={pending}
                  className="border-input size-4"
                />
                {VENUE_PARKING_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">Amenities</legend>
          <div className="flex flex-wrap gap-3">
            {VENUE_FOOD_AND_DRINKS.map((option) => (
              <label
                key={option}
                className="flex min-h-9 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="food_and_drink"
                  value={option}
                  defaultChecked={selectedAmenities.has(option)}
                  disabled={pending}
                  className="border-input size-4 rounded"
                />
                {VENUE_FOOD_AND_DRINK_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      {mode === "edit" && venue ? (
        <FormActions pending={pending} cancelHref={`/venues/${venue.id}`} />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add venue"}
        </Button>
      )}
    </form>
  );
}
