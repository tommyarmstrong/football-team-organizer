import { Suspense } from "react";
import Link from "next/link";
import {
  getViewerContext,
  canEditTeam,
  canEditTeamHistory,
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
import {
  listPlayersNotOnTeam,
  listRosterForTeam,
  type PlayerWithPerson,
} from "@/lib/data/players";
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
  const [ctx, club, team] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    getActiveTeam(),
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
  const venueClubId = team?.club_id ?? club?.id;

  if (!team) {
    const [{ data: clubCoaches }, { data: clubVenues }] = await Promise.all([
      listCoaches(),
      venueClubId ? listVenues(venueClubId) : listVenues(),
    ]);
    const coachesForClub = club
      ? clubCoaches.filter((c) => c.club_id === club.id)
      : clubCoaches;
    const venuesForClub = club
      ? clubVenues.filter((v) => v.club_id === club.id)
      : clubVenues;
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
  const canEditHistory = canEditTeamHistory(ctx, team.id);

  // §5.2: candidate/"not on team" queries are deferred to separate Suspense
  // zones so they don't delay the primary team view.
  const [
    { data: clubVenues },
    { data: roster, error: rosterError },
    { data: teamCoaches, error: teamCoachesError },
    { data: assistants },
    { data: potmAwards, error: potmError },
    competitions,
  ] = await Promise.all([
    listVenues(team.club_id),
    listRosterForTeam(team.id, { includeInactive: true }),
    listTeamCoaches(team.id),
    listGuardianAssistants(team.id, team.club_id),
    listPlayerOfTheMonth(team.id),
    listCompetitions(team.id),
  ]);

  const teamClubVenues = clubVenues;

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
            This is a read-only historical record for {team.season_label}.
            Squad, matches, goals, periods, and competitions cannot be changed.
            Start the next season from{" "}
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
            canEdit={canEditHistory}
          />
        )}
      </Section>

      <Section title="Squad">
        {rosterError ? (
          <ErrorBanner message={rosterError} />
        ) : (
          // §5.2: candidates streamed in via a deferred Suspense boundary.
          <Suspense
            fallback={
              <TeamRosterSection
                key={team.id}
                teamId={team.id}
                roster={roster}
                candidates={[]}
                canEdit={canEditHistory}
              />
            }
          >
            <DeferredRosterSection
              teamId={team.id}
              clubId={club?.id}
              roster={roster}
              canEdit={canEditHistory}
            />
          </Suspense>
        )}
      </Section>

      <Section title="Coaching staff">
        {teamCoachesError ? (
          <ErrorBanner message={teamCoachesError} />
        ) : (
          // §5.2: coach candidates deferred.
          <Suspense
            fallback={
              <TeamStaffSection
                key={team.id}
                teamId={team.id}
                assigned={teamCoaches}
                candidates={[]}
                canEdit={canEditHistory}
              />
            }
          >
            <DeferredStaffSection
              teamId={team.id}
              clubId={team.club_id}
              assigned={teamCoaches}
              canEdit={canEditHistory}
            />
          </Suspense>
        )}
      </Section>

      <Section
        title="Guardian assistants"
        description="Guardians who can add fixtures and record match-day squad, periods, goals, assists, and cards. They cannot set player of the match."
      >
        {/* §5.2: guardian assistant candidates deferred. */}
        <Suspense
          fallback={
            <GuardianAssistantsSection
              key={team.id}
              teamId={team.id}
              assistants={assistants}
              candidates={[]}
              canEdit={canEditHistory}
            />
          }
        >
          <DeferredAssistantsSection
            teamId={team.id}
            clubId={team.club_id}
            assistants={assistants}
            canEdit={canEditHistory}
          />
        </Suspense>
      </Section>

      <Section
        title="Player of the month"
        description="Monthly awards for standout players this season."
      >
        {potmError ? (
          <ErrorBanner message={potmError} />
        ) : (
          <PlayerOfTheMonthSection
            awards={potmAwards}
            canEdit={canEditHistory}
          />
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// §5.2 — Deferred candidate loaders
// These async server components fetch the "not on team" candidate lists and
// render the full section. They are wrapped in Suspense boundaries so the
// primary team view (roster, staff, assistants) can stream to the user while
// the candidate queries complete independently.
// ---------------------------------------------------------------------------

async function DeferredRosterSection({
  teamId,
  clubId,
  roster,
  canEdit,
}: {
  teamId: string;
  clubId: string | undefined;
  roster: Awaited<ReturnType<typeof listRosterForTeam>>["data"];
  canEdit: boolean;
}) {
  const { data: candidates } = clubId
    ? await listPlayersNotOnTeam(clubId, teamId)
    : { data: [] as PlayerWithPerson[] };

  return (
    <TeamRosterSection
      key={teamId}
      teamId={teamId}
      roster={roster}
      candidates={candidates}
      canEdit={canEdit}
    />
  );
}

async function DeferredStaffSection({
  teamId,
  clubId,
  assigned,
  canEdit,
}: {
  teamId: string;
  clubId: string;
  assigned: Awaited<ReturnType<typeof listTeamCoaches>>["data"];
  canEdit: boolean;
}) {
  const { data: candidates } = await listCoachesNotOnTeam(clubId, teamId);

  return (
    <TeamStaffSection
      key={teamId}
      teamId={teamId}
      assigned={assigned}
      candidates={candidates}
      canEdit={canEdit}
    />
  );
}

async function DeferredAssistantsSection({
  teamId,
  clubId,
  assistants,
  canEdit,
}: {
  teamId: string;
  clubId: string;
  assistants: Awaited<ReturnType<typeof listGuardianAssistants>>["data"];
  canEdit: boolean;
}) {
  const { data: candidates } = await listGuardianAssistantCandidates(
    teamId,
    clubId,
  );

  return (
    <GuardianAssistantsSection
      key={teamId}
      teamId={teamId}
      assistants={assistants}
      candidates={candidates}
      canEdit={canEdit}
    />
  );
}
