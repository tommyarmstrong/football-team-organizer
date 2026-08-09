import { getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { VenueForm } from "@/components/venues/venue-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewVenuePage() {
  const [ctx, club] = await Promise.all([getViewerContext(), getPrimaryClub()]);

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  if (!canAdd) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add venue" />
        <EmptyState
          title="Read-only access"
          description="Only coaches and club management can add venues."
        />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add venue" />
        <EmptyState
          title="No club found"
          description="Create a club before adding venues."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add venue"
        description={`Add a home or training ground for ${club.name}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Venue details</CardTitle>
          <CardDescription>
            Name, address, and surface. Teams can select this as home or
            training venue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VenueForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
