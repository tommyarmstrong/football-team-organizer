"use client";

import { deletePersonAction } from "@/lib/people/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeletePersonButton({ personId }: { personId: string }) {
  return (
    <ListDeleteButton
      label="Delete person"
      confirmMessage="Delete this person? Their roles will be deactivated and they will leave the directory. Historic match data is kept. This cannot be undone."
      deleteAction={() => deletePersonAction(personId)}
    />
  );
}
