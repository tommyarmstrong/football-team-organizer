"use client";

import { deleteCoachAction } from "@/lib/coaches/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteCoachButton({ coachId }: { coachId: string }) {
  return (
    <ListDeleteButton
      label="Delete coach"
      confirmMessage="Delete this coach? This cannot be undone."
      deleteAction={() => deleteCoachAction(coachId)}
    />
  );
}
