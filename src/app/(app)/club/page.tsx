import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext, canManageClub } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPlayers } from "@/lib/data/players";
import { listCoaches } from "@/lib/data/coaches";
import { listGuardians } from "@/lib/data/guardians";
import { listManagers } from "@/lib/data/managers";
import { listVisibleTeams } from "@/lib/data/team";
import {
  coachDisplayName,
  formatShortDate,
  guardianDisplayName,
  managerDisplayName,
  playerDisplayName,
} from "@/lib/format";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ClubForm } from "@/components/clubs/club-form";
import { ClubTeamLink } from "@/components/clubs/club-team-link";
import { PlayerForm } from "@/components/players/player-form";
import { CoachForm } from "@/components/coaches/coach-form";
import { GuardianForm } from "@/components/guardians/guardian-form";
import { ManagerForm } from "@/components/managers/manager-form";
import { CreateTeamForm } from "@/components/team/create-team-form";
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
            Edit the club name and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm club={club} />
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
          <PlayerForm mode="create" />
          {playersError ? <ErrorBanner message={playersError} /> : null}
          {!playersError && players.length === 0 ? (
            <EmptyState
              title="No players yet"
              description="Add your first player to the club."
            />
          ) : null}
          {!playersError && players.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {players.map((player) => (
                <li key={player.id}>
                  <Link
                    href={`/players/${player.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div>
                      <p className="font-medium">{playerDisplayName(player)}</p>
                      <p className="text-muted-foreground text-sm">
                        {player.position ?? "No position"}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">Edit</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
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
          <CoachForm mode="create" />
          {coachesError ? <ErrorBanner message={coachesError} /> : null}
          {!coachesError && coaches.length === 0 ? (
            <EmptyState
              title="No coaches yet"
              description="Add your first coach to keep contact and qualification details in one place."
            />
          ) : null}
          {!coachesError && coaches.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {coaches.map((coach) => (
                <li key={coach.id}>
                  <Link
                    href={`/coaches/${coach.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div>
                      <p className="font-medium">{coachDisplayName(coach)}</p>
                      <p className="text-muted-foreground text-sm">
                        Joined {formatShortDate(coach.joined_date)}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">Edit</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
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
          <GuardianForm mode="create" />
          {guardiansError ? <ErrorBanner message={guardiansError} /> : null}
          {!guardiansError && guardians.length === 0 ? (
            <EmptyState
              title="No guardians yet"
              description="Add your first guardian to keep contact details in one place."
            />
          ) : null}
          {!guardiansError && guardians.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {guardians.map((guardian) => (
                <li key={guardian.id}>
                  <Link
                    href={`/guardians/${guardian.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {guardianDisplayName(guardian)}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {guardian.email ??
                          guardian.phone ??
                          "No contact details"}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {guardian.players.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          Edit
                        </span>
                      ) : (
                        guardian.players.map((link) => (
                          <span
                            key={link.player_guardian_id}
                            className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                          >
                            {link.player_first_name} {link.player_last_name}
                            {" · "}
                            {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                          </span>
                        ))
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Create teams for {club.name}, or open a team to edit its profile and
            squad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CreateTeamForm coaches={coaches} />
          {teamsError ? <ErrorBanner message={teamsError} /> : null}
          {!teamsError && teams.length === 0 ? (
            <EmptyState
              title="No teams yet"
              description="Add your first team above."
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
          <ManagerForm mode="create" />
          {managersError ? <ErrorBanner message={managersError} /> : null}
          {!managersError && managers.length === 0 ? (
            <EmptyState
              title="No managers yet"
              description="Add a manager with name and contact details."
            />
          ) : null}
          {!managersError && managers.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {managers.map((manager) => (
                <li key={manager.id}>
                  <Link
                    href={`/managers/${manager.id}`}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {managerDisplayName(manager)}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {manager.email ?? manager.phone ?? "No contact details"}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">Edit</span>
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
