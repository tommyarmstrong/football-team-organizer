"use client";

import { deleteManagerAction } from "@/lib/managers/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteManagerButton({ managerId }: { managerId: string }) {
  return (
    <ListDeleteButton
      label="Delete manager"
      confirmMessage="Disable this manager? Their person record moves to Previous members and their login is unlinked. You cannot delete yourself."
      deleteAction={() => deleteManagerAction(managerId)}
    />
  );
}
