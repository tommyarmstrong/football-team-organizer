import Link from "next/link";
import { listVenues } from "@/lib/data/venues";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VenuesDirectoryList } from "@/components/venues/venues-directory-list";
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
        actions={
          canAdd ? (
            <Link href="/venues/new" className={buttonVariants()}>
              Add venue
            </Link>
          ) : undefined
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {!error && venues.length === 0 ? (
        <EmptyState
          title="No venues yet"
          description={
            canAdd
              ? "Add a venue so teams can link home and training grounds."
              : "Venues will appear here when club staff adds them."
          }
        />
      ) : null}
      {!error && venues.length > 0 ? (
        <VenuesDirectoryList venues={venues} />
      ) : null}
    </div>
  );
}
