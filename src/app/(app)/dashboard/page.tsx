import Link from "next/link";
import type { ReactNode } from "react";
import {
  canEditActiveMatchDay,
  canEditActiveTeam,
  getCurrentTeam,
} from "@/lib/data/team";
import {
  getLastResult,
  getNextFixture,
  type MatchWithRelations,
} from "@/lib/data/matches";
import { listCompetitions } from "@/lib/data/competitions";
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import {
  getTopAssists,
  getTopPlayersOfTheMatch,
  getTopScorers,
} from "@/lib/data/stats";
import {
  formatAwardMonth,
  formatCountLabel,
  formatMatchTitle,
  matchSummaryLines,
  playerDisplayName,
  teamDisplayName,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { buttonVariants } from "@/components/ui/button";

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

  const displayName = teamDisplayName(team);
  const [
    next,
    last,
    scorers,
    assists,
    potm,
    competitions,
    potMonth,
    canEditMatch,
    canEditTeam,
  ] = await Promise.all([
    getNextFixture(),
    getLastResult(),
    getTopScorers(5),
    getTopAssists(5),
    getTopPlayersOfTheMatch(5),
    listCompetitions(team.id),
    listPlayerOfTheMonth(team.id, 5),
    canEditActiveMatchDay(),
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
        description={`${displayName} · ${team.season_label}`}
      />

      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}

      <div className="grid gap-8 sm:grid-cols-2">
        <FixtureSection
          title="Next fixture"
          teamName={displayName}
          match={next.data}
          emptyTitle="No upcoming fixture"
          emptyDescription="Schedule the next match."
          emptyAction={
            canEditMatch ? (
              <Link
                href="/matches/new"
                className={buttonVariants({ size: "sm" })}
              >
                New fixture
              </Link>
            ) : undefined
          }
        />

        <FixtureSection
          title="Last result"
          teamName={displayName}
          match={last.data}
          emptyTitle="No results yet"
          emptyDescription="Played matches will show here."
        />
      </div>

      <Section
        title="Competitions"
        description={`Leagues, cups, and other competitions for ${team.season_label}.`}
      >
        {competitions.error ? (
          <ErrorBanner message={competitions.error} />
        ) : (
          <CompetitionsSection
            key={team.id}
            competitions={competitions.data}
            canEdit={canEditTeam}
          />
        )}
      </Section>

      <LeaderboardSection
        title="Player of the month"
        emptyTitle="No monthly awards yet"
        emptyDescription="Add player of the month awards from the Team page."
        rows={potMonth.data.map((award, index) => ({
          id: award.id,
          personId: award.player.person_id,
          name: playerDisplayName(award.player),
          valueLabel: formatAwardMonth(award.month),
          rank: index + 1,
        }))}
      />

      <LeaderboardSection
        title="Top scorers"
        emptyTitle="No goals yet"
        emptyDescription="Record goals on played matches to see the table."
        rows={scorers.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: formatCountLabel(row.goals, "goal", "goals"),
        }))}
      />

      <LeaderboardSection
        title="Most assists"
        emptyTitle="No assists yet"
        emptyDescription="Record assists on goals to see the table."
        rows={assists.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: formatCountLabel(row.count, "assist", "assists"),
        }))}
      />

      <LeaderboardSection
        title="Player of the match"
        emptyTitle="No awards yet"
        emptyDescription="Select players of the match on played fixtures."
        rows={potm.data.map((row) => ({
          id: row.player.id,
          personId: row.player.person_id,
          name: playerDisplayName(row.player, {
            shirtNumber: row.player.shirt_number,
          }),
          valueLabel: formatCountLabel(row.count, "award", "awards"),
        }))}
      />
    </div>
  );
}

function FixtureSection({
  title,
  teamName,
  match,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  title: string;
  teamName: string;
  match: MatchWithRelations | null;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
}) {
  if (!match) {
    return (
      <Section title={title}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </Section>
    );
  }

  const meta = matchSummaryLines({
    competitionName: match.competition?.name,
    date: match.date,
    kickoffTime: match.kickoff_time,
    venueName: match.venue?.name,
  });

  return (
    <Section title={title}>
      <Link
        href={`/matches/${match.id}`}
        className="block space-y-1 transition-opacity hover:opacity-80"
      >
        <p className="text-lg font-medium">
          {formatMatchTitle(
            teamName,
            match.opponent_name,
            match.home_away,
            match.status,
            match.goals_for,
            match.goals_against,
          )}
        </p>
        {meta.competition ? (
          <p className="text-muted-foreground text-sm font-bold">
            {meta.competition}
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm">{meta.dateTime}</p>
        {meta.venue ? (
          <p className="text-muted-foreground text-sm">{meta.venue}</p>
        ) : null}
      </Link>
    </Section>
  );
}

function LeaderboardSection({
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
    rank?: number;
  }>;
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ol className={objectListClassName}>
          {rows.map((row, index) => (
            <li key={row.id}>
              <Link
                href={`/people/${row.personId}`}
                className={objectListRowClassName("justify-between")}
              >
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground w-5 text-sm">
                    {row.rank ?? index + 1}
                  </span>
                  <span className="font-medium">{row.name}</span>
                </span>
                <span className="text-sm tabular-nums">{row.valueLabel}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
