import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listCoaches } from "@/lib/data/coaches";
import { listGuardians } from "@/lib/data/guardians";
import { listManagers } from "@/lib/data/managers";
import { getPerson } from "@/lib/data/people";
import { listPlayers } from "@/lib/data/players";
import { personDisplayName } from "@/lib/people/person";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PersonForm } from "@/components/people/person-form";
import {
  PersonInvitationPanel,
  PersonRoleLinkForm,
} from "@/components/people/person-admin-panels";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  if (!ctx) notFound();

  const club = await getPrimaryClub();
  const canEdit = Boolean(club && canManageClub(ctx, club.id));

  const { data: person, error } = await getPerson(id);
  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Person" />
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!person) notFound();

  const self = person.auth_user_id === ctx.userId;
  if (!canEdit && !self) redirect("/dashboard");

  const [
    { data: managers },
    { data: coaches },
    { data: guardians },
    { data: players },
  ] = canEdit
    ? await Promise.all([
        listManagers(club?.id),
        listCoaches(),
        listGuardians(),
        listPlayers(),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const linkedManagerIds = new Set(person.managers.map((m) => m.id));
  const linkedCoachIds = new Set(person.coaches.map((c) => c.id));
  const linkedGuardianIds = new Set(person.guardians.map((g) => g.id));
  const linkedPlayerIds = new Set(person.players.map((p) => p.id));

  return (
    <div className="space-y-8">
      <PageHeader
        title={personDisplayName(person)}
        description={person.email ?? person.phone ?? "Person"}
        actions={
          <Link
            href="/people"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to people
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Shared person-level details.</CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm mode="edit" person={person} />
        </CardContent>
      </Card>

      {canEdit ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Invitation</CardTitle>
              <CardDescription>
                Invite-only onboarding via a secure, expiring, single-use link.
                Players are not invited by default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonInvitationPanel person={person} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked roles</CardTitle>
              <CardDescription>
                A person may hold multiple roles. Link existing role records
                without duplicating identity fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  Managers:{" "}
                  {person.managers.length
                    ? person.managers.map((m) => m.id).join(", ")
                    : "None"}
                </li>
                <li>
                  Coaches:{" "}
                  {person.coaches.length
                    ? person.coaches.map((c) => c.id).join(", ")
                    : "None"}
                </li>
                <li>
                  Guardians:{" "}
                  {person.guardians.length
                    ? person.guardians.map((g) => g.id).join(", ")
                    : "None"}
                </li>
                <li>
                  Players:{" "}
                  {person.players.length
                    ? person.players.map((p) => p.id).join(", ")
                    : "None"}
                </li>
              </ul>

              <PersonRoleLinkForm
                personId={person.id}
                managers={managers
                  .filter((m) => !linkedManagerIds.has(m.id))
                  .map((m) => ({
                    id: m.id,
                    label: `${m.first_name} ${m.last_name}`,
                  }))}
                coaches={coaches
                  .filter((c) => !linkedCoachIds.has(c.id))
                  .map((c) => ({
                    id: c.id,
                    label: `${c.first_name} ${c.last_name}`,
                  }))}
                guardians={guardians
                  .filter((g) => !linkedGuardianIds.has(g.id))
                  .map((g) => ({
                    id: g.id,
                    label: `${g.first_name} ${g.last_name}`,
                  }))}
                players={players
                  .filter((p) => !linkedPlayerIds.has(p.id))
                  .map((p) => ({
                    id: p.id,
                    label: `${p.first_name} ${p.last_name}`,
                  }))}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
