import Link from "next/link";
import { listVenues } from "@/lib/data/venues";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import {
  formatVenueAddress,
  formatVenueFoodAndDrink,
  labelVenueSurface,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { buttonVariants } from "@/components/ui/button";

export default async function VenuesPage() {
  const [ctx, club, { data: allVenues, error }] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    listVenues(),
  ]);

  const venues = club
    ? allVenues.filter((venue) => venue.club_id === club.id)
    : allVenues;

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Venues"
        description={
          club
            ? `Home and training grounds for ${club.name}`
            : "Home and training grounds"
        }
        actions={
          canAdd ? (
            <Link href="/venues/new" className={buttonVariants({ size: "sm" })}>
              Add venue
            </Link>
          ) : null
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      <section className="space-y-3" aria-labelledby="venues-list-heading">
        <h2 id="venues-list-heading" className="text-lg font-medium">
          All venues
        </h2>
        {!error && venues.length === 0 ? (
          <EmptyState
            title="No venues yet"
            description={
              canAdd
                ? "Add a venue so teams can link home and training grounds."
                : "Venues will appear here when club staff adds them."
            }
            action={
              canAdd ? (
                <Link href="/venues/new" className={buttonVariants()}>
                  Add venue
                </Link>
              ) : null
            }
          />
        ) : null}
        {!error && venues.length > 0 ? (
          <ul className="divide-border border-border divide-y rounded-xl border">
            {venues.map((venue) => {
              const address = formatVenueAddress(venue);
              const foodAndDrinkLabel = formatVenueFoodAndDrink(
                venue.food_and_drink,
              );
              const surfaceLabel = labelVenueSurface(venue.surface);
              return (
                <li
                  key={venue.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <Link
                    href={`/venues/${venue.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring -mx-2 min-w-0 flex-1 rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <p className="font-medium">{venue.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {address ?? "No address"}
                    </p>
                    {foodAndDrinkLabel ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        Food & Drink: {foodAndDrinkLabel}
                      </p>
                    ) : null}
                  </Link>
                  <span
                    className="bg-foreground text-background shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide"
                    aria-label={`Surface: ${surfaceLabel}`}
                  >
                    {surfaceLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
