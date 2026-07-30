"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COMPETITION_KINDS } from "@/lib/constants";
import { updateCompetitionAction } from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CompetitionForm({ competition }: { competition: Competition }) {
  const boundUpdate = updateCompetitionAction.bind(null, competition.id);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );

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
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kind">Kind</Label>
          <NativeSelect
            id="kind"
            name="kind"
            defaultValue={competition.kind ?? "league"}
            disabled={pending}
          >
            {COMPETITION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {labelCompetitionKind(kind)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
