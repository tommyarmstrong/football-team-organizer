import Link from "next/link";
import type { MatchListFilter } from "@/lib/constants";
import { listMatches } from "@/lib/data/matches";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelMatchStatus,
  labelVenue,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTERS: { value: MatchListFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "played", label: "Played" },
  { value: "other", label: "Postponed / cancelled" },
  { value: "all", label: "All" },
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
      : "upcoming";

  const { data: matches, error } = await listMatches(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        description="Fixtures and results"
        actions={
          <Button render={<Link href="/matches/new" />}>New fixture</Button>
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
            <Button render={<Link href="/matches/new" />}>New fixture</Button>
          }
        />
      ) : null}

      {!error && matches.length > 0 ? (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="hover:bg-muted/50 flex flex-col gap-1 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">vs {match.opponent_name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatMatchDate(match.date)}
                    {formatKickoffTime(match.kickoff_time)
                      ? ` · ${formatKickoffTime(match.kickoff_time)}`
                      : ""}
                    {" · "}
                    {labelVenue(match.venue)}
                    {match.competition ? ` · ${match.competition.name}` : ""}
                  </p>
                </div>
                <div className="text-sm sm:text-right">
                  {match.status === "played" ? (
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
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
