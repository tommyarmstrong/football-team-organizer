import Link from "next/link";
import { formatAwardMonth, playerDisplayName } from "@/lib/format";
import type { PlayerOfTheMonthWithPlayer } from "@/lib/data/player-of-the-month";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { buttonVariants } from "@/components/ui/button";
import { deletePlayerOfTheMonthAction } from "@/lib/player-of-the-month/actions";

export function PlayerOfTheMonthSection({
  awards,
  canEdit = true,
}: {
  awards: PlayerOfTheMonthWithPlayer[];
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
              <Link
                href={
                  canEdit
                    ? `/player-of-the-month/${award.id}/edit`
                    : `/people/${award.player.person_id}`
                }
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {playerDisplayName(award.player)}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {formatAwardMonth(award.month)}
                </span>
              </Link>
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
        <Link
          href="/player-of-the-month/new"
          className={buttonVariants({ variant: "outline" })}
        >
          Add player of the month
        </Link>
      ) : null}
    </div>
  );
}
