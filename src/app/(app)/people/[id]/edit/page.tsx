import { notFound, redirect } from "next/navigation";
import {
  canEditLinkedPlayerProfile,
  canEditPersonDetails,
  canManageClub,
  getViewerContext,
  isSelfPerson,
} from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getCoach } from "@/lib/data/coaches";
import { getPerson } from "@/lib/data/people";
import { personDisplayName } from "@/lib/people/person";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PersonForm } from "@/components/people/person-form";
import { PersonClubRolesSection } from "@/components/people/person-admin-panels";
import { CoachTextCards } from "@/components/coaches/coach-text-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  if (!ctx) notFound();

  const club = await getPrimaryClub();
  const { data: person, error } = await getPerson(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit person" />
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!person) notFound();

  const self = isSelfPerson(ctx, person);
  const canAdmin = Boolean(club && canManageClub(ctx, club.id));
  const player =
    club != null
      ? (person.players.find(
          (row) => row.club_id === club.id && row.active_role,
        ) ??
        person.players.find((row) => row.active_role) ??
        null)
      : (person.players.find((row) => row.active_role) ?? null);

  if (
    !canEditPersonDetails(ctx, person, player?.id ?? null, club?.id ?? null)
  ) {
    redirect("/dashboard");
  }

  const showPlayerDobSchool = Boolean(
    player &&
    club &&
    canEditLinkedPlayerProfile(ctx, player.id, player.club_id),
  );
  const showPlayerPosition = Boolean(player && canAdmin);

  const coachRole =
    club != null
      ? (person.coaches.find(
          (row) => row.club_id === club.id && row.active_role,
        ) ??
        person.coaches.find((row) => row.active_role) ??
        null)
      : (person.coaches.find((row) => row.active_role) ?? null);

  const coachRecord = coachRole ? (await getCoach(coachRole.id)).data : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit person" description={personDisplayName(person)} />

      <Card>
        <CardHeader>
          <CardTitle>Name and details</CardTitle>
          <CardDescription>
            {showPlayerDobSchool && showPlayerPosition
              ? "Shared person-level details, plus player DOB, position, and school."
              : showPlayerDobSchool
                ? "Name, contact details, date of birth, and school."
                : "Name, email, and phone number."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm
            mode="edit"
            person={person}
            player={player}
            showPlayerDobSchool={showPlayerDobSchool}
            showPlayerPosition={showPlayerPosition}
          />
        </CardContent>
      </Card>

      {coachRecord && (canAdmin || self) ? (
        <CoachTextCards
          coachId={coachRecord.id}
          personId={person.id}
          biography={coachRecord.biography}
          philosophy={coachRecord.philosophy}
        />
      ) : null}

      {canAdmin && club ? (
        <Card>
          <CardHeader>
            <CardTitle>Club roles</CardTitle>
            <CardDescription>
              Add or deactivate player, coach, guardian, and manager roles at{" "}
              {club.name}. Deactivating keeps historic records linked to this
              person.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonClubRolesSection person={person} clubId={club.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
