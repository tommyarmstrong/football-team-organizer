"use client";

import { useEffect, useState } from "react";
import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  VENUE_FOOD_AND_DRINKS,
  VENUE_FOOD_AND_DRINK_LABELS,
  VENUE_PARKINGS,
  VENUE_PARKING_LABELS,
  VENUE_SURFACES,
  VENUE_SURFACE_LABELS,
} from "@/lib/constants";
import {
  createVenueAction,
  createVenueOnPageAction,
  updateVenueAction,
  updateVenueOnPageAction,
} from "@/lib/venues/actions";
import { shrinkPhotoForUpload } from "@/lib/photos/client-photo";
import type { Venue } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function VenueForm({
  venue,
  mode,
  stayOnPage = false,
  onSuccess,
  onCancel,
}: {
  venue?: Venue;
  mode: "create" | "edit";
  stayOnPage?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const action =
    mode === "create"
      ? stayOnPage
        ? createVenueOnPageAction
        : createVenueAction
      : stayOnPage
        ? updateVenueOnPageAction.bind(null, venue!.id)
        : updateVenueAction.bind(null, venue!.id);

  const [state, formAction, pending] = useToastActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  const [previewSrc, setPreviewSrc] = useState(venue?.photo_url ?? "");
  const [clearPhoto, setClearPhoto] = useState(false);

  const selectedSurfaces = new Set(
    Array.isArray(venue?.surface) ? venue.surface : [],
  );
  const selectedAmenities = new Set(
    Array.isArray(venue?.food_and_drink) ? venue.food_and_drink : [],
  );
  const selectedParking = venue?.parking ?? "unknown";

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="clear_photo"
        value={clearPhoto ? "true" : ""}
      />
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
          <Label htmlFor="venue-photo">
            Photo <OptionalHint />
          </Label>
          <div className="space-y-3">
            {previewSrc && !clearPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt=""
                className="aspect-video w-full rounded-xl object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex aspect-video w-full items-center justify-center rounded-xl text-sm">
                No venue photo
              </div>
            )}
            <Input
              id="venue-photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={pending}
              onChange={async (event) => {
                const input = event.target;
                const file = input.files?.[0];
                if (!file) return;
                setClearPhoto(false);
                setPreviewSrc(URL.createObjectURL(file));

                // Swap in a smaller copy so large phone photos can upload.
                const smaller = await shrinkPhotoForUpload(file);
                if (smaller !== file) {
                  const transfer = new DataTransfer();
                  transfer.items.add(smaller);
                  input.files = transfer.files;
                }
              }}
            />
            <p className="text-muted-foreground text-xs">
              PNG, JPEG, WebP, or GIF. Large photos are shrunk automatically and
              location and camera details are removed. Shown above the location
              map, cropped to 16:9 (landscape works best).
            </p>
            {venue?.photo_url ? (
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={clearPhoto}
                  disabled={pending}
                  onChange={(event) => setClearPhoto(event.target.checked)}
                />
                Remove uploaded photo
              </label>
            ) : null}
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_line1">
            Address line 1 <OptionalHint />
          </Label>
          <Input
            id="address_line1"
            name="address_line1"
            defaultValue={venue?.address_line1 ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_line2">
            Address line 2 <OptionalHint />
          </Label>
          <Input
            id="address_line2"
            name="address_line2"
            defaultValue={venue?.address_line2 ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="town_city">
            Town / city <OptionalHint />
          </Label>
          <Input
            id="town_city"
            name="town_city"
            defaultValue={venue?.town_city ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">
            Postcode <OptionalHint />
          </Label>
          <Input
            id="postcode"
            name="postcode"
            defaultValue={venue?.postcode ?? ""}
            disabled={pending}
          />
        </div>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">
            Surface <OptionalHint />
          </legend>
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
          <legend className="text-sm font-medium">
            Amenities <OptionalHint />
          </legend>
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
        <FormActions
          pending={pending}
          cancelHref={onCancel ? undefined : `/venues/${venue.id}`}
          onCancel={onCancel}
        />
      ) : onCancel ? (
        <FormActions pending={pending} onCancel={onCancel} />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add venue"}
        </Button>
      )}
    </form>
  );
}
