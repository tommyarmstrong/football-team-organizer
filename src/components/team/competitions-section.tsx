"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COMPETITION_KINDS } from "@/lib/constants";
import {
  createCompetitionAction,
  deleteCompetitionAction,
  updateCompetitionAction,
} from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CompetitionsSection({
  competitions,
  canEdit = true,
}: {
  competitions: Competition[];
  canEdit?: boolean;
}) {
  if (!canEdit) {
    return competitions.length === 0 ? (
      <EmptyState
        title="No competitions yet"
        description="Competitions this team enters will appear here."
      />
    ) : (
      <ul className="divide-border border-border divide-y rounded-xl border">
        {competitions.map((competition) => (
          <li
            key={competition.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="font-medium">{competition.name}</span>
            <span className="text-muted-foreground">
              {labelCompetitionKind(competition.kind)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AddCompetitionForm />
      {competitions.length === 0 ? (
        <EmptyState
          title="No competitions yet"
          description="Add a league, cup, or friendly series your team enters this season."
        />
      ) : (
        <ul className="space-y-4">
          {competitions.map((competition) => (
            <li
              key={competition.id}
              className="border-border rounded-xl border p-4"
            >
              <CompetitionRow competition={competition} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddCompetitionForm() {
  const [state, formAction, pending] = useActionState(
    createCompetitionAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
    >
      <div className="space-y-2">
        <Label htmlFor="new-comp-name">
          Add competition{" "}
          <span className="text-muted-foreground">(required)</span>
        </Label>
        <Input
          id="new-comp-name"
          name="name"
          required
          aria-required="true"
          placeholder="e.g. County League"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-comp-kind">Kind</Label>
        <NativeSelect
          id="new-comp-kind"
          name="kind"
          defaultValue="league"
          disabled={pending}
        >
          {COMPETITION_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {labelCompetitionKind(kind)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="sm:col-span-3">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}

function CompetitionRow({ competition }: { competition: Competition }) {
  const boundUpdate = updateCompetitionAction.bind(null, competition.id);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async () => deleteCompetitionAction(competition.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor={`comp-name-${competition.id}`}>
            Name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id={`comp-name-${competition.id}`}
            name="name"
            required
            aria-required="true"
            defaultValue={competition.name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`comp-kind-${competition.id}`}>Kind</Label>
          <NativeSelect
            id={`comp-kind-${competition.id}`}
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
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <form
        action={deleteAction}
        className="space-y-2"
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Delete “${competition.name}”? Matches keep their fixture data; the competition link is cleared.`,
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
          {deletePending ? "Deleting…" : "Delete"}
        </Button>
      </form>
    </div>
  );
}
