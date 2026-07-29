import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuardian, getGuardianPlayers } from "@/lib/data/guardians";
import { listPlayers } from "@/lib/data/players";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { guardianDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { GuardianForm } from "@/components/guardians/guardian-form";
import { GuardianPlayersSection } from "@/components/guardians/guardian-players-section";
import { DeleteGuardianButton } from "@/components/guardians/delete-guardian-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: guardian, error } = await getGuardian(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Guardian" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!guardian || !ctx) {
    notFound();
  }

  const canEdit = canManageClub(ctx, guardian.club_id);
  const [{ data: links }, { data: players }] = await Promise.all([
    getGuardianPlayers(guardian.id),
    canEdit
      ? listPlayers()
      : Promise.resolve({
          data: [] as Awaited<ReturnType<typeof listPlayers>>["data"],
        }),
  ]);

  const linkedPlayerIds = new Set(links.map((link) => link.player_id));
  const availablePlayers = players.filter(
    (player) =>
      player.club_id === guardian.club_id && !linkedPlayerIds.has(player.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={guardianDisplayName(guardian)}
        description={guardian.email ?? guardian.phone ?? "Guardian"}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/guardians" />}
          >
            Back to guardians
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            Link zero or more players. Each link has a relationship and optional
            legal guardian flag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianPlayersSection
            guardianId={guardian.id}
            links={links}
            availablePlayers={availablePlayers}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit guardian</CardTitle>
            <CardDescription>
              Update name, contact details, and notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GuardianForm mode="edit" guardian={guardian} />
            <DeleteGuardianButton guardianId={guardian.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
