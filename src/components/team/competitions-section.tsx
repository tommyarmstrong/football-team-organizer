import Link from "next/link";
import { deleteCompetitionAction } from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { AddCompetitionForm } from "@/components/team/add-competition-form";
import { CompetitionResultChip } from "@/components/team/competition-result-chip";

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
            <li key={competition.id} className="flex items-stretch">
              <Link
                href={`/competitions/${competition.id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {competition.name}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <CompetitionResultChip result={competition.result} />
                  <span className="text-muted-foreground">
                    {labelCompetitionKind(competition.kind)}
                  </span>
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListDeleteButton
                    label={`Delete ${competition.name}`}
                    confirmMessage={`Delete “${competition.name}”? Matches keep their fixture data; the competition link is cleared.`}
                    deleteAction={deleteCompetitionAction.bind(
                      null,
                      competition.id,
                    )}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && showAddForm ? <AddCompetitionForm /> : null}
    </div>
  );
}
