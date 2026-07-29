import Link from "next/link";
import { listCoaches } from "@/lib/data/coaches";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import { coachDisplayName, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachForm } from "@/components/coaches/coach-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function qualificationSummary(coach: {
  dbs_checked: boolean;
  fa_level_1: boolean;
  fa_level_2: boolean;
}): string {
  const parts: string[] = [];
  if (coach.dbs_checked) parts.push("DBS");
  if (coach.fa_level_1) parts.push("FA L1");
  if (coach.fa_level_2) parts.push("FA L2");
  return parts.length > 0 ? parts.join(" · ") : "No qualifications recorded";
}

export default async function CoachesPage() {
  const [ctx, club, { data: coaches, error }] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    listCoaches(),
  ]);

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coaches"
        description={club ? `Coaching staff at ${club.name}` : "Coaching staff"}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {canAdd ? (
        <Card>
          <CardHeader>
            <CardTitle>Add coach</CardTitle>
            <CardDescription>
              Record contact details and FA / DBS qualifications. Coaches can be
              assigned to one or more teams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoachForm mode="create" />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3" aria-labelledby="coaches-list-heading">
        <h2 id="coaches-list-heading" className="text-lg font-medium">
          Coaching staff
        </h2>
        {!error && coaches.length === 0 ? (
          <EmptyState
            title="No coaches yet"
            description={
              canAdd
                ? "Add your first coach to keep contact and qualification details in one place."
                : "Coaching staff will appear here when club management adds them."
            }
          />
        ) : null}
        {!error && coaches.length > 0 ? (
          <ul className="divide-border border-border divide-y rounded-xl border">
            {coaches.map((coach) => (
              <li key={coach.id}>
                <Link
                  href={`/coaches/${coach.id}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div>
                    <p className="font-medium">{coachDisplayName(coach)}</p>
                    <p className="text-muted-foreground text-sm">
                      Joined {formatShortDate(coach.joined_date)} ·{" "}
                      {qualificationSummary(coach)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {coach.teams.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        No teams
                      </span>
                    ) : (
                      coach.teams.map((team) => (
                        <span
                          key={team.team_coach_id}
                          className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                        >
                          {team.team_name}
                        </span>
                      ))
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
