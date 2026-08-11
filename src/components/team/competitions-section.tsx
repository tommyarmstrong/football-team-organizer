import Link from "next/link";
import type { Competition } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/shared/empty-state";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { CompetitionResultChip } from "@/components/team/competition-result-chip";
import { buttonVariants } from "@/components/ui/button";

export function CompetitionsSection({
  competitions,
  canEdit = true,
  showAddForm = true,
}: {
  competitions: Competition[];
  canEdit?: boolean;
  showAddForm?: boolean;
}) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <EmptyState
          title="No competitions yet"
          description={
            canEdit
              ? "Add a league, cup, or friendly series your team enters this season."
              : "Competitions this team enters will appear here."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Link
                href={`/competitions/${competition.id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {competition.name}
                </span>
                <CompetitionResultChip result={competition.result} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canEdit && showAddForm ? (
        <Link href="/competitions/new" className={buttonVariants()}>
          Add
        </Link>
      ) : null}
    </div>
  );
}
