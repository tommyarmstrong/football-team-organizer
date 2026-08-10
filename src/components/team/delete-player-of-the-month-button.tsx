"use client";

import { deletePlayerOfTheMonthAction } from "@/lib/player-of-the-month/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeletePlayerOfTheMonthButton({
  awardId,
  playerName,
  label = "Delete award",
}: {
  awardId: string;
  playerName: string;
  label?: string;
}) {
  return (
    <ListDeleteButton
      label={label}
      confirmMessage={`Delete player of the month for ${playerName}?`}
      deleteAction={() => deletePlayerOfTheMonthAction(awardId)}
    />
  );
}
