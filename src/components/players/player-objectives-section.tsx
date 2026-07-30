import Link from "next/link";
import { deletePlayerObjectiveAction } from "@/lib/players/actions";
import {
  labelPlayerObjectiveStatus,
  labelPlayerObjectiveType,
} from "@/lib/format";
import type { PlayerDevelopmentObjective } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import { buttonVariants } from "@/components/ui/button";

export function PlayerObjectivesSection({
  playerId,
  objectives,
  canEdit,
}: {
  playerId: string;
  objectives: PlayerDevelopmentObjective[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        For younger children it is usually recommended that objectives are
        limited to no more than one or two items, which they can focus on,
        rather than being overwhelmed by information.
      </p>

      {canEdit ? (
        <div className="flex justify-end">
          <Link
            href={`/players/${playerId}/objectives/new`}
            className={buttonVariants({ size: "sm" })}
          >
            Add
          </Link>
        </div>
      ) : null}

      {objectives.length === 0 ? (
        <EmptyState
          title="No development objectives"
          description={
            canEdit
              ? "Add zero or more objectives for this player."
              : "Development objectives will appear here when added."
          }
          action={
            canEdit ? (
              <Link
                href={`/players/${playerId}/objectives/new`}
                className={buttonVariants()}
              >
                Add
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {objectives.map((objective) => (
            <li key={objective.id} className="flex items-stretch">
              <Link
                href={`/players/${playerId}/objectives/${objective.id}`}
                className="hover:bg-muted/50 flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{objective.body}</p>
                  <p className="text-muted-foreground text-sm">
                    {labelPlayerObjectiveType(objective.objective_type)}
                  </p>
                </div>
                <div className="text-muted-foreground shrink-0 text-sm sm:text-right">
                  {labelPlayerObjectiveStatus(objective.status)}
                </div>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListDeleteButton
                    label="Delete objective"
                    confirmMessage="Delete this development objective? This cannot be undone."
                    deleteAction={deletePlayerObjectiveAction.bind(
                      null,
                      playerId,
                      objective.id,
                    )}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
