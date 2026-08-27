"use client";

import { deleteGuardianAction } from "@/lib/guardians/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteGuardianButton({ guardianId }: { guardianId: string }) {
  return (
    <ListDeleteButton
      label="Delete guardian"
      confirmMessage="Disable this guardian? Their person record moves to Previous members, player links are removed, and their login is unlinked."
      deleteAction={() => deleteGuardianAction(guardianId)}
    />
  );
}
