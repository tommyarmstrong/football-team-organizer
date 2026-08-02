import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPlayer,
  getPlayerContact,
  getPlayerGoals,
  getPlayerTeams,
} from "@/lib/data/players";
import { listPlayerObjectives } from "@/lib/data/player-objectives";
import { getPlayerGuardians } from "@/lib/data/guardians";
import {
  canEditPlayer,
  canViewPlayerContact,
  getViewerContext,
} from "@/lib/authz/context";
import {
  formatMatchDate,
  formatShortDate,
  playerDisplayName,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PlayerForm } from "@/components/players/player-form";
import { PlayerTeamsSection } from "@/components/players/player-teams-section";
import { PlayerGuardiansSection } from "@/components/players/player-guardians-section";
import { PlayerContactForm } from "@/components/players/player-contact-form";
import { PlayerObjectivesSection } from "@/components/players/player-objectives-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: player, error } = await getPlayer(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Player" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!player || !ctx) {
    notFound();
  }

  const [
    { data: teams },
    { data: contact },
    { data: goals, error: goalsError },
    { data: guardians },
    { data: objectives, error: objectivesError },
  ] = await Promise.all([
    getPlayerTeams(player.id),
    getPlayerContact(player.id),
    getPlayerGoals(player.id),
    getPlayerGuardians(player.id),
    listPlayerObjectives(player.id),
  ]);

  const playerTeamIds = teams.map((team) => team.team_id);
  const canEdit = canEditPlayer(ctx, player.club_id, playerTeamIds);
  const canViewContact = canViewPlayerContact(
    ctx,
    player.id,
    player.club_id,
    playerTeamIds,
  );

  const currentTeamIds = new Set(playerTeamIds);
  const availableTeams = ctx.visibleTeams.filter(
    (team) =>
      team.club_id === player.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      !currentTeamIds.has(team.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={playerDisplayName(player)}
        description={
          [player.position, player.school].filter(Boolean).join(" · ") ||
          "No position"
        }
        actions={
          <Link
            href="/club"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to club
          </Link>
        }
      />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit player</CardTitle>
            <CardDescription>
              Player identity is shared across the club and all their teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlayerForm mode="edit" player={player} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Teams this player is part of, with per-team shirt number and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerTeamsSection
            playerId={player.id}
            memberships={teams}
            availableTeams={availableTeams}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
          <CardDescription>
            Guardians linked to this player from the Club page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerGuardiansSection links={guardians} />
        </CardContent>
      </Card>

      {canViewContact ? (
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>
              Sensitive details. Visible to club management, the player&apos;s
              coaches, and their guardians only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerContactForm
              playerId={player.id}
              contact={contact}
              guardians={guardians}
              canEdit={canViewContact}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Development objectives</CardTitle>
          <CardDescription>
            For younger children it is usually recommended that objectives are
            limited to no more than one or two items, which they can focus on,
            rather than being overwhelmed by information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {objectivesError ? <ErrorBanner message={objectivesError} /> : null}
          {!objectivesError ? (
            <PlayerObjectivesSection
              playerId={player.id}
              objectives={objectives}
              canEdit={canEdit}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>
            {goals.length} goal{goals.length === 1 ? "" : "s"} in played matches
            across their teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goalsError ? <ErrorBanner message={goalsError} /> : null}
          {!goalsError && goals.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Goals scored in played matches will appear here."
            />
          ) : null}
          {!goalsError && goals.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {goals.map((goal) => (
                <li key={goal.id}>
                  <Link
                    href={`/matches/${goal.match_id}/goals/${goal.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div>
                      <p className="font-medium">vs {goal.opponent_name}</p>
                      <p className="text-muted-foreground">
                        {goal.match_date
                          ? formatMatchDate(goal.match_date)
                          : formatShortDate(goal.created_at.slice(0, 10))}
                        {goal.minute != null ? ` · ${goal.minute}'` : ""}
                        {goal.is_penalty ? " · Pen" : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
