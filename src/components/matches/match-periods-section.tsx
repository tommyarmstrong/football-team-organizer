"use client";

import { XIcon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createPeriodAction,
  deletePeriodAction,
  savePeriodStartersAction,
  updatePeriodAction,
} from "@/lib/match-periods/actions";
import { playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import type { RosterPlayer } from "@/lib/data/players";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchPeriodsSection({
  matchId,
  periods,
  goals,
  squadPlayers,
  canEdit = true,
}: {
  matchId: string;
  periods: MatchPeriodWithStarters[];
  goals: GoalWithPlayers[];
  /** Players available for starters / goals (match-day squad, or full roster fallback). */
  squadPlayers: RosterPlayer[];
  canEdit?: boolean;
}) {
  if (!canEdit && periods.length === 0) {
    return (
      <EmptyState
        title="No periods"
        description="Halves, quarters, or other periods will appear here once added."
      />
    );
  }

  return (
    <div className="space-y-6">
      {canEdit ? <AddPeriodForm matchId={matchId} /> : null}

      {periods.length === 0 ? (
        <EmptyState
          title="No periods yet"
          description="Add a period (e.g. 1st half, Quarter 1), then set starting players and goals for that period."
        />
      ) : (
        <ul className="space-y-6">
          {periods.map((period) => {
            const periodGoals = goals.filter((g) => g.period_id === period.id);
            return (
              <li
                key={period.id}
                className="border-border space-y-5 rounded-xl border p-4"
              >
                <PeriodHeader
                  matchId={matchId}
                  period={period}
                  canEdit={canEdit}
                />
                <PeriodStarters
                  matchId={matchId}
                  period={period}
                  squadPlayers={squadPlayers}
                  canEdit={canEdit}
                />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Goals</h4>
                  <MatchGoalsSection
                    matchId={matchId}
                    goals={periodGoals}
                    players={squadPlayers}
                    canEdit={canEdit}
                    periodId={period.id}
                    periodName={period.name}
                    showPeriodField={false}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddPeriodForm({ matchId }: { matchId: string }) {
  const bound = createPeriodAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border space-y-3 rounded-xl border p-4"
    >
      <p className="text-sm font-medium">Add period</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="period-name">
            Name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="period-name"
            name="name"
            required
            aria-required="true"
            placeholder="e.g. 1st half"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period-sort">Sort order</Label>
          <Input
            id="period-sort"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={0}
            disabled={pending}
          />
        </div>
      </div>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add period"}
      </Button>
    </form>
  );
}

function PeriodHeader({
  matchId,
  period,
  canEdit,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return <h3 className="text-base font-semibold">{period.name}</h3>;
  }

  return <PeriodHeaderForm matchId={matchId} period={period} />;
}

function PeriodHeaderForm({
  matchId,
  period,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
}) {
  const boundUpdate = updatePeriodAction.bind(null, matchId, period.id);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    async () => deletePeriodAction(matchId, period.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`name-${period.id}`}>Name</Label>
          <Input
            id={`name-${period.id}`}
            name="name"
            required
            defaultValue={period.name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sort-${period.id}`}>Sort order</Label>
          <Input
            id={`sort-${period.id}`}
            name="sort_order"
            type="number"
            min={0}
            defaultValue={period.sort_order}
            disabled={pending}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save period"}
          </Button>
        </div>
        {state.error ? (
          <div className="sm:col-span-2">
            <ErrorBanner message={state.error} />
          </div>
        ) : null}
        {state.success ? (
          <p
            className="text-muted-foreground text-sm sm:col-span-2"
            role="status"
          >
            {state.success}
          </p>
        ) : null}
      </form>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Remove this period? Goals linked to it will keep their text label but lose the period link.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        {deleteState.error ? <ErrorBanner message={deleteState.error} /> : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={deletePending}
        >
          {deletePending ? "Removing…" : "Remove period"}
        </Button>
      </form>
    </div>
  );
}

function PeriodStarters({
  matchId,
  period,
  squadPlayers,
  canEdit,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  squadPlayers: RosterPlayer[];
  canEdit: boolean;
}) {
  const selected = new Set(period.starter_player_ids);
  const selectedPlayers = squadPlayers.filter((p) => selected.has(p.id));

  if (!canEdit) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Starting players</h4>
        {selectedPlayers.length === 0 ? (
          <p className="text-muted-foreground text-sm">None selected.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <li
                key={player.id}
                className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium"
              >
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (squadPlayers.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Starting players</h4>
        <EmptyState
          title="No players available"
          description="Select the match-day squad first, then choose who starts this period."
        />
      </div>
    );
  }

  return (
    <StartersForm
      key={period.starter_player_ids.slice().sort().join(",")}
      matchId={matchId}
      periodId={period.id}
      squadPlayers={squadPlayers}
      selectedPlayerIds={period.starter_player_ids}
    />
  );
}

function StartersForm({
  matchId,
  periodId,
  squadPlayers,
  selectedPlayerIds,
}: {
  matchId: string;
  periodId: string;
  squadPlayers: RosterPlayer[];
  selectedPlayerIds: string[];
}) {
  const bound = savePeriodStartersAction.bind(null, matchId, periodId);
  const [state, formAction, actionPending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState(selectedPlayerIds);

  const selected = new Set(selectedIds);
  const selectedPlayers = squadPlayers.filter((p) => selected.has(p.id));
  const availablePlayers = squadPlayers.filter((p) => !selected.has(p.id));
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
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Starting players</h4>
      <p className="text-muted-foreground text-xs">
        Players who start this period are assumed to complete it. Remove a
        player to deselect them, or add them back below.
      </p>

      {selectedPlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No starting players selected.
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
              </span>
              <button
                type="button"
                onClick={() => removePlayer(player.id)}
                disabled={isPending}
                aria-label={`Remove ${playerDisplayName(player)} from starting players`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor={`add_period_starter_${periodId}`}>Add player</Label>
        <NativeSelect
          id={`add_period_starter_${periodId}`}
          value=""
          disabled={isPending || availablePlayers.length === 0}
          onChange={(e) => addPlayer(e.target.value)}
        >
          <option value="">
            {availablePlayers.length === 0
              ? "All available players selected"
              : "Select a player to add…"}
          </option>
          {availablePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {playerDisplayName(player, {
                shirtNumber: player.shirt_number,
              })}
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
