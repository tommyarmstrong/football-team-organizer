"use client";

import { CompetitionForm } from "@/components/team/competition-form";
import { EditIconButton } from "@/components/shared/edit-icon-control";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import type { Competition, Venue } from "@/lib/supabase/database.types";

export function EditCompetitionDialog({
  competition,
  venues,
}: {
  competition: Competition;
  venues: Venue[];
}) {
  return (
    <InlineFormDialog
      size="lg"
      title="Edit competition"
      description="Update competition details. Save keeps you on this page."
      trigger={(open) => (
        <EditIconButton label="Edit competition" onClick={open} />
      )}
    >
      {(close) => (
        <CompetitionForm
          competition={competition}
          venues={venues}
          mode="edit"
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
