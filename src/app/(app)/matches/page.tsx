import { listMatches } from "@/lib/data/matches";
import { listCompetitions } from "@/lib/data/competitions";
import { canEditActiveMatchDay, getActiveTeam } from "@/lib/data/team";
import { listVenues } from "@/lib/data/venues";
import { teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchesDirectoryList } from "@/components/matches/matches-directory-list";
import { NewFixtureDialog } from "@/components/matches/new-fixture-dialog";

export default async function MatchesPage() {
  const [team, { data: matches, error }, canEdit] = await Promise.all([
    getActiveTeam(),
    listMatches(),
    canEditActiveMatchDay(),
  ]);
  const teamName = team ? teamDisplayName(team) : "Our team";
  const [{ data: competitions }, { data: venues }] = canEdit
    ? await Promise.all([
        team ? listCompetitions(team.id) : Promise.resolve({ data: [] }),
        team ? listVenues(team.club_id) : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="w-full max-w-lg space-y-6">
      <PageHeader
        title="Matches"
        actions={
          canEdit ? (
            <NewFixtureDialog
              competitions={competitions ?? []}
              venues={venues ?? []}
            />
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
