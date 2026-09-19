"use client";

import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { VenueForm } from "@/components/venues/venue-form";
import { Button } from "@/components/ui/button";

export function AddVenueDialog() {
  return (
    <InlineFormDialog
      size="lg"
      title="Add venue"
      description="Add a ground or training venue. Save keeps you on this page."
      trigger={(open) => (
        <Button type="button" onClick={open}>
          Add venue
        </Button>
      )}
    >
      {(close) => (
        <VenueForm
          mode="create"
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
