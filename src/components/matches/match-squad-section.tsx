"use client";

import { XIcon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { saveMatchSquadAction } from "@/lib/match-players/actions";
import { playerDisplayName } from "@/lib/format";
import type { RosterPlayer } from "@/lib/data/players";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

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
  const selected = new Set(selectedPlayerIds);
  const selectedPlayers = roster.filter((p) => selected.has(p.id));

  if (!canEdit) {
    return selectedPlayers.length === 0 ? (
      <EmptyState
        title="No match-day squad"
        description="Available players for this match have not been selected yet."
      />
    ) : (
      <ul className="flex flex-wrap gap-2">
        {selectedPlayers.map((player) => (
          <li
            key={player.id}
            className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium"
          >
            {playerDisplayName(player, { shirtNumber: player.shirt_number })}
          </li>
        ))}
      </ul>
    );
  }

  if (roster.length === 0) {
    return (
      <EmptyState
        title="No squad players"
        description="Add players to the team roster before selecting a match-day squad."
      />
    );
  }

  return (
    <SquadForm
      key={selectedPlayerIds.slice().sort().join(",")}
      matchId={matchId}
      roster={roster}
      selectedPlayerIds={selectedPlayerIds}
    />
  );
}

function SquadForm({
  matchId,
  roster,
  selectedPlayerIds,
}: {
  matchId: string;
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
}) {
  const bound = saveMatchSquadAction.bind(null, matchId);
  const [state, formAction, actionPending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState(selectedPlayerIds);

  const selected = new Set(selectedIds);
  const selectedPlayers = roster.filter((p) => selected.has(p.id));
  const availablePlayers = roster.filter((p) => !selected.has(p.id));
  const isPending = pending || actionPending;

  function persist(nextIds: string[]) {
    setSelectedIds(nextIds);
    const formData = new FormData();
    for (const id of nextIds) {
      formData.append("player_id", id);
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  function removePlayer(playerId: string) {
    persist(selectedIds.filter((id) => id !== playerId));
  }

  function addPlayer(playerId: string) {
    if (!playerId || selected.has(playerId)) return;
    persist([...selectedIds, playerId]);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Players in the match-day squad are available for periods, goals, cards,
        and players of the match. Remove a player to deselect them, or add them
        back below.
      </p>

      {selectedPlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No players selected for this match.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <li
              key={player.id}
              className="border-border bg-background inline-flex items-center gap-1 rounded-lg border py-1 pr-1 pl-2.5 text-sm font-medium"
            >
              <span>
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
                {!player.active ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (inactive)
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => removePlayer(player.id)}
                disabled={isPending}
                aria-label={`Remove ${playerDisplayName(player)} from match-day squad`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor="add_match_squad_player">Add player</Label>
        <NativeSelect
          id="add_match_squad_player"
          value=""
          disabled={isPending || availablePlayers.length === 0}
          onChange={(e) => addPlayer(e.target.value)}
        >
          <option value="">
            {availablePlayers.length === 0
              ? "All squad players selected"
              : "Select a player to add…"}
          </option>
          {availablePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {playerDisplayName(player, {
                shirtNumber: player.shirt_number,
              })}
              {!player.active ? " (inactive)" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
