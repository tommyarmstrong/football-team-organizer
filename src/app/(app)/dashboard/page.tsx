import Link from "next/link";
import { canEditActiveTeam, getCurrentTeam } from "@/lib/data/team";
import { getLastResult, getNextFixture } from "@/lib/data/matches";
import { getTopScorers } from "@/lib/data/stats";
import {
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

  const [next, last, scorers, canEdit] = await Promise.all([
    getNextFixture(),
    getLastResult(),
    getTopScorers(5),
    canEditActiveTeam(),
  ]);

  const errors = [next.error, last.error, scorers.error].filter(Boolean);

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
            <CardDescription>Upcoming scheduled match</CardDescription>
          </CardHeader>
          <CardContent>
            {next.data ? (
              <Link
                href={`/matches/${next.data.id}`}
                className="block space-y-1 transition-opacity hover:opacity-80"
              >
                <p className="text-lg font-medium">
                  vs {next.data.opponent_name}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatMatchDate(next.data.date)}
                  {formatKickoffTime(next.data.kickoff_time)
                    ? ` · ${formatKickoffTime(next.data.kickoff_time)}`
                    : ""}
                  {" · "}
                  {labelHomeAway(next.data.home_away)}
                  {next.data.venue ? ` · ${next.data.venue.name}` : ""}
                  {next.data.competition
                    ? ` · ${next.data.competition.name}`
                    : ""}
                </p>
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
            <CardDescription>Most recent played match</CardDescription>
          </CardHeader>
          <CardContent>
            {last.data ? (
              <Link
                href={`/matches/${last.data.id}`}
                className="block space-y-1 transition-opacity hover:opacity-80"
              >
                <p className="text-lg font-medium">
                  vs {last.data.opponent_name}{" "}
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
                  {last.data.competition
                    ? ` · ${last.data.competition.name}`
                    : ""}
                </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Top scorers</CardTitle>
          <CardDescription>
            Goals for {team.season_label} · see Stats for charts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scorers.data.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Record goals on played matches to see the table."
            />
          ) : (
            <ol className="divide-border border-border divide-y rounded-xl border">
              {scorers.data.map((row, index) => (
                <li key={row.player.id}>
                  <Link
                    href={`/people/${row.player.person_id}`}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground w-5 text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {playerDisplayName(row.player, {
                          shirtNumber: row.player.shirt_number,
                        })}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">
                      {row.goals} {row.goals === 1 ? "goal" : "goals"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
