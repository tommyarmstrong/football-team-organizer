import Link from "next/link";
import {
  getViewerContext,
  canEditTeam,
  canManageClub,
} from "@/lib/authz/context";
import { getActiveTeam } from "@/lib/data/team";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listCompetitions } from "@/lib/data/competitions";
import {
  listCoaches,
  listCoachesNotOnTeam,
  listTeamCoaches,
} from "@/lib/data/coaches";
import { listPlayersNotOnTeam, listRosterForTeam } from "@/lib/data/players";
import {
  listGuardianAssistantCandidates,
  listGuardianAssistants,
} from "@/lib/data/members";
import { listVenues } from "@/lib/data/venues";
import { labelGender } from "@/lib/format";
import { TRAINING_DAY_LABELS, type TrainingDay } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { TeamRosterSection } from "@/components/team/team-roster-section";
import { TeamStaffSection } from "@/components/team/team-staff-section";
import { GuardianAssistantsSection } from "@/components/team/guardian-assistants-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamPage() {
  const ctx = await getViewerContext();
  const [club, team, { data: clubCoaches }, { data: clubVenues }] =
    await Promise.all([
      getPrimaryClub(),
      getActiveTeam(),
      listCoaches(),
      listVenues(),
    ]);

  if (!ctx) {
    return (
      <div className="space-y-4">
        <PageHeader title="Team" />
        <ErrorBanner message="Not signed in." />
      </div>
    );
  }

  const createClubId = team?.club_id ?? club?.id ?? ctx.managementClubIds[0];
  const canCreateTeam = createClubId
    ? canManageClub(ctx, createClubId)
    : ctx.isManagement;

  const coachesForClub = club
    ? clubCoaches.filter((c) => c.club_id === club.id)
    : clubCoaches;
  const venuesForClub = club
    ? clubVenues.filter((v) => v.club_id === club.id)
    : clubVenues;

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
              <CreateTeamForm coaches={coachesForClub} venues={venuesForClub} />
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
  const teamClubVenues = clubVenues.filter((v) => v.club_id === team.club_id);

  const [
    { data: competitions, error: competitionsError },
    { data: roster, error: rosterError },
    { data: playerCandidates },
    { data: teamCoaches, error: teamCoachesError },
    { data: coachCandidates },
    { data: assistants },
    { data: assistantCandidates },
  ] = await Promise.all([
    listCompetitions(team.id),
    listRosterForTeam(team.id, { includeInactive: true }),
    club
      ? listPlayersNotOnTeam(club.id, team.id)
      : Promise.resolve({ data: [], error: null }),
    listTeamCoaches(team.id),
    listCoachesNotOnTeam(team.club_id, team.id),
    listGuardianAssistants(team.id, team.club_id),
    listGuardianAssistantCandidates(team.id, team.club_id),
  ]);

  const headCoach = teamCoaches.find((c) => c.role === "Head Coach") ?? null;
  const trainingDaysLabel = formatTrainingDays(team.training_days);
  const homeVenue =
    teamClubVenues.find((v) => v.id === team.home_venue_id) ?? null;
  const trainingVenue =
    teamClubVenues.find((v) => v.id === team.training_venue_id) ?? null;

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
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <ReadOnly label="Head coach" value={headCoach?.name ?? "—"} />
            <ReadOnly
              label="Home venue"
              value={homeVenue?.name ?? "—"}
              href={homeVenue ? `/venues/${homeVenue.id}` : null}
            />
            <ReadOnly
              label="Training venue"
              value={trainingVenue?.name ?? "—"}
              href={trainingVenue ? `/venues/${trainingVenue.id}` : null}
            />
            <ReadOnly label="Training days" value={trainingDaysLabel} />
          </dl>
          {canEdit ? (
            <Link
              href="/team/edit"
              className={buttonVariants({ variant: "outline" })}
            >
              Edit
            </Link>
          ) : null}
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
              assigned={teamCoaches}
              candidates={coachCandidates}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardian assistants</CardTitle>
          <CardDescription>
            Guardians who can record goal scorers and assists during matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianAssistantsSection
            key={team.id}
            teamId={team.id}
            assistants={assistants}
            candidates={assistantCandidates}
            canEdit={canEdit}
          />
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
    </div>
  );
}

function formatTrainingDays(days: string[] | null): string {
  if (!days || days.length === 0) return "—";
  return days.map((d) => TRAINING_DAY_LABELS[d as TrainingDay] ?? d).join(", ");
}

function ReadOnly({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {href ? (
          <Link
            href={href}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
