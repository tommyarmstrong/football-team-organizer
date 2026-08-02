import Link from "next/link";
import { listCoaches } from "@/lib/data/coaches";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachesDirectoryList } from "@/components/coaches/coaches-directory-list";
import { buttonVariants } from "@/components/ui/button";

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
          <CoachesDirectoryList coaches={coaches} />
        ) : null}
        {canAdd ? (
          <Link href="/coaches/new" className={buttonVariants()}>
            Add coach
          </Link>
        ) : null}
      </section>
    </div>
  );
}
