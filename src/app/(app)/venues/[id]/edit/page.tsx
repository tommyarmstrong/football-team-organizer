import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVenue } from "@/lib/data/venues";
import { getViewerContext } from "@/lib/authz/context";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VenueForm } from "@/components/venues/venue-form";
import { DeleteVenueButton } from "@/components/venues/delete-venue-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function canEditVenue(
  ctx: NonNullable<Awaited<ReturnType<typeof getViewerContext>>>,
  clubId: string,
): boolean {
  return (
    ctx.managementClubIds.includes(clubId) ||
    ctx.visibleTeams.some(
      (team) => team.club_id === clubId && ctx.coachTeamIds.includes(team.id),
    )
  );
}

export default async function EditVenuePage({
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
        <PageHeader title="Edit venue" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!venue || !ctx) {
    notFound();
  }

  if (!canEditVenue(ctx, venue.club_id)) {
    redirect(`/venues/${venue.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit venue"
        description={venue.name}
        actions={
          <Link
            href={`/venues/${venue.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Venue details</CardTitle>
          <CardDescription>Update name, address, and surface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VenueForm mode="edit" venue={venue} />
          <DeleteVenueButton venueId={venue.id} />
        </CardContent>
      </Card>
    </div>
  );
}
