"use client";

import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { MatchForm } from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import type { Competition, Venue } from "@/lib/supabase/database.types";

export function NewFixtureDialog({
  competitions,
  venues,
  size = "default",
}: {
  competitions: Competition[];
  venues: Venue[];
  size?: "default" | "sm";
}) {
  return (
    <InlineFormDialog
      size="lg"
      title="New fixture"
      description="Schedule a match. Save keeps you on this page."
      trigger={(open) => (
        <Button type="button" size={size} onClick={open}>
          New fixture
        </Button>
      )}
    >
      {(close) => (
        <MatchForm
          mode="create"
          competitions={competitions}
          venues={venues}
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
