import { notFound, redirect } from "next/navigation";
import {
  canAccessClubAndPeople,
  canEditPersonDetails,
  canEditPlayer,
  canManageClub,
  canViewPlayerContact,
  getViewerContext,
  isClubStaff,
  isSelfPerson,
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
import { isPersonVisibleInDirectory } from "@/lib/people/directory";
import { personDisplayName } from "@/lib/people/person";
import { guardianDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { DeletePersonButton } from "@/components/people/delete-person-button";
import { ReactivatePersonButton } from "@/components/people/reactivate-person-button";
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
  const clubStaff = Boolean(club && isClubStaff(ctx, club.id));

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

  const self = isSelfPerson(ctx, person);

  const player =
    club != null
      ? (person.players.find(
          (row) => row.club_id === club.id && row.active_role,
        ) ??
        person.players.find((row) => row.active_role) ??
        null)
      : (person.players.find((row) => row.active_role) ?? null);
  const coach =
    club != null
      ? (person.coaches.find(
          (row) => row.club_id === club.id && row.active_role,
        ) ??
        person.coaches.find((row) => row.active_role) ??
        null)
      : (person.coaches.find((row) => row.active_role) ?? null);
  const guardian =
    club != null
      ? (person.guardians.find(
          (row) => row.club_id === club.id && row.active_role,
        ) ??
        person.guardians.find((row) => row.active_role) ??
        null)
      : (person.guardians.find((row) => row.active_role) ?? null);

  const roles = {
    player: person.players.some((row) => row.active_role),
    guardian: person.guardians.some((row) => row.active_role),
    coach: person.coaches.some((row) => row.active_role),
    manager: person.managers.some((row) => row.active_role),
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
  const canEditDetails = canEditPersonDetails(
    ctx,
    person,
    player?.id ?? null,
    club?.id ?? null,
  );
  const canEditCoachRole =
    coach != null && (canManageClub(ctx, coach.club_id) || self);
  const canEditGuardianRole =
    guardian != null && canManageClub(ctx, guardian.club_id);
  const restrictCoachProfile = Boolean(
    coach && !self && !canEdit && !clubStaff,
  );
  const showPersonContact = self || canEdit || clubStaff || canViewContact;

  const playerTeamIds = new Set(playerTeams.map((team) => team.team_id));
  const availablePlayerTeams = ctx.visibleTeams.filter(
    (team) =>
      player != null &&
      team.club_id === player.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      team.archived_at == null &&
      !playerTeamIds.has(team.id),
  );

  const coachTeamIds = new Set(coachTeams.map((team) => team.team_id));
  const availableCoachTeams = ctx.visibleTeams.filter(
    (team) =>
      coach != null &&
      team.club_id === coach.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      team.archived_at == null &&
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

  if (!canEdit && !self) {
    if (!club || !canAccessClubAndPeople(ctx)) redirect("/dashboard");
    const linkedPlayerTeamIds = (
      await Promise.all(
        guardianPlayerLinks.map((link) => getPlayerTeams(link.player_id)),
      )
    ).flatMap((result) => result.data.map((team) => team.team_id));
    const visible = isPersonVisibleInDirectory(
      {
        id: person.id,
        auth_user_id: person.auth_user_id,
        roles,
        playerIds: player ? [player.id] : [],
        playerTeamIds: playerTeams.map((team) => team.team_id),
        linkedPlayerIds: guardianPlayerLinks.map((link) => link.player_id),
        linkedPlayerTeamIds,
      },
      ctx,
      club.id,
    );
    if (!visible) redirect("/dashboard");
  }

  const linkedGuardianIds = new Set(
    playerGuardians.map((link) => link.guardian_id),
  );
  const availableGuardians = allGuardians.filter(
    (row) =>
      player != null &&
      row.club_id === player.club_id &&
      !linkedGuardianIds.has(row.id),
  );

  const displayName = personDisplayName(person);
  const title =
    player?.position != null && player.position !== ""
      ? `${displayName} (${player.position})`
      : displayName;
  const isDisabled = person.account_status === "disabled";

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={
          <PersonHeaderMeta
            email={showPersonContact ? person.email : null}
            phone={showPersonContact ? person.phone : null}
            roles={roles}
            player={restrictCoachProfile ? null : player}
            showPlayerAge={Boolean(player) && !restrictCoachProfile}
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
          canEditDetails ? (
            <>
              <EditIconLink
                href={`/people/${person.id}/edit`}
                label="Edit person"
              />
              {canEdit && !self && !isDisabled ? (
                <DeletePersonButton personId={person.id} />
              ) : null}
            </>
          ) : undefined
        }
      />

      {canEdit && isDisabled ? (
        <Section
          title="Previous member"
          description="This person is disabled and hidden from the People directory. Reactivate them, assign club roles, then send an invitation to relink a login."
        >
          <ReactivatePersonButton personId={person.id} />
        </Section>
      ) : null}

      {canEdit && isDisabled && club ? (
        <Section
          title="Club roles"
          description={`Add or deactivate roles at ${club.name}.`}
        >
          <PersonClubRolesSection person={person} clubId={club.id} />
        </Section>
      ) : null}

      {canEdit &&
      (isDisabled || roles.coach || roles.guardian || roles.manager) ? (
        <Section
          title="Login account"
          description="Coaches, Guardians and Managers must create login accounts via an invite to their email address."
        >
          <PersonInvitationPanel person={person} />
        </Section>
      ) : null}

      {coach ? (
        <Section title="Biography">
          {coachRecord?.biography ? (
            <p className="text-sm whitespace-pre-wrap">
              {coachRecord.biography}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No biography recorded.
            </p>
          )}
        </Section>
      ) : null}

      {coach ? (
        <Section title="Coaching philosophy">
          {coachRecord?.philosophy ? (
            <p className="text-sm whitespace-pre-wrap">
              {coachRecord.philosophy}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No philosophy recorded.
            </p>
          )}
        </Section>
      ) : null}

      {coach ? (
        <Section title="Teams" description="This coach's teams">
          <CoachTeamsSection
            coachId={coach.id}
            memberships={coachTeams}
            availableTeams={availableCoachTeams}
            canEdit={canEditCoachRole}
            openableTeamIds={ctx.visibleTeams.map((team) => team.id)}
          />
        </Section>
      ) : null}

      {coach && !restrictCoachProfile ? (
        <Section
          title="Coaching development"
          description="Optional goals for this coach's development."
        >
          <CoachObjectivesSection
            personId={person.id}
            coachId={coach.id}
            objectives={coachObjectives}
            canEdit={canEditCoachRole}
          />
        </Section>
      ) : null}

      {player ? (
        <Section title="Player teams" description="This player's teams">
          <PlayerTeamsSection
            playerId={player.id}
            memberships={playerTeams}
            availableTeams={availablePlayerTeams}
            canEdit={canEditPlayerRole}
          />
        </Section>
      ) : null}

      {player ? (
        <Section
          title="Player development"
          description="For younger children it is usually recommended that objectives are limited to no more than one or two items, which they can focus on, rather than being overwhelmed by information."
        >
          {playerObjectivesError ? (
            <ErrorBanner message={playerObjectivesError} />
          ) : (
            <PlayerObjectivesSection
              personId={person.id}
              playerId={player.id}
              objectives={playerObjectives}
              canEdit={canEditPlayerRole}
            />
          )}
        </Section>
      ) : null}

      {player ? (
        <Section
          title="Guardian relationships"
          description="This person's guardians"
        >
          <PlayerGuardiansSection
            playerId={player.id}
            links={playerGuardians}
            availableGuardians={availableGuardians}
            canEdit={canEditPlayerRole || canEdit}
          />
        </Section>
      ) : null}

      {guardian ? (
        <Section
          title="Player relationships"
          description="This person's players"
        >
          <GuardianPlayersSection
            guardianId={guardian.id}
            links={guardianPlayerLinks}
            availablePlayers={availablePlayers}
            canEdit={canEditGuardianRole}
          />
        </Section>
      ) : null}
    </div>
  );
}
