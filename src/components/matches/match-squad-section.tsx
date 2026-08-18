"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { saveMatchSquadAction } from "@/lib/match-players/actions";
import { playerDisplayName } from "@/lib/format";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

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
      <ul className={objectListClassName}>
        {selectedPlayers.map((player) => (
          <li key={player.id}>
            <Link
              href={`/people/${player.person_id}`}
              className={objectListRowClassName()}
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
              </span>
            </Link>
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
  const [addKey, setAddKey] = useState(0);

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

  function addPlayer(formData: FormData) {
    const playerId = String(formData.get("player_id") ?? "");
    if (!playerId || selected.has(playerId)) return;
    persist([...selectedIds, playerId]);
    setAddKey((key) => key + 1);
  }

  return (
    <div className="space-y-4">
      {selectedPlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No players selected for this match.
        </p>
      ) : (
        <ul className={objectListClassName}>
          {selectedPlayers.map((player) => (
            <li key={player.id} className="flex items-stretch">
              <Link
                href={`/people/${player.person_id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {playerDisplayName(player, {
                    shirtNumber: player.shirt_number,
                  })}
                </span>
              </Link>
              <div className="flex items-center pr-2">
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  disabled={isPending}
                  aria-label={`Remove ${playerDisplayName(player)} from match-day squad`}
                  title={`Remove ${playerDisplayName(player)} from match-day squad`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {availablePlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          All squad players are selected for this match.
        </p>
      ) : (
        <form
          key={addKey}
          action={addPlayer}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="add_match_squad_player">Add player</Label>
            <SearchableSelect
              id="add_match_squad_player"
              name="player_id"
              required
              disabled={isPending}
              placeholder="Search players by name…"
              emptyMessage="No players match that name."
              options={availablePlayers.map((player) => ({
                value: player.id,
                label: `${playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}${!player.active ? " (inactive)" : ""}`,
              }))}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      )}

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
