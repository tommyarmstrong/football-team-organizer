"use client";

import Link from "next/link";
import { deletePlayerObjectiveAction } from "@/lib/players/actions";
import {
  labelPlayerObjectiveStatus,
  labelPlayerObjectiveType,
} from "@/lib/format";
import type { PlayerDevelopmentObjective } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { Button } from "@/components/ui/button";
import { PlayerObjectiveForm } from "@/components/players/player-objective-form";

export function PlayerObjectivesSection({
  personId,
  playerId,
  objectives,
  canEdit,
}: {
  personId: string;
  playerId: string;
  objectives: PlayerDevelopmentObjective[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {objectives.length === 0 ? (
        <EmptyState
          title="No development objectives"
          description={
            canEdit
              ? "Add zero or more objectives for this player."
              : "Development objectives will appear here when added."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {objectives.map((objective) => (
            <li key={objective.id} className="flex items-stretch">
              {canEdit ? (
                <InlineFormDialog
                  title="Edit objective"
                  description="Update the objective, type, and status. Save keeps you on this page."
                  trigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className={objectListRowClassName(
                        "flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between",
                      )}
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
                    </button>
                  )}
                >
                  {(close) => (
                    <PlayerObjectiveForm
                      playerId={playerId}
                      personId={personId}
                      objective={objective}
                      mode="edit"
                      stayOnPage
                      onSuccess={close}
                      onCancel={close}
                    />
                  )}
                </InlineFormDialog>
              ) : (
                <Link
                  href={`/people/${personId}/player-objectives/${objective.id}`}
                  className={objectListRowClassName(
                    "flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between",
                  )}
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
              )}
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

      {canEdit ? (
        <InlineFormDialog
          title="Add objective"
          description="Describe the objective and choose a type and status."
          trigger={(open) => (
            <Button type="button" onClick={open}>
              Add
            </Button>
          )}
        >
          {(close) => (
            <PlayerObjectiveForm
              playerId={playerId}
              personId={personId}
              mode="create"
              stayOnPage
              onSuccess={close}
              onCancel={close}
            />
          )}
        </InlineFormDialog>
      ) : null}
    </div>
  );
}
