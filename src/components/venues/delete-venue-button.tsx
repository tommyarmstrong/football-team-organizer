"use client";

import { deleteVenueAction } from "@/lib/venues/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteVenueButton({
  venueId,
  label = "Delete venue",
}: {
  venueId: string;
  label?: string;
}) {
  return (
    <ListDeleteButton
      label={label}
      confirmMessage="Delete this venue? This cannot be undone."
      deleteAction={() => deleteVenueAction(venueId)}
    />
  );
}
