"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { ExtraTimeOrPenaltyPeriodName } from "@/lib/constants";
import { createPeriodAction } from "@/lib/match-periods/actions";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { PeriodStartersFields } from "@/components/matches/match-period-edit-section";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function MatchPeriodCreateSection({
  matchId,
  availablePeriodNames,
  goals,
  squadPlayers,
  defaultStarterPlayerIds,
}: {
  matchId: string;
  availablePeriodNames: ExtraTimeOrPenaltyPeriodName[];
  goals: GoalWithPlayers[];
  squadPlayers: RosterPlayer[];
  defaultStarterPlayerIds: string[];
}) {
  const bound = createPeriodAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [selectedIds, setSelectedIds] = useState(defaultStarterPlayerIds);

  if (availablePeriodNames.length === 0) {
    return (
      <EmptyState
        title="Nothing left to add"
        description="Extra time and a penalty shootout are already on this match."
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="period-name">Period</Label>
        <NativeSelect id="period-name" name="name" required disabled={pending}>
          {availablePeriodNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {squadPlayers.length === 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Starting players</h3>
          <EmptyState
            title="No players available"
            description="Select the match-day squad first, then choose who starts this period."
          />
        </div>
      ) : (
        <PeriodStartersFields
          idPrefix="new_period"
          squadPlayers={squadPlayers}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          disabled={pending}
          inputName="player_id"
        />
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Goals</h3>
        <MatchGoalsSection matchId={matchId} goals={goals} canEdit={false} />
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <FormActions pending={pending} cancelHref={`/matches/${matchId}`} />
    </form>
  );
}
