import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext, canManageClub } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPlayers } from "@/lib/data/players";
import { listCoaches } from "@/lib/data/coaches";
import { listGuardians } from "@/lib/data/guardians";
import { listManagers } from "@/lib/data/managers";
import { listVisibleTeams } from "@/lib/data/team";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ClubForm } from "@/components/clubs/club-form";
import { ClubTeamLink } from "@/components/clubs/club-team-link";
import {
  ClubCoachesList,
  ClubGuardiansList,
  ClubManagersList,
  ClubPlayersList,
} from "@/components/clubs/club-people-lists";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClubPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();

  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-8">
        <PageHeader title="Club" />
        <EmptyState
          title="No club found"
          description="Create a club from the no-access page, or ask an administrator for help."
        />
      </div>
    );
  }

  const [
    { data: allPlayers, error: playersError },
    { data: allCoaches, error: coachesError },
    { data: allGuardians, error: guardiansError },
    { data: managers, error: managersError },
    { data: allTeams, error: teamsError },
  ] = await Promise.all([
    listPlayers(),
    listCoaches(),
    listGuardians(),
    listManagers(club.id),
    listVisibleTeams(),
  ]);

  const players = allPlayers.filter((p) => p.club_id === club.id);
  const coaches = allCoaches.filter((c) => c.club_id === club.id);
  const guardians = allGuardians.filter((g) => g.club_id === club.id);
  const teams = allTeams.filter((t) => t.club_id === club.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Club"
        description={`${club.name} — manage club details and people.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Edit the club name, icon, colours, and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm
            key={`${club.updated_at}-${club.icon_url ?? ""}-${club.colour ?? ""}`}
            club={club}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Teams for {club.name}. Open a team to edit its profile and squad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {teamsError ? <ErrorBanner message={teamsError} /> : null}
          {!teamsError && teams.length === 0 ? (
            <EmptyState
              title="No teams yet"
              description="Add your first team for this club."
            />
          ) : null}
          {!teamsError && teams.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {teams.map((team) => (
                <li key={team.id}>
                  <ClubTeamLink team={team} />
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/teams/new" className={buttonVariants()}>
            Add team
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coaches</CardTitle>
          <CardDescription>
            Coaching staff for {club.name}. Assign coaches to teams from a
            coach&apos;s page or a team&apos;s staff card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {coachesError ? <ErrorBanner message={coachesError} /> : null}
          {!coachesError && coaches.length === 0 ? (
            <EmptyState
              title="No coaches yet"
              description="Add your first coach to keep contact and qualification details in one place."
            />
          ) : null}
          {!coachesError && coaches.length > 0 ? (
            <ClubCoachesList coaches={coaches} />
          ) : null}
          <Link href="/coaches/new" className={buttonVariants()}>
            Add coach
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Management</CardTitle>
          <CardDescription>
            Club managers for {club.name}. Same kind of people record as coaches
            and guardians, with broader permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {managersError ? <ErrorBanner message={managersError} /> : null}
          {!managersError && managers.length === 0 ? (
            <EmptyState
              title="No managers yet"
              description="Add a manager with name and contact details."
            />
          ) : null}
          {!managersError && managers.length > 0 ? (
            <ClubManagersList managers={managers} />
          ) : null}
          <Link
            href="/people"
            className={buttonVariants({ variant: "outline" })}
          >
            Manage people & invitations
          </Link>
          <Link href="/managers/new" className={buttonVariants()}>
            Add manager
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            Players belong to the club and can be assigned to one or more teams.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {playersError ? <ErrorBanner message={playersError} /> : null}
          {!playersError && players.length === 0 ? (
            <EmptyState
              title="No players yet"
              description="Add your first player to the club."
            />
          ) : null}
          {!playersError && players.length > 0 ? (
            <ClubPlayersList players={players} />
          ) : null}
          <Link href="/players/new" className={buttonVariants()}>
            Add player
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
          <CardDescription>
            Record contact details, then link players from a guardian&apos;s
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {guardiansError ? <ErrorBanner message={guardiansError} /> : null}
          {!guardiansError && guardians.length === 0 ? (
            <EmptyState
              title="No guardians yet"
              description="Add your first guardian to keep contact details in one place."
            />
          ) : null}
          {!guardiansError && guardians.length > 0 ? (
            <ClubGuardiansList guardians={guardians} />
          ) : null}
          <Link href="/guardians/new" className={buttonVariants()}>
            Add guardian
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
