"use client";

import { saveTournamentSquadAction } from "@/lib/competition-players/actions";
import type { RosterPlayer } from "@/lib/data/players";
import { SquadSelectionSection } from "@/components/shared/squad-selection-section";

export function TournamentSquadSection({
  competitionId,
  roster,
  selectedPlayerIds,
  canEdit = true,
}: {
  competitionId: string;
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
  canEdit?: boolean;
}) {
  return (
    <SquadSelectionSection
      roster={roster}
      selectedPlayerIds={selectedPlayerIds}
      canEdit={canEdit}
      saveAction={saveTournamentSquadAction.bind(null, competitionId)}
      saveOnSubmit
      labels={{
        emptyTitle: "No tournament squad",
        emptyDescription:
          "Available players for this tournament have not been selected yet.",
        noRosterTitle: "No squad players",
        noRosterDescription:
          "Add players to the team roster before selecting a tournament squad.",
        noneSelected: "No players selected for this tournament.",
        allSelected: "All squad players are selected for this tournament.",
        squadName: "tournament squad",
        addInputId: "add_tournament_squad_player",
      }}
    />
  );
}
