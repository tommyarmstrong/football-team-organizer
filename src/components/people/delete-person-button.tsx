"use client";

import { deletePersonAction } from "@/lib/people/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeletePersonButton({ personId }: { personId: string }) {
  return (
    <ListDeleteButton
      label="Delete person"
      confirmMessage="Disable this person? They move to Previous members with their login unlinked. Historic match data is kept. You can re-activate them later."
      deleteAction={() => deletePersonAction(personId)}
    />
  );
}
