import { notFound } from "next/navigation";
import { getVenue } from "@/lib/data/venues";
import { getViewerContext } from "@/lib/authz/context";
import { formatVenueAddress } from "@/lib/format";
import { pageBodyClassName } from "@/components/shared/page-body";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditVenueDialog } from "@/components/venues/edit-venue-dialog";
import { VenueMap } from "@/components/venues/venue-map";
import { DeleteVenueButton } from "@/components/venues/delete-venue-button";
import {
  VenueAmenityChips,
  VenueParkingChip,
  VenueSurfaceChips,
} from "@/components/venues/venue-chips";

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
      <div className={pageBodyClassName("space-y-4")}>
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
    <div className={pageBodyClassName("space-y-8")}>
      <PageHeader
        title={venue.name}
        description={
          <div className="space-y-2">
            {address ? <p>{address}</p> : null}
            <VenueSurfaceChips surfaces={venue.surface} />
            <VenueParkingChip parking={venue.parking} />
            <VenueAmenityChips amenities={venue.food_and_drink} />
          </div>
        }
        actions={
          canEdit ? (
            <>
              <EditVenueDialog venue={venue} />
              <DeleteVenueButton venueId={venue.id} label="Delete venue" />
            </>
          ) : undefined
        }
      />

      <VenueMap venue={venue} />
    </div>
  );
}
