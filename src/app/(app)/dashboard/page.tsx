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
  getResultsOverTime,
} from "@/lib/data/stats";
import {
  formatAwardMonth,
  formatCountLabel,
  matchCompetitionLabel,
  matchSummaryLines,
  playerDisplayName,
  teamDisplayName,
} from "@/lib/format";
import { STATS_FORM_LIMIT } from "@/lib/constants";
import { PitchGraphic } from "@/components/brand/pitch-graphic";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { RankBadge } from "@/components/shared/rank-badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { MatchScoreboard } from "@/components/matches/match-scoreboard";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { FormStrip } from "@/components/stats/form-strip";
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
    results,
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
    getResultsOverTime(),
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
    results.error,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="bg-pitch-deep text-header-foreground relative overflow-hidden rounded-3xl px-5 py-6 shadow-md sm:px-7 sm:py-8">
        <PitchGraphic className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-auto opacity-20 sm:h-56" />
        <p className="text-pitch-lime relative text-xs font-semibold tracking-[0.22em] uppercase">
          Dashboard
        </p>
        <h1 className="font-display relative mt-1 text-3xl leading-none tracking-tight sm:text-4xl">
          {displayName}
        </h1>
        <p className="relative mt-1.5 text-sm text-white/75">
          {team.season_label}
        </p>
      </div>

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
        title="Form"
        description={`Most recent ${STATS_FORM_LIMIT} played matches (oldest → newest)`}
      >
        {results.form.length === 0 ? (
          <EmptyState
            title="No played matches"
            description="Form appears after you record results."
          />
        ) : (
          <FormStrip form={results.form} />
        )}
      </Section>

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
        showAvatar={false}
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
        showAvatar={false}
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
        showAvatar={false}
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
    competitionName: matchCompetitionLabel(match),
    date: match.date,
    kickoffTime: match.kickoff_time,
    venueName: match.venue?.name,
  });

  return (
    <Section title={title}>
      <Link
        href={`/matches/${match.id}`}
        className="bg-card ring-foreground/10 block space-y-3 rounded-2xl p-4 shadow-sm ring-1 transition-opacity hover:opacity-80"
      >
        <MatchScoreboard
          teamName={teamName}
          opponentName={match.opponent_name}
          homeAway={match.home_away}
          status={match.status}
          goalsFor={match.goals_for}
          goalsAgainst={match.goals_against}
        />
        {meta.competition ? (
          <p className="text-primary text-center text-sm font-bold">
            {meta.competition}
          </p>
        ) : null}
        <p className="text-muted-foreground text-center text-sm">
          {meta.dateTime}
        </p>
        {meta.venue ? (
          <p className="text-muted-foreground text-center text-sm">
            {meta.venue}
          </p>
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
  showAvatar = true,
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
  showAvatar?: boolean;
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
                <span className="flex min-w-0 items-center gap-3">
                  <RankBadge rank={row.rank ?? index + 1} />
                  {showAvatar ? (
                    <InitialsAvatar name={row.name} className="size-8" />
                  ) : null}
                  <span className="truncate font-medium">{row.name}</span>
                </span>
                <span className="text-primary text-sm font-semibold tabular-nums">
                  {row.valueLabel}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
