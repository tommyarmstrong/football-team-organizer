import Link from "next/link";
import { listMatches } from "@/lib/data/matches";
import { canEditActiveMatchDay, getActiveTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchesDirectoryList } from "@/components/matches/matches-directory-list";
import { buttonVariants } from "@/components/ui/button";

export default async function MatchesPage() {
  const [team, { data: matches, error }, canEdit] = await Promise.all([
    getActiveTeam(),
    listMatches(),
    canEditActiveMatchDay(),
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

      {error ? <ErrorBanner message={error} /> : null}

      {!error && matches.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Create a fixture to get started."
        />
      ) : null}

      {!error && matches.length > 0 ? (
        <MatchesDirectoryList matches={matches} teamName={teamName} />
      ) : null}
    </div>
  );
}
