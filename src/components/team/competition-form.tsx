"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  AGE_GROUPS,
  COMPETITION_GENDERS,
  COMPETITION_GENDER_LABELS,
  COMPETITION_KINDS,
  COMPETITION_PERIODS,
  COMPETITION_PERIOD_LABELS,
  DEFAULT_COMPETITION_PERIODS,
} from "@/lib/constants";
import {
  saveCompetitionAndReturnToTeamAction,
  updateCompetitionAction,
} from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CompetitionForm({ competition }: { competition: Competition }) {
  const boundUpdate = updateCompetitionAction.bind(null, competition.id);
  const boundReturn = saveCompetitionAndReturnToTeamAction.bind(
    null,
    competition.id,
  );
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );
  const [returnState, returnAction, returnPending] = useActionState(
    boundReturn,
    INITIAL_ACTION_STATE,
  );

  const busy = pending || returnPending;
  const error = state.error ?? returnState.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            aria-required="true"
            defaultValue={competition.name}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kind">Kind</Label>
          <NativeSelect
            id="kind"
            name="kind"
            defaultValue={competition.kind ?? "league"}
            disabled={busy}
          >
            {COMPETITION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {labelCompetitionKind(kind)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="season">Season</Label>
          <Input
            id="season"
            name="season"
            placeholder="e.g. 2025/26"
            defaultValue={competition.season ?? ""}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="knockout">Knock out</Label>
          <NativeSelect
            id="knockout"
            name="knockout"
            defaultValue={competition.knockout ? "yes" : "no"}
            disabled={busy}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age_group">Age group</Label>
          <NativeSelect
            id="age_group"
            name="age_group"
            defaultValue={competition.age_group ?? ""}
            disabled={busy}
          >
            <option value="">None</option>
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <NativeSelect
            id="gender"
            name="gender"
            defaultValue={competition.gender ?? ""}
            disabled={busy}
          >
            <option value="">None</option>
            {COMPETITION_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {COMPETITION_GENDER_LABELS[gender]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="players_per_team">Players per team</Label>
          <Input
            id="players_per_team"
            name="players_per_team"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={competition.players_per_team ?? ""}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="periods">Periods</Label>
          <NativeSelect
            id="periods"
            name="periods"
            defaultValue={competition.periods ?? DEFAULT_COMPETITION_PERIODS}
            disabled={busy}
          >
            {COMPETITION_PERIODS.map((periods) => (
              <option key={periods} value={periods}>
                {COMPETITION_PERIOD_LABELS[periods]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minutes_per_period">Minutes per period</Label>
          <Input
            id="minutes_per_period"
            name="minutes_per_period"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={competition.minutes_per_period ?? ""}
            disabled={busy}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={competition.notes ?? ""}
            disabled={busy}
          />
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={returnAction}
          variant="outline"
          disabled={busy}
        >
          {returnPending ? "Saving…" : "Back to team"}
        </Button>
      </div>
    </form>
  );
}
