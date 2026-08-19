import Link from "next/link";
import {
  getViewerContext,
  canEditTeam,
  canManageClub,
} from "@/lib/authz/context";
import { getActiveTeam, isTeamArchived } from "@/lib/data/team";
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
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import { listVenues } from "@/lib/data/venues";
import { formatTrainingDays, teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { PlayerOfTheMonthSection } from "@/components/team/player-of-the-month-section";
import { TeamHeaderMeta } from "@/components/team/team-header-meta";
import { TeamRosterSection } from "@/components/team/team-roster-section";
import { TeamStaffSection } from "@/components/team/team-staff-section";
import { GuardianAssistantsSection } from "@/components/team/guardian-assistants-section";
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
    { data: roster, error: rosterError },
    { data: playerCandidates },
    { data: teamCoaches, error: teamCoachesError },
    { data: coachCandidates },
    { data: assistants },
    { data: assistantCandidates },
    { data: potmAwards, error: potmError },
    competitions,
  ] = await Promise.all([
    listRosterForTeam(team.id, { includeInactive: true }),
    club
      ? listPlayersNotOnTeam(club.id, team.id)
      : Promise.resolve({ data: [], error: null }),
    listTeamCoaches(team.id),
    listCoachesNotOnTeam(team.club_id, team.id),
    listGuardianAssistants(team.id, team.club_id),
    listGuardianAssistantCandidates(team.id, team.club_id),
    listPlayerOfTheMonth(team.id),
    listCompetitions(team.id),
  ]);

  const headCoach = teamCoaches.find((c) => c.role === "Head Coach") ?? null;
  const trainingDaysLabel = formatTrainingDays(team.training_days);
  const homeVenue =
    teamClubVenues.find((v) => v.id === team.home_venue_id) ?? null;
  const trainingVenue =
    teamClubVenues.find((v) => v.id === team.training_venue_id) ?? null;
  const archived = isTeamArchived(team);

  return (
    <div className="space-y-8">
      <PageHeader
        title={teamDisplayName(team)}
        description={
          <TeamHeaderMeta
            clubName={club?.name ?? ""}
            gender={team.gender}
            ageGroup={team.age_group}
            seasonLabel={team.season_label}
            archived={archived}
            headCoachName={headCoach?.name ?? null}
            headCoachPersonId={headCoach?.person_id ?? null}
            homeVenue={homeVenue}
            trainingVenue={trainingVenue}
            trainingDaysLabel={trainingDaysLabel}
          />
        }
        actions={
          canEdit ? (
            <EditIconLink href="/team/edit" label="Edit team" />
          ) : undefined
        }
      />

      {archived ? (
        <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm">
          <p className="font-medium">Archived season</p>
          <p className="text-muted-foreground mt-1">
            This is the historical record for {team.season_label}. Matches,
            squad, and scorers stay available. Start the next season from{" "}
            <Link
              href="/team/edit"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Edit team
            </Link>
            .
          </p>
        </div>
      ) : null}

      {team.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.photo_url}
          alt={`${team.name} team photo`}
          className="team-photo ring-foreground/10 h-48 w-full rounded-xl object-cover ring-1 sm:h-72 md:h-80"
        />
      ) : null}

      <Section title="Competitions">
        {competitions.error ? (
          <ErrorBanner message={competitions.error} />
        ) : (
          <CompetitionsSection
            key={team.id}
            competitions={competitions.data}
            canEdit={canEdit}
          />
        )}
      </Section>

      <Section title="Squad">
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
      </Section>

      <Section title="Coaching staff">
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
      </Section>

      <Section
        title="Guardian assistants"
        description="Guardians who can add fixtures and record match-day squad, periods, goals, assists, and cards. They cannot set player of the match."
      >
        <GuardianAssistantsSection
          key={team.id}
          teamId={team.id}
          assistants={assistants}
          candidates={assistantCandidates}
          canEdit={canEdit}
        />
      </Section>

      <Section
        title="Player of the month"
        description="Monthly awards for standout players this season."
      >
        {potmError ? (
          <ErrorBanner message={potmError} />
        ) : (
          <PlayerOfTheMonthSection awards={potmAwards} canEdit={canEdit} />
        )}
      </Section>
    </div>
  );
}
