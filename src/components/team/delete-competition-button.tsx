"use client";

import { deleteCompetitionAction } from "@/lib/team/actions";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

export function DeleteCompetitionButton({
  competitionId,
  competitionName,
  label = "Delete competition",
}: {
  competitionId: string;
  competitionName: string;
  label?: string;
}) {
  return (
    <ListDeleteButton
      label={label}
      confirmMessage={`Delete “${competitionName}”? Matches keep their fixture data; the competition link is cleared.`}
      deleteAction={() => deleteCompetitionAction(competitionId)}
    />
  );
}
