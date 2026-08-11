import Link from "next/link";
import type { MatchListFilter } from "@/lib/constants";
import { listMatches } from "@/lib/data/matches";
import { canEditActiveTeam, getActiveTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchesDirectoryList } from "@/components/matches/matches-directory-list";
import { buttonVariants } from "@/components/ui/button";
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

  const [team, { data: matches, error }, canEdit] = await Promise.all([
    getActiveTeam(),
    listMatches(filter),
    canEditActiveTeam(),
  ]);
  const teamName = team ? teamDisplayName(team) : "Our team";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        actions={
          canEdit ? (
            <Link href="/matches/new" className={buttonVariants()}>
              New fixture
            </Link>
          ) : undefined
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
        />
      ) : null}

      {!error && matches.length > 0 ? (
        <MatchesDirectoryList matches={matches} teamName={teamName} />
      ) : null}
    </div>
  );
}
