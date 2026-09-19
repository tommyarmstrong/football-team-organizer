"use client";

import { PersonForm } from "@/components/people/person-form";
import { EditIconButton } from "@/components/shared/edit-icon-control";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import type { PersonPlayerRef } from "@/lib/data/people";
import type { Person } from "@/lib/supabase/database.types";

export function EditPersonDialog({
  person,
  player,
  showPlayerDobSchool,
  showPlayerPosition,
  description,
}: {
  person: Person;
  player?: PersonPlayerRef | null;
  showPlayerDobSchool?: boolean;
  showPlayerPosition?: boolean;
  description: string;
}) {
  return (
    <InlineFormDialog
      size="lg"
      title="Edit person"
      description={description}
      trigger={(open) => <EditIconButton label="Edit person" onClick={open} />}
    >
      {(close) => (
        <PersonForm
          mode="edit"
          person={person}
          player={player}
          showPlayerDobSchool={showPlayerDobSchool}
          showPlayerPosition={showPlayerPosition}
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
