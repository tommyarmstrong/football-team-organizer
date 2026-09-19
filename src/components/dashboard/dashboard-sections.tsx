import Link from "next/link";
import type { ReactNode } from "react";
import { getDashboardData } from "@/lib/data/dashboard";
import { listVenues } from "@/lib/data/venues";
import { type MatchWithRelations } from "@/lib/data/matches";
import {
  formatAwardMonth,
  formatCountLabel,
  matchCompetitionLabel,
  playerDisplayName,
} from "@/lib/format";
import { STATS_FORM_LIMIT } from "@/lib/constants";
import type { Team } from "@/lib/supabase/database.types";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { RankBadge } from "@/components/shared/rank-badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { MatchHero } from "@/components/matches/match-hero";
import { SeasonTiles } from "@/components/stats/season-tiles";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { FormStrip } from "@/components/stats/form-strip";
import { NewFixtureDialog } from "@/components/matches/new-fixture-dialog";
import { SharePostcardButton } from "@/components/postcards/share-postcard-button";

export async function DashboardSeasonTiles({ teamId }: { teamId: string }) {
  const { stats } = await getDashboardData(teamId);
  if (stats.error) return null;

  return <SeasonTiles results={stats.resultsOverTime} />;
}

export async function DashboardFixtures({
  teamId,
  teamName,
  clubId,
}: {
  teamId: string;
  teamName: string;
  clubId: string;
}) {
  const [{ next, last, lastPostcard, canEditMatch, competitions }, venues] =
    await Promise.all([getDashboardData(teamId), listVenues(clubId)]);
  const lastMatch = last.data;
  const postcard = lastPostcard?.data ?? null;

  const errors = [next.error, last.error].filter(Boolean);

  return (
    <div className="space-y-4">
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
      <div className="grid gap-8">
        <FixtureSection
          title="Next fixture"
          teamName={teamName}
          match={next.data}
          emptyTitle="No upcoming fixture"
          emptyDescription="Schedule the next match."
          emptyAction={
            canEditMatch ? (
              <NewFixtureDialog
                competitions={competitions.data}
                venues={venues.data}
                size="sm"
              />
            ) : undefined
          }
        />
        <FixtureSection
          title="Last result"
          teamName={teamName}
          match={lastMatch}
          emptyTitle="No results yet"
          emptyDescription="Played matches will show here."
          share={
            postcard ? (
              <SharePostcardButton
                imageUrl={`/matches/${postcard.matchId}/postcard`}
                caption={postcard.caption}
                fileName={postcard.fileName}
                title={
                  postcard.kind === "scheduled"
                    ? "Fixture postcard"
                    : "Match postcard"
                }
                description={
                  postcard.kind === "scheduled"
                    ? "Share this upcoming fixture, including the venue address."
                    : "Share a recap of this result. Player names follow the team’s privacy rules."
                }
                previewAlt={
                  postcard.kind === "scheduled"
                    ? "Fixture postcard"
                    : "Match postcard"
                }
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

export async function DashboardForm({ teamId }: { teamId: string }) {
  const { form: results } = await getDashboardData(teamId);

  return (
    <Section
      title="Form"
      description={`Most recent ${STATS_FORM_LIMIT} played matches (oldest → newest)`}
    >
      {results.error ? <ErrorBanner message={results.error} /> : null}
      {!results.error && results.form.length === 0 ? (
        <EmptyState
          title="No played matches"
          description="Form appears after you record results."
        />
      ) : null}
      {!results.error && results.form.length > 0 ? (
        <FormStrip form={results.form} />
      ) : null}
    </Section>
  );
}

export async function DashboardCompetitions({ team }: { team: Team }) {
  const [{ competitions, canEditTeam }, venues] = await Promise.all([
    getDashboardData(team.id),
    listVenues(team.club_id),
  ]);

  return (
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
          venues={venues.data}
          canEdit={canEditTeam}
        />
      )}
    </Section>
  );
}

export async function DashboardLeaderboards({ teamId }: { teamId: string }) {
  const { scorers, assists, potm, potMonth } = await getDashboardData(teamId);

  const errors = [
    scorers.error,
    assists.error,
    potm.error,
    potMonth.error,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
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
          name: playerDisplayName(row.player),
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
          name: playerDisplayName(row.player),
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
          name: playerDisplayName(row.player),
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
  share,
}: {
  title: string;
  teamName: string;
  match: MatchWithRelations | null;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  share?: ReactNode;
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

  return (
    <Section title={title}>
      <MatchHero
        size="card"
        href={`/matches/${match.id}`}
        teamName={teamName}
        opponentName={match.opponent_name}
        homeAway={match.home_away}
        status={match.status}
        goalsFor={match.goals_for}
        goalsAgainst={match.goals_against}
        competitionName={matchCompetitionLabel(match)}
        date={match.date}
        kickoffTime={match.kickoff_time}
        meetupTime={match.meetup_time}
        venueName={match.venue?.name ?? null}
        actions={share}
      />
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
                <span className="flex min-w-0 items-center gap-3">
                  <RankBadge rank={row.rank ?? index + 1} />
                  <InitialsAvatar name={row.name} className="size-8" />
                  <span className="truncate font-medium">{row.name}</span>
                </span>
                <span className="font-display text-foreground text-lg tabular-nums">
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
