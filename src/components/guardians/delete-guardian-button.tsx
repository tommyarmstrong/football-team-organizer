"use client";

import { deleteGuardianAction } from "@/lib/guardians/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteGuardianButton({ guardianId }: { guardianId: string }) {
  return (
    <ListDeleteButton
      label="Delete guardian"
      confirmMessage="Delete this guardian? Player links will be removed. This cannot be undone."
      deleteAction={() => deleteGuardianAction(guardianId)}
    />
  );
}
