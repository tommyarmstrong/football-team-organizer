"use client";

import { useActionState } from "react";
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

  if (!canEdit) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Starting players</h4>
        {period.starters.length === 0 ? (
          <p className="text-muted-foreground text-sm">None selected.</p>
        ) : (
          <ul className="text-sm">
            {period.starters.map((p) => (
              <li key={p.id}>{playerDisplayName(p)}</li>
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
      matchId={matchId}
      period={period}
      squadPlayers={squadPlayers}
      selected={selected}
    />
  );
}

function StartersForm({
  matchId,
  period,
  squadPlayers,
  selected,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  squadPlayers: RosterPlayer[];
  selected: Set<string>;
}) {
  const bound = savePeriodStartersAction.bind(null, matchId, period.id);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <h4 className="text-sm font-medium">Starting players</h4>
      <p className="text-muted-foreground text-xs">
        Players who start this period are assumed to complete it.
      </p>
      <ul className="border-border divide-border max-h-56 divide-y overflow-y-auto rounded-lg border">
        {squadPlayers.map((player) => (
          <li key={player.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="player_id"
                value={player.id}
                defaultChecked={selected.has(player.id)}
                disabled={pending}
                className="border-input size-4 rounded"
              />
              <span>
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save starters"}
      </Button>
    </form>
  );
}
