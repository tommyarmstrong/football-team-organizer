"use client";

import { deletePersonAction } from "@/lib/people/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeletePersonButton({ personId }: { personId: string }) {
  return (
    <ListDeleteButton
      label="Delete person"
      confirmMessage="Disable this person? They leave the People directory and move to Previous members. Roles are removed or deactivated, and their login is unlinked. Historic match data is kept."
      deleteAction={() => deletePersonAction(personId)}
    />
  );
}
