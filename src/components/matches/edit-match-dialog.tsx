"use client";

import { MatchForm } from "@/components/matches/match-form";
import { EditIconButton } from "@/components/shared/edit-icon-control";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import type { RosterPlayer } from "@/lib/data/players";
import type { Competition, Match, Venue } from "@/lib/supabase/database.types";

export function EditMatchDialog({
  match,
  competitions,
  venues,
  players,
  matchDaySquadCount,
  canEditPlayerOfTheMatch,
  triggerClassName,
}: {
  match: Match;
  competitions: Competition[];
  venues: Venue[];
  players: RosterPlayer[];
  matchDaySquadCount: number;
  canEditPlayerOfTheMatch: boolean;
  triggerClassName?: string;
}) {
  return (
    <InlineFormDialog
      size="lg"
      title="Edit match"
      description="Update fixture details and status. Score comes from goals recorded on the match page."
      trigger={(open) => (
        <EditIconButton
          label="Edit match"
          onClick={open}
          className={triggerClassName}
        />
      )}
    >
      {(close) => (
        <MatchForm
          mode="edit"
          match={match}
          competitions={competitions}
          venues={venues}
          players={players}
          matchDaySquadCount={matchDaySquadCount}
          canEditPlayerOfTheMatch={canEditPlayerOfTheMatch}
          stayOnPage
          onSuccess={close}
          onCancel={close}
        />
      )}
    </InlineFormDialog>
  );
}
