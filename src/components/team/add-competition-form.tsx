"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COMPETITION_KINDS } from "@/lib/constants";
import { createCompetitionAction } from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function AddCompetitionForm() {
  const [state, formAction, pending] = useActionState(
    createCompetitionAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <Input
        id="new-comp-name"
        name="name"
        required
        aria-required="true"
        aria-label="Competition name"
        placeholder="e.g. County League"
        disabled={pending}
        className="min-w-0 flex-1"
      />
      <NativeSelect
        id="new-comp-kind"
        name="kind"
        aria-label="Competition kind"
        defaultValue="league"
        disabled={pending}
        className="sm:w-40"
      >
        {COMPETITION_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {labelCompetitionKind(kind)}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
