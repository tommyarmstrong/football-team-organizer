"use client";

import Link from "next/link";
import type { Venue } from "@/lib/data/venues";
import {
  formatVenueAddress,
  formatVenueFoodAndDrink,
  labelVenueSurface,
} from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";

export function VenuesDirectoryList({ venues }: { venues: Venue[] }) {
  return (
    <FilterablePaginatedList
      items={venues}
      getItemKey={(venue) => venue.id}
      getSearchText={(venue) =>
        `${venue.name} ${formatVenueAddress(venue) ?? ""}`
      }
      filterPlaceholder="Filter venues by name or address…"
      singularLabel="venue"
      pluralLabel="venues"
      defaultPageSize={20}
      emptyFilterTitle="No venues match"
      emptyFilterDescription="Try a different name or address."
      renderItem={(venue) => {
        const address = formatVenueAddress(venue);
        const foodAndDrinkLabel = formatVenueFoodAndDrink(venue.food_and_drink);
        const surfaceLabel = labelVenueSurface(venue.surface);
        return (
          <Link
            href={`/venues/${venue.id}`}
            className={objectListRowClassName()}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{venue.name}</p>
              <p className="text-muted-foreground text-sm">
                {address ?? "No address"}
              </p>
              {foodAndDrinkLabel ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  Food & Drink: {foodAndDrinkLabel}
                </p>
              ) : null}
            </div>
            <span
              className="bg-foreground text-background shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide"
              aria-label={`Surface: ${surfaceLabel}`}
            >
              {surfaceLabel}
            </span>
          </Link>
        );
      }}
    />
  );
}
