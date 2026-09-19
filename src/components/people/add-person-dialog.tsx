"use client";

import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { PersonForm } from "@/components/people/person-form";
import { Button } from "@/components/ui/button";

export function AddPersonDialog() {
  return (
    <InlineFormDialog
      size="lg"
      title="Add person"
      description="Add someone to the club. Save keeps you on this page."
      trigger={(open) => (
        <Button type="button" size="sm" onClick={open}>
          Add person
        </Button>
      )}
    >
      {(close) => (
        <PersonForm
          mode="create"
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
