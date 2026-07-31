import Link from "next/link";
import type { MatchListFilter } from "@/lib/constants";
import { matchAllowsEvents } from "@/lib/constants";
import { listMatches } from "@/lib/data/matches";
import { canEditActiveTeam, getActiveTeam } from "@/lib/data/team";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelHomeAway,
  labelMatchStatus,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { deleteMatchAction } from "@/lib/matches/actions";
import { cn } from "@/lib/utils";

const FILTERS: { value: MatchListFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "played", label: "Played" },
  { value: "other", label: "Postponed / cancelled" },
];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: MatchListFilter =
    rawFilter === "played" ||
    rawFilter === "other" ||
    rawFilter === "all" ||
    rawFilter === "upcoming"
      ? rawFilter
      : "all";

  const [{ data: matches, error }, team, canEdit] = await Promise.all([
    listMatches(filter),
    getActiveTeam(),
    canEditActiveTeam(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        description={
          team ? `Fixtures and results · ${team.name}` : "Fixtures and results"
        }
      />

      <div
        className="flex flex-wrap gap-2"
        role="navigation"
        aria-label="Match filters"
      >
        {FILTERS.map((item) => (
          <Link
            key={item.value}
            href={`/matches?filter=${item.value}`}
            aria-current={filter === item.value ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              filter === item.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {!error && matches.length === 0 ? (
        <EmptyState
          title={
            filter === "upcoming"
              ? "No upcoming fixtures"
              : filter === "played"
                ? "No played matches yet"
                : "No matches"
          }
          description="Create a fixture to get started."
          action={
            canEdit ? (
              <Link href="/matches/new" className={buttonVariants()}>
                New fixture
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {!error && matches.length > 0 ? (
        <div className="space-y-4">
          <ul className="divide-border border-border divide-y rounded-xl border">
            {matches.map((match) => (
              <li key={match.id} className="flex items-stretch">
                <Link
                  href={`/matches/${match.id}`}
                  className="hover:bg-muted/50 flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{match.opponent_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatMatchDate(match.date)}
                      {formatKickoffTime(match.kickoff_time)
                        ? ` · ${formatKickoffTime(match.kickoff_time)}`
                        : ""}
                      {" · "}
                      {labelHomeAway(match.home_away)}
                      {match.venue ? ` · ${match.venue.name}` : ""}
                      {match.competition ? ` · ${match.competition.name}` : ""}
                    </p>
                  </div>
                  <div className="text-sm sm:text-right">
                    {matchAllowsEvents(match.status) ? (
                      <p className="font-medium">
                        {formatScore(match.goals_for, match.goals_against)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        {labelMatchStatus(match.status)}
                      </p>
                    )}
                  </div>
                </Link>
                {canEdit ? (
                  <div className="flex items-center pr-2">
                    <ListDeleteButton
                      label={`Delete match vs ${match.opponent_name}`}
                      confirmMessage={`Delete the match against ${match.opponent_name}? This cannot be undone.`}
                      deleteAction={deleteMatchAction.bind(null, match.id)}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {canEdit ? (
            <Link href="/matches/new" className={buttonVariants()}>
              New fixture
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
