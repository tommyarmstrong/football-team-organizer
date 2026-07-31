"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addGuardianAssistantAction,
  removeGuardianAssistantAction,
} from "@/lib/members/actions";
import type { GuardianWithPerson } from "@/lib/data/guardians";
import type { GuardianAssistantEntry } from "@/lib/data/members";
import { guardianDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function GuardianAssistantsSection({
  teamId,
  assistants,
  candidates,
  canEdit,
}: {
  teamId: string;
  assistants: GuardianAssistantEntry[];
  candidates: GuardianWithPerson[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
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
        <ul className={objectListClassName}>
          {assistants.map((entry) => (
            <li key={entry.team_member_id} className="flex items-stretch">
              <Link
                href={`/guardians/${entry.guardian_id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {entry.name}
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Remove ${entry.name} as guardian assistant`}
                    unlinkAction={() =>
                      removeGuardianAssistantAction(entry.team_member_id)
                    }
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        candidates.length > 0 ? (
          <AddAssistantForm teamId={teamId} candidates={candidates} />
        ) : assistants.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            All linked guardians are already assistants, or no other guardians
            have a login yet.
          </p>
        ) : null
      ) : null}
    </div>
  );
}

function AddAssistantForm({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: GuardianWithPerson[];
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
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
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
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
