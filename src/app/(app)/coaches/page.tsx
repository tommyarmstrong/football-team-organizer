import Link from "next/link";
import { listCoaches } from "@/lib/data/coaches";
import { getCurrentTeam } from "@/lib/data/team";
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
  const team = await getCurrentTeam();
  const { data: coaches, error } = await listCoaches(team?.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coaches"
        description={
          team
            ? `Coaching staff for ${team.name} · ${team.season_label}`
            : "Manage your coaching staff"
        }
      />

      {!team ? <ErrorBanner message="No team found for your account." /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add coach</CardTitle>
          <CardDescription>
            Record contact details and FA / DBS qualifications for your coaching
            staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachForm mode="create" />
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="coaches-list-heading">
        <h2 id="coaches-list-heading" className="text-lg font-medium">
          Coaching staff
        </h2>
        {!error && coaches.length === 0 ? (
          <EmptyState
            title="No coaches yet"
            description="Add your first coach to keep contact and qualification details in one place."
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
                  <span className="text-muted-foreground text-sm">View</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
