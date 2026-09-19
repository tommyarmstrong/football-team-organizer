"use client";

import { EditIconButton } from "@/components/shared/edit-icon-control";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { VenueForm } from "@/components/venues/venue-form";
import type { Venue } from "@/lib/supabase/database.types";

export function EditVenueDialog({ venue }: { venue: Venue }) {
  return (
    <InlineFormDialog
      size="lg"
      title="Edit venue"
      description="Update name, address, and surface."
      trigger={(open) => <EditIconButton label="Edit venue" onClick={open} />}
    >
      {(close) => (
        <VenueForm
          mode="edit"
          venue={venue}
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
