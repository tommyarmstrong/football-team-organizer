"use client";

import Link from "next/link";
import { MapPinIcon } from "lucide-react";
import type { Venue } from "@/lib/data/venues";
import { formatVenueAddress } from "@/lib/format";
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
        return (
          <Link
            href={`/venues/${venue.id}`}
            className={objectListRowClassName()}
          >
            <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
              <MapPinIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{venue.name}</p>
              <p className="text-muted-foreground text-sm">
                {address ?? "No address"}
              </p>
            </div>
          </Link>
        );
      }}
    />
  );
}
