"use client";

import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { Button } from "@/components/ui/button";
import type { CoachWithPerson } from "@/lib/data/coaches";
import type { Venue } from "@/lib/supabase/database.types";

export function AddTeamDialog({
  coaches,
  venues,
}: {
  coaches: CoachWithPerson[];
  venues: Venue[];
}) {
  return (
    <InlineFormDialog
      size="lg"
      title="Add team"
      description="Create a team for this club. Save keeps you on this page."
      trigger={(open) => (
        <Button type="button" onClick={open}>
          Add team
        </Button>
      )}
    >
      {(close) => (
        <CreateTeamForm
          coaches={coaches}
          venues={venues}
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
