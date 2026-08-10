import Link from "next/link";
import { canEditActiveTeam, getCurrentTeam } from "@/lib/data/team";
import { getLastResult, getNextFixture } from "@/lib/data/matches";
import { listCompetitions } from "@/lib/data/competitions";
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import {
  getTopAssists,
  getTopPlayersOfTheMatch,
  getTopScorers,
} from "@/lib/data/stats";
import {
  formatAwardMonth,
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelHomeAway,
  playerDisplayName,
  resultLetter,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" />
        <ErrorBanner message="No team found for your account." />
      </div>
    );
  }

  const [next, last, scorers, assists, potm, competitions, potMonth, canEdit] =
    await Promise.all([
      getNextFixture(),
      getLastResult(),
      getTopScorers(5),
      getTopAssists(5),
      getTopPlayersOfTheMatch(5),
      listCompetitions(team.id),
      listPlayerOfTheMonth(team.id, 5),
      canEditActiveTeam(),
    ]);

  const errors = [
    next.error,
    last.error,
    scorers.error,
    assists.error,
    potm.error,
    competitions.error,
    potMonth.error,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`${team.name} · ${team.season_label}`}
        actions={
          canEdit ? (
            <Link href="/matches/new" className={buttonVariants()}>
              New fixture
            </Link>
          ) : undefined
        }
      />

      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next fixture</CardTitle>
          </CardHeader>
          <CardContent>
            {next.data ? (
              <Link
                href={`/matches/${next.data.id}`}
                className="block space-y-1 transition-opacity hover:opacity-80"
              >
                <p className="text-lg font-medium">{next.data.opponent_name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatMatchDate(next.data.date)}
                  {formatKickoffTime(next.data.kickoff_time)
                    ? ` · ${formatKickoffTime(next.data.kickoff_time)}`
                    : ""}
                  {" · "}
                  {labelHomeAway(next.data.home_away)}
                </p>
                {next.data.venue ? (
                  <p className="text-muted-foreground text-sm">
                    {next.data.venue.name}
                  </p>
                ) : null}
                {next.data.competition ? (
                  <p className="text-muted-foreground text-sm">
                    {next.data.competition.name}
                  </p>
                ) : null}
              </Link>
            ) : (
              <EmptyState
                title="No upcoming fixture"
                description="Schedule the next match."
                action={
                  canEdit ? (
                    <Link
                      href="/matches/new"
                      className={buttonVariants({ size: "sm" })}
                    >
                      New fixture
                    </Link>
                  ) : undefined
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last result</CardTitle>
          </CardHeader>
          <CardContent>
            {last.data ? (
              <Link
                href={`/matches/${last.data.id}`}
                className="block space-y-1 transition-opacity hover:opacity-80"
              >
                <p className="text-lg font-medium">
                  {last.data.opponent_name}{" "}
                  <span className="text-muted-foreground">
                    {formatScore(last.data.goals_for, last.data.goals_against)}
                  </span>
                  {(() => {
                    const letter = resultLetter(
                      last.data.goals_for,
                      last.data.goals_against,
                    );
                    if (!letter) return null;
                    const label =
                      letter === "W" ? "Win" : letter === "D" ? "Draw" : "Loss";
                    return (
                      <span
                        className="text-muted-foreground ml-2 text-sm font-normal"
                        aria-label={label}
                      >
                        ({letter} · {label})
                      </span>
                    );
                  })()}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatMatchDate(last.data.date)}
                  {formatKickoffTime(last.data.kickoff_time)
                    ? ` · ${formatKickoffTime(last.data.kickoff_time)}`
                    : ""}
                  {" · "}
                  {labelHomeAway(last.data.home_away)}
                </p>
                {last.data.venue ? (
                  <p className="text-muted-foreground text-sm">
                    {last.data.venue.name}
                  </p>
                ) : null}
                {last.data.competition ? (
                  <p className="text-muted-foreground text-sm">
                    {last.data.competition.name}
                  </p>
                ) : null}
              </Link>
            ) : (
              <EmptyState
                title="No results yet"
                description="Played matches will show here."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <LeaderboardCard
        title="Top scorers"
        emptyTitle="No goals yet"
        emptyDescription="Record goals on played matches to see the table."
        rows={scorers.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: `${row.goals} ${row.goals === 1 ? "goal" : "goals"}`,
        }))}
      />

      <LeaderboardCard
        title="Assists"
        emptyTitle="No assists yet"
        emptyDescription="Record assists on goals to see the table."
        rows={assists.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: `${row.count} ${row.count === 1 ? "assist" : "assists"}`,
        }))}
      />

      <LeaderboardCard
        title="Player of the match"
        emptyTitle="No awards yet"
        emptyDescription="Select players of the match on played fixtures."
        rows={potm.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: `${row.count} ${row.count === 1 ? "award" : "awards"}`,
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Player of the month</CardTitle>
        </CardHeader>
        <CardContent>
          {potMonth.data.length === 0 ? (
            <EmptyState
              title="No monthly awards yet"
              description="Add player of the month awards from the Team page."
            />
          ) : (
            <ol className="divide-border border-border divide-y rounded-xl border">
              {potMonth.data.map((award, index) => (
                <li key={award.id}>
                  <Link
                    href={`/people/${award.player.person_id}`}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground w-5 text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {playerDisplayName(award.player)}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatAwardMonth(award.month)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
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
          {competitions.error ? (
            <ErrorBanner message={competitions.error} />
          ) : (
            <CompetitionsSection
              key={team.id}
              competitions={competitions.data}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardCard({
  title,
  emptyTitle,
  emptyDescription,
  rows,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  rows: Array<{
    id: string;
    personId: string;
    name: string;
    valueLabel: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <ol className="divide-border border-border divide-y rounded-xl border">
            {rows.map((row, index) => (
              <li key={row.id}>
                <Link
                  href={`/people/${row.personId}`}
                  className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium">{row.name}</span>
                  </span>
                  <span className="text-sm tabular-nums">{row.valueLabel}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
