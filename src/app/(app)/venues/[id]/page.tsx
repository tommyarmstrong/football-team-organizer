import Link from "next/link";
import { notFound } from "next/navigation";
import { getVenue } from "@/lib/data/venues";
import { getViewerContext } from "@/lib/authz/context";
import { formatVenueAddress } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VenueMap } from "@/components/venues/venue-map";
import { DeleteVenueButton } from "@/components/venues/delete-venue-button";
import {
  VenueAmenityChips,
  VenueSurfaceChips,
} from "@/components/venues/venue-chips";
import { buttonVariants } from "@/components/ui/button";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: venue, error } = await getVenue(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Venue" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!venue || !ctx) {
    notFound();
  }

  const canEdit =
    ctx.managementClubIds.includes(venue.club_id) ||
    ctx.visibleTeams.some(
      (team) =>
        team.club_id === venue.club_id && ctx.coachTeamIds.includes(team.id),
    );

  const address = formatVenueAddress(venue);

  return (
    <div className="space-y-8">
      <PageHeader
        title={venue.name}
        description={
          <div className="space-y-2">
            {address ? <p>{address}</p> : null}
            <VenueSurfaceChips surfaces={venue.surface} />
            <VenueAmenityChips amenities={venue.food_and_drink} />
          </div>
        }
        actions={
          <>
            {canEdit ? (
              <>
                <Link
                  href={`/venues/${venue.id}/edit`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Edit
                </Link>
                <DeleteVenueButton venueId={venue.id} label="Delete" />
              </>
            ) : null}
            <Link
              href="/venues"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to venues
            </Link>
          </>
        }
      />

      <VenueMap venue={venue} />
    </div>
  );
}
