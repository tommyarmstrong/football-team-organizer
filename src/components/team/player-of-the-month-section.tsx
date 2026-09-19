"use client";

import Link from "next/link";
import { formatAwardMonth, playerDisplayName } from "@/lib/format";
import type { PlayerOfTheMonthWithPlayer } from "@/lib/data/player-of-the-month";
import type { NamedPlayer } from "@/lib/people/named-player";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { Button } from "@/components/ui/button";
import { deletePlayerOfTheMonthAction } from "@/lib/player-of-the-month/actions";
import { PlayerOfTheMonthForm } from "@/components/team/player-of-the-month-form";

export function PlayerOfTheMonthSection({
  awards,
  players = [],
  canEdit = true,
}: {
  awards: PlayerOfTheMonthWithPlayer[];
  players?: Array<NamedPlayer & { shirt_number?: number | null }>;
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      {awards.length === 0 ? (
        <EmptyState
          title="No player of the month yet"
          description={
            canEdit
              ? "Add monthly awards for standout players."
              : "Monthly awards will appear here."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {awards.map((award) => (
            <li key={award.id} className="flex items-stretch">
              {canEdit ? (
                <InlineFormDialog
                  title="Edit player of the month"
                  description="Update the player, month, and notes. Save keeps you on this page."
                  trigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className={objectListRowClassName()}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {playerDisplayName(award.player)}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {formatAwardMonth(award.month)}
                      </span>
                    </button>
                  )}
                >
                  {(close) => (
                    <PlayerOfTheMonthForm
                      mode="edit"
                      award={award}
                      players={players}
                      stayOnPage
                      onSuccess={close}
                      onCancel={close}
                    />
                  )}
                </InlineFormDialog>
              ) : (
                <Link
                  href={`/people/${award.player.person_id}`}
                  className={objectListRowClassName()}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {playerDisplayName(award.player)}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {formatAwardMonth(award.month)}
                  </span>
                </Link>
              )}
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListDeleteButton
                    label={`Delete ${playerDisplayName(award.player)} award`}
                    confirmMessage={`Delete player of the month for ${playerDisplayName(award.player)}?`}
                    deleteAction={deletePlayerOfTheMonthAction.bind(
                      null,
                      award.id,
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
          title="Add player of the month"
          description="Choose the player and month. Save keeps you on this page."
          trigger={(open) => (
            <Button type="button" variant="outline" onClick={open}>
              Add player of the month
            </Button>
          )}
        >
          {(close) => (
            <PlayerOfTheMonthForm
              mode="create"
              players={players}
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
