import { notFound } from "next/navigation";
import { getGuardian, getGuardianPlayers } from "@/lib/data/guardians";
import { listPlayers } from "@/lib/data/players";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { guardianDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ErrorBanner } from "@/components/shared/error-banner";
import { GuardianForm } from "@/components/guardians/guardian-form";
import { GuardianPlayersSection } from "@/components/guardians/guardian-players-section";
import { DeleteGuardianButton } from "@/components/guardians/delete-guardian-button";
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

  const canManageLinks = canManageClub(ctx, guardian.club_id);
  const [{ data: links }, { data: players }] = await Promise.all([
    getGuardianPlayers(guardian.id),
    canManageLinks
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
          canManageLinks ? (
            <DeleteGuardianButton guardianId={guardian.id} />
          ) : undefined
        }
      />

      {canManageLinks ? (
        <Card>
          <CardHeader>
            <CardTitle>Guardian details</CardTitle>
            <CardDescription>
              Update name, contact details, and notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuardianForm mode="edit" guardian={guardian} />
          </CardContent>
        </Card>
      ) : null}

      <Section
        title="Player relationships"
        description="Relationships between this guardian and players at the club."
      >
        <GuardianPlayersSection
          guardianId={guardian.id}
          links={links}
          availablePlayers={availablePlayers}
          canManageLinks={canManageLinks}
          selfGuardianIds={ctx.guardianIds}
        />
      </Section>
    </div>
  );
}
