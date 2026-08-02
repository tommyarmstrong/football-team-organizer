import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  canEditPlayer,
  canManageClub,
  canViewPlayerContact,
  getViewerContext,
  isClubStaff,
} from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getCoach, getCoachTeams } from "@/lib/data/coaches";
import { listCoachObjectives } from "@/lib/data/coach-objectives";
import {
  getGuardianPlayers,
  getPlayerGuardians,
  listGuardians,
} from "@/lib/data/guardians";
import { getPerson } from "@/lib/data/people";
import { listPlayerObjectives } from "@/lib/data/player-objectives";
import { getPlayerTeams, listPlayers } from "@/lib/data/players";
import { personDisplayName } from "@/lib/people/person";
import { guardianDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PersonHeaderMeta } from "@/components/people/person-header-meta";
import {
  PersonClubRolesSection,
  PersonInvitationPanel,
} from "@/components/people/person-admin-panels";
import { PlayerTeamsSection } from "@/components/players/player-teams-section";
import { CoachTeamsSection } from "@/components/coaches/coach-teams-section";
import { PlayerObjectivesSection } from "@/components/players/player-objectives-section";
import { CoachObjectivesSection } from "@/components/coaches/coach-objectives-section";
import { PlayerGuardiansSection } from "@/components/players/player-guardians-section";
import { GuardianPlayersSection } from "@/components/guardians/guardian-players-section";
import { DeletePlayerButton } from "@/components/players/delete-player-button";
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

  const player =
    club != null
      ? (person.players.find((row) => row.club_id === club.id) ??
        person.players[0] ??
        null)
      : (person.players[0] ?? null);
  const coach =
    club != null
      ? (person.coaches.find((row) => row.club_id === club.id) ??
        person.coaches[0] ??
        null)
      : (person.coaches[0] ?? null);
  const guardian =
    club != null
      ? (person.guardians.find((row) => row.club_id === club.id) ??
        person.guardians[0] ??
        null)
      : (person.guardians[0] ?? null);

  const roles = {
    player: person.players.length > 0,
    guardian: person.guardians.length > 0,
    coach: person.coaches.length > 0,
    manager: person.managers.length > 0,
  };

  const [
    playerTeamsResult,
    playerGuardiansResult,
    playerObjectivesResult,
    coachRecordResult,
    coachTeamsResult,
    coachObjectivesResult,
    guardianPlayersResult,
    allPlayersResult,
    allGuardiansResult,
  ] = await Promise.all([
    player ? getPlayerTeams(player.id) : Promise.resolve({ data: [] }),
    player ? getPlayerGuardians(player.id) : Promise.resolve({ data: [] }),
    player
      ? listPlayerObjectives(player.id)
      : Promise.resolve({ data: [], error: null }),
    coach ? getCoach(coach.id) : Promise.resolve({ data: null, error: null }),
    coach ? getCoachTeams(coach.id) : Promise.resolve({ data: [] }),
    coach
      ? listCoachObjectives(coach.id)
      : Promise.resolve({ data: [], error: null }),
    guardian ? getGuardianPlayers(guardian.id) : Promise.resolve({ data: [] }),
    guardian && canEdit
      ? listPlayers()
      : Promise.resolve({
          data: [] as Awaited<ReturnType<typeof listPlayers>>["data"],
        }),
    player && canEdit
      ? listGuardians()
      : Promise.resolve({
          data: [] as Awaited<ReturnType<typeof listGuardians>>["data"],
        }),
  ]);

  const playerTeams = playerTeamsResult.data;
  const playerGuardians = playerGuardiansResult.data;
  const playerObjectives = playerObjectivesResult.data;
  const playerObjectivesError =
    "error" in playerObjectivesResult ? playerObjectivesResult.error : null;
  const coachRecord = coachRecordResult.data;
  const coachTeams = coachTeamsResult.data;
  const coachObjectives = coachObjectivesResult.data;
  const guardianPlayerLinks = guardianPlayersResult.data;
  const allPlayers = allPlayersResult.data;
  const allGuardians = allGuardiansResult.data;

  const emergencyGuardian =
    playerGuardians.find((link) => link.emergency_contact) ?? null;

  const canViewContact =
    player != null &&
    canViewPlayerContact(
      ctx,
      player.id,
      player.club_id,
      playerTeams.map((team) => team.team_id),
    );

  const canEditPlayerRole =
    player != null &&
    canEditPlayer(
      ctx,
      player.club_id,
      playerTeams.map((team) => team.team_id),
    );
  const canEditCoachRole = coach != null && isClubStaff(ctx, coach.club_id);
  const canEditGuardianRole =
    guardian != null && canManageClub(ctx, guardian.club_id);

  const playerTeamIds = new Set(playerTeams.map((team) => team.team_id));
  const availablePlayerTeams = ctx.visibleTeams.filter(
    (team) =>
      player != null &&
      team.club_id === player.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      !playerTeamIds.has(team.id),
  );

  const coachTeamIds = new Set(coachTeams.map((team) => team.team_id));
  const availableCoachTeams = ctx.visibleTeams.filter(
    (team) =>
      coach != null &&
      team.club_id === coach.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      !coachTeamIds.has(team.id),
  );

  const linkedPlayerIds = new Set(
    guardianPlayerLinks.map((link) => link.player_id),
  );
  const availablePlayers = allPlayers.filter(
    (row) =>
      guardian != null &&
      row.club_id === guardian.club_id &&
      !linkedPlayerIds.has(row.id),
  );

  const linkedGuardianIds = new Set(
    playerGuardians.map((link) => link.guardian_id),
  );
  const availableGuardians = allGuardians.filter(
    (row) =>
      player != null &&
      row.club_id === player.club_id &&
      !linkedGuardianIds.has(row.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={personDisplayName(person)}
        description={
          <PersonHeaderMeta
            email={person.email}
            phone={person.phone}
            roles={roles}
            player={player}
            emergencyContactName={
              canViewContact && emergencyGuardian
                ? guardianDisplayName(emergencyGuardian)
                : null
            }
            emergencyPhone={
              canViewContact ? (emergencyGuardian?.phone ?? null) : null
            }
          />
        }
        actions={
          <>
            {canEdit || self ? (
              <Link
                href={`/people/${person.id}/edit`}
                className={buttonVariants({ size: "sm" })}
              >
                Edit
              </Link>
            ) : null}
            {canEdit && player ? (
              <DeletePlayerButton playerId={player.id} />
            ) : null}
            <Link
              href="/people"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back
            </Link>
          </>
        }
      />

      {coach ? (
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            {coachRecord?.biography ? (
              <p className="text-sm whitespace-pre-wrap">
                {coachRecord.biography}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No biography recorded.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {coach ? (
        <Card>
          <CardHeader>
            <CardTitle>Coaching Philosophy</CardTitle>
          </CardHeader>
          <CardContent>
            {coachRecord?.philosophy ? (
              <p className="text-sm whitespace-pre-wrap">
                {coachRecord.philosophy}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No philosophy recorded.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {coach ? (
        <Card>
          <CardHeader>
            <CardTitle>Coach Teams</CardTitle>
            <CardDescription>This coach&apos;s teams</CardDescription>
          </CardHeader>
          <CardContent>
            <CoachTeamsSection
              coachId={coach.id}
              memberships={coachTeams}
              availableTeams={availableCoachTeams}
              canEdit={canEditCoachRole}
            />
          </CardContent>
        </Card>
      ) : null}

      {coach ? (
        <Card>
          <CardHeader>
            <CardTitle>Coaching Development</CardTitle>
            <CardDescription>
              Optional goals for this coach&apos;s development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoachObjectivesSection
              coachId={coach.id}
              objectives={coachObjectives}
              canEdit={canEditCoachRole}
            />
          </CardContent>
        </Card>
      ) : null}

      {player ? (
        <Card>
          <CardHeader>
            <CardTitle>Player Teams</CardTitle>
            <CardDescription>This player&apos;s teams</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerTeamsSection
              playerId={player.id}
              memberships={playerTeams}
              availableTeams={availablePlayerTeams}
              canEdit={canEditPlayerRole}
            />
          </CardContent>
        </Card>
      ) : null}

      {player ? (
        <Card>
          <CardHeader>
            <CardTitle>Player Development</CardTitle>
            <CardDescription>
              For younger children it is usually recommended that objectives are
              limited to no more than one or two items, which they can focus on,
              rather than being overwhelmed by information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playerObjectivesError ? (
              <ErrorBanner message={playerObjectivesError} />
            ) : (
              <PlayerObjectivesSection
                playerId={player.id}
                objectives={playerObjectives}
                canEdit={canEditPlayerRole}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {player ? (
        <Card>
          <CardHeader>
            <CardTitle>Guardian Relationships</CardTitle>
            <CardDescription>This person&apos;s guardians</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerGuardiansSection
              playerId={player.id}
              links={playerGuardians}
              availableGuardians={availableGuardians}
              canEdit={canEditPlayerRole || canEdit}
            />
          </CardContent>
        </Card>
      ) : null}

      {guardian ? (
        <Card>
          <CardHeader>
            <CardTitle>Player Relationships</CardTitle>
            <CardDescription>This person&apos;s players</CardDescription>
          </CardHeader>
          <CardContent>
            <GuardianPlayersSection
              guardianId={guardian.id}
              links={guardianPlayerLinks}
              availablePlayers={availablePlayers}
              canEdit={canEditGuardianRole}
            />
          </CardContent>
        </Card>
      ) : null}

      {canEdit && club ? (
        <Card>
          <CardHeader>
            <CardTitle>Club Roles</CardTitle>
            <CardDescription>
              Add or remove player, coach, guardian, and manager roles for this
              person at {club.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonClubRolesSection person={person} clubId={club.id} />
          </CardContent>
        </Card>
      ) : null}

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Login Account</CardTitle>
            <CardDescription>
              Coaches, Guardians and Managers must create login accounts via an
              invite to their email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonInvitationPanel person={person} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
