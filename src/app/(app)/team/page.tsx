import {
  getViewerContext,
  canEditTeam,
  canManageClub,
} from "@/lib/authz/context";
import { getActiveTeam } from "@/lib/data/team";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listCompetitions } from "@/lib/data/competitions";
import { listCoachesNotOnTeam, listTeamCoaches } from "@/lib/data/coaches";
import { listPlayersNotOnTeam, listRosterForTeam } from "@/lib/data/players";
import { listTeamMembers } from "@/lib/data/members";
import { labelGender } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamProfileForm } from "@/components/team/team-profile-form";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { TeamRosterSection } from "@/components/team/team-roster-section";
import { TeamStaffSection } from "@/components/team/team-staff-section";
import { TeamAccessSection } from "@/components/team/team-access-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamPage() {
  const ctx = await getViewerContext();
  const [club, team] = await Promise.all([getPrimaryClub(), getActiveTeam()]);

  if (!ctx) {
    return (
      <div className="space-y-4">
        <PageHeader title="Team" />
        <ErrorBanner message="Not signed in." />
      </div>
    );
  }

  // Prefer the active team's club — getPrimaryClub() can be null even when the
  // user is management of the team they can already edit.
  const createClubId = team?.club_id ?? club?.id ?? ctx.managementClubIds[0];
  const canCreateTeam = createClubId
    ? canManageClub(ctx, createClubId)
    : ctx.isManagement;

  if (!team) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Team"
          description={club ? club.name : "No club found"}
        />
        {canCreateTeam ? (
          <Card>
            <CardHeader>
              <CardTitle>Create your first team</CardTitle>
              <CardDescription>
                Add a team to {club?.name}. You can create more later (e.g. U10
                Boys, U11 Girls A).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTeamForm />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No team yet"
            description="You do not have access to a team yet. Ask your club management to add you."
          />
        )}
      </div>
    );
  }

  const canEdit = canEditTeam(ctx, team.id);

  const [
    { data: competitions, error: competitionsError },
    { data: roster, error: rosterError },
    { data: playerCandidates },
    { data: teamCoaches, error: teamCoachesError },
    { data: coachCandidates },
    { data: teamMembers },
  ] = await Promise.all([
    listCompetitions(team.id),
    listRosterForTeam(team.id, { includeInactive: true }),
    club
      ? listPlayersNotOnTeam(club.id, team.id)
      : Promise.resolve({ data: [], error: null }),
    listTeamCoaches(team.id),
    club
      ? listCoachesNotOnTeam(club.id, team.id)
      : Promise.resolve({ data: [], error: null }),
    canEdit
      ? listTeamMembers(team.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={team.name}
        description={`${club?.name ?? ""} · ${labelGender(team.gender)} · ${team.age_group} · ${team.season_label}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {canEdit
              ? "Team details for this season."
              : "Team details (read-only)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <TeamProfileForm key={team.id} team={team} />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ReadOnly label="Team name" value={team.name} />
              <ReadOnly label="Age group" value={team.age_group} />
              <ReadOnly label="Gender" value={labelGender(team.gender)} />
              <ReadOnly label="Home ground" value={team.home_ground} />
              <ReadOnly label="Head coach" value={team.head_coach_name} />
              <ReadOnly label="Season" value={team.season_label} />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Squad</CardTitle>
          <CardDescription>
            Players in this team. People are shared across the club; adding here
            does not remove them from other teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rosterError ? (
            <ErrorBanner message={rosterError} />
          ) : (
            <TeamRosterSection
              key={team.id}
              teamId={team.id}
              clubId={team.club_id}
              roster={roster}
              candidates={playerCandidates}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coaching staff</CardTitle>
          <CardDescription>
            Coaches assigned to this team from the club&apos;s staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamCoachesError ? (
            <ErrorBanner message={teamCoachesError} />
          ) : (
            <TeamStaffSection
              key={team.id}
              teamId={team.id}
              clubId={team.club_id}
              assigned={teamCoaches}
              candidates={coachCandidates}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitions</CardTitle>
          <CardDescription>
            Leagues, cups, and other competitions for {team.season_label}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitionsError ? (
            <ErrorBanner message={competitionsError} />
          ) : (
            <CompetitionsSection
              key={team.id}
              competitions={competitions}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Team access</CardTitle>
            <CardDescription>
              Link coach and player accounts to this team. Guardians are managed
              on the Guardians page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamAccessSection
              key={team.id}
              teamId={team.id}
              members={teamMembers}
            />
          </CardContent>
        </Card>
      ) : null}

      {canCreateTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>Create another team</CardTitle>
            <CardDescription>Add another team to {club?.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
