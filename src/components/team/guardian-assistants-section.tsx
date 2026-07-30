"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addGuardianAssistantAction,
  removeGuardianAssistantAction,
} from "@/lib/members/actions";
import type { Guardian } from "@/lib/supabase/database.types";
import type { GuardianAssistantEntry } from "@/lib/data/members";
import { guardianDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function GuardianAssistantsSection({
  teamId,
  assistants,
  candidates,
  canEdit,
}: {
  teamId: string;
  assistants: GuardianAssistantEntry[];
  candidates: Guardian[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {canEdit && candidates.length > 0 ? (
        <AddAssistantForm teamId={teamId} candidates={candidates} />
      ) : null}

      {assistants.length === 0 ? (
        <EmptyState
          title="No guardian assistants"
          description={
            canEdit
              ? "Assign a guardian with a linked login so they can record goals during matches."
              : "Guardian assistants for this team will appear here."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {assistants.map((entry) => (
            <li
              key={entry.team_member_id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <Link
                href={`/guardians/${entry.guardian_id}`}
                className="font-medium hover:underline"
              >
                {entry.name}
              </Link>
              {canEdit ? (
                <RemoveAssistantButton teamMemberId={entry.team_member_id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && candidates.length === 0 && assistants.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          All linked guardians are already assistants, or no other guardians
          have a login yet.
        </p>
      ) : null}
    </div>
  );
}

function AddAssistantForm({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: Guardian[];
}) {
  const bound = addGuardianAssistantAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <div className="space-y-2">
        <Label htmlFor="assistant-guardian">Add guardian assistant</Label>
        <SearchableSelect
          id="assistant-guardian"
          name="guardian_id"
          required
          disabled={pending}
          placeholder="Search guardians by name…"
          emptyMessage="No guardians match that name."
          options={candidates.map((guardian) => ({
            value: guardian.id,
            label: guardianDisplayName(guardian),
          }))}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="sm:col-span-2">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}

function RemoveAssistantButton({ teamMemberId }: { teamMemberId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => removeGuardianAssistantAction(teamMemberId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction}>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Remove"}
      </Button>
    </form>
  );
}
