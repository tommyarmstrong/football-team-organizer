"use client";

import { deleteManagerAction } from "@/lib/managers/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteManagerButton({ managerId }: { managerId: string }) {
  return (
    <ListDeleteButton
      label="Delete manager"
      confirmMessage="Delete this manager? This cannot be undone."
      deleteAction={() => deleteManagerAction(managerId)}
    />
  );
}
