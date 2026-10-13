"use client";

import { saveMatchSquadAction } from "@/lib/match-players/actions";
import type { RosterPlayer } from "@/lib/data/players";
import { SquadSelectionSection } from "@/components/shared/squad-selection-section";

export function MatchSquadSection({
  matchId,
  roster,
  selectedPlayerIds,
  canEdit = true,
}: {
  matchId: string;
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
  canEdit?: boolean;
}) {
  return (
    <SquadSelectionSection
      roster={roster}
      selectedPlayerIds={selectedPlayerIds}
      canEdit={canEdit}
      saveAction={saveMatchSquadAction.bind(null, matchId)}
      labels={{
        emptyTitle: "No match-day squad",
        emptyDescription:
          "Available players for this match have not been selected yet.",
        noRosterTitle: "No squad players",
        noRosterDescription:
          "Add players to the team roster before selecting a match-day squad.",
        noneSelected: "No players selected for this match.",
        allSelected: "All squad players are selected for this match.",
        squadName: "match-day squad",
        addInputId: "add_match_squad_player",
      }}
    />
  );
}
