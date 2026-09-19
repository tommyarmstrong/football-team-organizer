"use client";

import { ClubForm } from "@/components/clubs/club-form";
import { EditIconButton } from "@/components/shared/edit-icon-control";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import type { Club } from "@/lib/supabase/database.types";

export function EditClubDialog({ club }: { club: Club }) {
  return (
    <InlineFormDialog
      size="lg"
      title="Edit club details"
      description="Update name, branding, contact details, and philosophy."
      trigger={(open) => (
        <EditIconButton label="Edit club details" onClick={open} />
      )}
    >
      {(close) => (
        <ClubForm club={club} stayOnPage onSuccess={close} onCancel={close} />
      )}
    </InlineFormDialog>
  );
}
