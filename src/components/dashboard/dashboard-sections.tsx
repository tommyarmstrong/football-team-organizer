import Link from "next/link";
import type { ReactNode } from "react";
import { getDashboardData } from "@/lib/data/dashboard";
import { listVenues } from "@/lib/data/venues";
import { type MatchWithRelations } from "@/lib/data/matches";
import {
  formatAwardMonth,
  formatCountLabel,
  playerDisplayName,
} from "@/lib/format";
import {
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
} from "@/lib/stats/competition-filters";
import { latestMonthAwards } from "@/lib/stats/dashboard-leaders";
import { filterResults } from "@/lib/stats/results-view";
import { seasonTilesFromResults } from "@/lib/stats/season-tiles";
import type { Team } from "@/lib/supabase/database.types";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { MatchSummaryCard } from "@/components/matches/match-summary-card";
import { SeasonTiles } from "@/components/stats/season-tiles";
import { competitionListToday } from "@/components/team/competition-list-badge";
import { CompetitionsSection } from "@/components/team/competitions-section";
import { FormStrip } from "@/components/stats/form-strip";
import { NewFixtureDialog } from "@/components/matches/new-fixture-dialog";

export async function DashboardSeasonTiles({ teamId }: { teamId: string }) {
  const stats = await getDashboardData(teamId).stats;
  if (stats.error) return null;

  const results = filterResults(
    stats.resultsOverTime,
    ALL_COMPETITIONS,
    ALL_LEAGUE_AND_CUP,
  );
  if (!seasonTilesFromResults(results)) return null;

  return (
    <Section title="Results">
      <SeasonTiles results={results} variant="glance" />
    </Section>
  );
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
  const data = getDashboardData(teamId);
  const [next, last, canEditMatch, competitions, venues] = await Promise.all([
    data.next,
    data.last,
    data.canEditMatch,
    data.competitions,
    listVenues(clubId),
  ]);

  const errors = [next.error, last.error].filter(Boolean);

  return (
    <div className="space-y-4">
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <FixtureSection
            title="Next fixture"
            teamName={teamName}
            match={next.data}
            emptyTitle="No upcoming fixture"
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
        </div>
        <div className="min-w-0">
          <FixtureSection
            title="Last result"
            teamName={teamName}
            match={last.data}
            emptyTitle="No results yet"
            emptyDescription="Played matches will show here."
          />
        </div>
      </div>
    </div>
  );
}

export async function DashboardForm({ teamId }: { teamId: string }) {
  const results = await getDashboardData(teamId).form;

  return (
    <Section title="Form">
      {results.error ? <ErrorBanner message={results.error} /> : null}
      {!results.error && results.form.length === 0 ? (
        <EmptyState
          title="No played matches"
          description="Form appears after you record league or cup results."
        />
      ) : null}
      {!results.error && results.form.length > 0 ? (
        <FormStrip form={results.form} />
      ) : null}
    </Section>
  );
}

export async function DashboardCompetitions({ team }: { team: Team }) {
  const data = getDashboardData(team.id);
  const [competitions, canEditTeam, venues] = await Promise.all([
    data.competitions,
    data.canEditTeam,
    listVenues(team.club_id),
  ]);

  return (
    <Section title="Competitions">
      {competitions.error ? (
        <ErrorBanner message={competitions.error} />
      ) : (
        <CompetitionsSection
          key={team.id}
          competitions={competitions.data}
          venues={venues.data}
          canEdit={canEditTeam}
          showAddForm={false}
          compact
          today={competitionListToday()}
        />
      )}
    </Section>
  );
}

/** Results and Form share one stats read. A missing results block does not leave a gap. */
export async function DashboardOverviewAndForm({ teamId }: { teamId: string }) {
  const [overview, form] = await Promise.all([
    DashboardSeasonTiles({ teamId }),
    DashboardForm({ teamId }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      {overview ? <div className="min-w-0">{overview}</div> : null}
      <div className={overview ? "min-w-0" : "min-w-0 lg:col-span-2"}>
        {form}
      </div>
    </div>
  );
}

type PlayerHighlight = {
  id: string;
  personId: string;
  name: string;
  valueLabel: string;
};

export async function DashboardPlayers({ teamId }: { teamId: string }) {
  const data = getDashboardData(teamId);
  const [squad, scorers, assists, potm, potMonth] = await Promise.all([
    data.squadSize,
    data.scorers,
    data.assists,
    data.potm,
    data.potMonth,
  ]);

  const errors = [
    squad.error,
    scorers.error,
    assists.error,
    potm.error,
    potMonth.error,
  ].filter(Boolean);

  const monthly = latestMonthAwards(potMonth.data)
    .map((award) => ({
      id: award.id,
      personId: award.player.person_id,
      name: playerDisplayName(award.player),
      valueLabel: formatAwardMonth(award.month),
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

  return (
    <Section title="Players">
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
      <ul
        className={`${objectListClassName} grid grid-cols-[max-content_minmax(0,1fr)_max-content]`}
      >
        <li className={playerRowClassName}>
          <span className="whitespace-nowrap">Squad size</span>
          <span />
          <span className="text-right whitespace-nowrap tabular-nums">
            {squad.error ? "—" : squad.count}
          </span>
        </li>
        {playerHighlightRows("Player of the month", monthly)}
        {playerHighlightRows(
          "Player of the match",
          potm.data.map((row) => ({
            id: row.playerId,
            personId: row.personId,
            name: row.name,
            valueLabel: formatCountLabel(row.count, "award", "awards"),
          })),
        )}
        {playerHighlightRows(
          "Most goals",
          scorers.data.map((row) => ({
            id: row.playerId,
            personId: row.personId,
            name: row.name,
            valueLabel: formatCountLabel(row.count, "goal", "goals"),
          })),
        )}
        {playerHighlightRows(
          "Most assists",
          assists.data.map((row) => ({
            id: row.playerId,
            personId: row.personId,
            name: row.name,
            valueLabel: formatCountLabel(row.count, "assist", "assists"),
          })),
        )}
      </ul>
    </Section>
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
  emptyDescription?: string;
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

  return (
    <Section title={title}>
      <MatchSummaryCard match={match} teamName={teamName} />
    </Section>
  );
}

/** Three shared columns: label, player, value. Same row height as competitions. */
const playerRowClassName =
  "col-span-3 grid min-h-9 grid-cols-subgrid items-center gap-3 px-3 py-1.5 text-sm";

function playerHighlightRows(label: string, rows: PlayerHighlight[]) {
  if (rows.length === 0) {
    return (
      <li className={playerRowClassName}>
        <span className="whitespace-nowrap">{label}</span>
        <span />
        <span className="text-right whitespace-nowrap">—</span>
      </li>
    );
  }

  return rows.map((row) => (
    <li key={row.id} className="col-span-3 grid grid-cols-subgrid">
      <Link
        href={`/people/${row.personId}`}
        className={objectListRowClassName(
          "col-span-3 grid min-h-9 grid-cols-subgrid py-1.5",
        )}
      >
        <span className="whitespace-nowrap">{label}</span>
        <span className="min-w-0 truncate">{row.name}</span>
        <span className="text-right whitespace-nowrap tabular-nums">
          {row.valueLabel}
        </span>
      </Link>
    </li>
  ));
}
