"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";
import { playerDisplayName } from "@/lib/format";
import type { RosterPlayer } from "@/lib/data/players";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { SquadPlayerIdentity } from "@/components/shared/squad-player-identity";

/** True when both lists contain the same players, ignoring order. */
export function sameSquadSelection(saved: string[], next: string[]): boolean {
  if (saved.length !== next.length) return false;
  const savedIds = new Set(saved);
  return next.every((id) => savedIds.has(id));
}

/**
 * Compact (match-day) squads save on every add and remove, so removal asks for
 * a second tap. Squads that save on submit already have Save/Cancel as the guard.
 */
export function squadRemovalNeedsConfirmation({
  compact,
  saveOnSubmit,
}: {
  compact: boolean;
  saveOnSubmit: boolean;
}): boolean {
  return compact && !saveOnSubmit;
}

/** Compact rows are 52px tall (44px+ touch targets); the default is unchanged. */
export function squadRowClassName(compact: boolean): string | undefined {
  return compact ? "min-h-[3.25rem] py-2" : undefined;
}

export type SquadSelectionLabels = {
  emptyTitle: string;
  emptyDescription: string;
  noRosterTitle: string;
  noRosterDescription: string;
  noneSelected: string;
  allSelected: string;
  squadName: string;
  addInputId: string;
};

export function SquadSelectionSection({
  roster,
  selectedPlayerIds,
  canEdit = true,
  saveAction,
  labels,
  saveOnSubmit = false,
  compact = false,
}: {
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
  canEdit?: boolean;
  saveAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  labels: SquadSelectionLabels;
  /** Keep add and remove local until Save writes the full squad once. */
  saveOnSubmit?: boolean;
  /** Denser phone layout: 52px rows, touch-sized controls, confirmed removal. */
  compact?: boolean;
}) {
  const selected = new Set(selectedPlayerIds);
  const selectedPlayers = roster.filter((player) => selected.has(player.id));

  if (!canEdit) {
    return selectedPlayers.length === 0 ? (
      <EmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    ) : (
      <ul className={objectListClassName}>
        {selectedPlayers.map((player) => (
          <li key={player.id}>
            <Link
              href={`/people/${player.person_id}`}
              className={objectListRowClassName(squadRowClassName(compact))}
            >
              <SquadPlayerIdentity
                name={playerDisplayName(player)}
                shirtNumber={player.shirt_number}
              />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (roster.length === 0) {
    return (
      <EmptyState
        title={labels.noRosterTitle}
        description={labels.noRosterDescription}
      />
    );
  }

  return (
    <SquadForm
      key={selectedPlayerIds.slice().sort().join(",")}
      roster={roster}
      selectedPlayerIds={selectedPlayerIds}
      saveAction={saveAction}
      labels={labels}
      saveOnSubmit={saveOnSubmit}
      compact={compact}
    />
  );
}

function SquadForm({
  roster,
  selectedPlayerIds,
  saveAction,
  labels,
  saveOnSubmit,
  compact,
}: {
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
  saveAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  labels: SquadSelectionLabels;
  saveOnSubmit: boolean;
  compact: boolean;
}) {
  const [state, formAction, actionPending] = useToastActionState(
    saveAction,
    INITIAL_ACTION_STATE,
  );
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState(selectedPlayerIds);
  const [addKey, setAddKey] = useState(0);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const confirmRemoval = squadRemovalNeedsConfirmation({
    compact,
    saveOnSubmit,
  });

  const selected = new Set(selectedIds);
  const selectedPlayers = roster.filter((player) => selected.has(player.id));
  const availablePlayers = roster.filter((player) => !selected.has(player.id));
  const isPending = saveOnSubmit ? actionPending : pending || actionPending;
  const dirty = !sameSquadSelection(selectedPlayerIds, selectedIds);

  function persist(nextIds: string[]) {
    setSelectedIds(nextIds);
    if (saveOnSubmit) return;
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
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {selectedPlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.noneSelected}</p>
      ) : (
        <ul className={objectListClassName}>
          {selectedPlayers.map((player) => (
            <li key={player.id} className="flex items-stretch">
              <Link
                href={`/people/${player.person_id}`}
                className={objectListRowClassName(squadRowClassName(compact))}
              >
                <SquadPlayerIdentity
                  name={playerDisplayName(player)}
                  shirtNumber={player.shirt_number}
                />
              </Link>
              {confirmRemoveId === player.id ? (
                <div className="flex shrink-0 items-center gap-1 pr-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                    className="h-11 px-3"
                    aria-label={`Confirm remove ${playerDisplayName(player)} from ${labels.squadName}`}
                    onClick={() => {
                      setConfirmRemoveId(null);
                      removePlayer(player.id);
                    }}
                  >
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-2.5"
                    autoFocus
                    onClick={() => setConfirmRemoveId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center pr-2">
                  <button
                    type="button"
                    onClick={() =>
                      confirmRemoval
                        ? setConfirmRemoveId(player.id)
                        : removePlayer(player.id)
                    }
                    disabled={isPending}
                    aria-label={`Remove ${playerDisplayName(player)} from ${labels.squadName}`}
                    title={`Remove ${playerDisplayName(player)} from ${labels.squadName}`}
                    className={cn(
                      "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
                      compact ? "size-11" : "size-9",
                    )}
                  >
                    <XIcon className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {availablePlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.allSelected}</p>
      ) : (
        <form
          key={addKey}
          action={addPlayer}
          className={cn(
            "flex gap-3 sm:flex-row sm:items-end",
            compact ? "items-end gap-2" : "flex-col",
          )}
        >
          <div
            className={cn(
              "min-w-0 flex-1",
              compact ? "space-y-1.5" : "space-y-2",
            )}
          >
            <Label htmlFor={labels.addInputId}>Add player</Label>
            <SearchableSelect
              id={labels.addInputId}
              name="player_id"
              size={compact ? "touch" : "default"}
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
          <Button
            type="submit"
            disabled={isPending}
            className={compact ? "h-11 sm:h-8" : undefined}
          >
            {isPending && !saveOnSubmit ? "Adding…" : "Add"}
          </Button>
        </form>
      )}

      {saveOnSubmit ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="player_id" value={id} />
          ))}
          <Button type="submit" disabled={isPending || !dirty}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          {dirty ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setSelectedIds(selectedPlayerIds);
                setAddKey((key) => key + 1);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </form>
      ) : null}

      {state.error ? <ErrorBanner message={state.error} /> : null}
    </div>
  );
}
