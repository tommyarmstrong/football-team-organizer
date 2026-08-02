"use client";

import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addClubRoleToPersonAction,
  removeClubRoleFromPersonAction,
  sendInvitationAction,
} from "@/lib/people/actions";
import type { PersonWithRoles } from "@/lib/data/people";
import {
  PERSON_ROLE_ORDER,
  type PersonRoleKind,
} from "@/components/shared/role-chip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  none: "No login account",
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

const ROLE_LABELS: Record<PersonRoleKind, string> = {
  player: "Player",
  guardian: "Guardian",
  coach: "Coach",
  manager: "Manager",
};

type ClubRoleRow = {
  kind: PersonRoleKind;
  id: string;
};

function clubRolesForPerson(
  person: PersonWithRoles,
  clubId: string,
): ClubRoleRow[] {
  const rows: ClubRoleRow[] = [];
  for (const player of person.players) {
    if (player.club_id === clubId) rows.push({ kind: "player", id: player.id });
  }
  for (const guardian of person.guardians) {
    if (guardian.club_id === clubId) {
      rows.push({ kind: "guardian", id: guardian.id });
    }
  }
  for (const coach of person.coaches) {
    if (coach.club_id === clubId) rows.push({ kind: "coach", id: coach.id });
  }
  for (const manager of person.managers) {
    if (manager.club_id === clubId) {
      rows.push({ kind: "manager", id: manager.id });
    }
  }
  return rows.sort(
    (a, b) =>
      PERSON_ROLE_ORDER.indexOf(a.kind) - PERSON_ROLE_ORDER.indexOf(b.kind),
  );
}

export function PersonInvitationPanel({ person }: { person: PersonWithRoles }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSend() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await sendInvitationAction(person.id);
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Invitation updated.");
    });
  }

  return (
    <div className="space-y-3">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Account status</dt>
          <dd className="font-medium">
            {ACCOUNT_STATUS_LABELS[person.account_status] ??
              person.account_status}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Auth user</dt>
          <dd className="font-medium break-all">
            {person.auth_user_id ?? "Not linked"}
          </dd>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-muted-foreground">Outstanding invitation</dt>
          <dd className="font-medium">
            {person.outstanding_invitation
              ? `Expires ${new Date(person.outstanding_invitation.expires_at).toLocaleString("en-GB")}`
              : "None"}
          </dd>
        </div>
      </dl>

      {error ? <ErrorBanner message={error} /> : null}
      {message ? (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onSend}
        disabled={pending || !person.email || Boolean(person.auth_user_id)}
      >
        {pending
          ? "Sending…"
          : person.outstanding_invitation
            ? "Resend invitation"
            : "Send invitation"}
      </Button>
      {!person.email ? (
        <p className="text-muted-foreground text-sm">
          Add an email address before sending an invitation.
        </p>
      ) : null}
    </div>
  );
}

export function PersonClubRolesSection({
  person,
  clubId,
}: {
  person: PersonWithRoles;
  clubId: string;
}) {
  const roles = clubRolesForPerson(person, clubId);
  const present = new Set(roles.map((role) => role.kind));
  const addable = PERSON_ROLE_ORDER.filter((role) => !present.has(role));

  return (
    <div className="space-y-4">
      {roles.length === 0 ? (
        <EmptyState
          title="No club roles"
          description="Add a player, coach, guardian, or manager role for this person."
        />
      ) : (
        <ul className={objectListClassName}>
          {roles.map((role) => (
            <li key={`${role.kind}-${role.id}`} className="flex items-stretch">
              <div className={objectListRowClassName()}>
                <span className="min-w-0 flex-1 font-medium">
                  {ROLE_LABELS[role.kind]}
                </span>
              </div>
              <div className="flex items-center pr-2">
                <ListUnlinkButton
                  label={`Remove ${ROLE_LABELS[role.kind]} role`}
                  confirmMessage={`Remove the ${ROLE_LABELS[role.kind].toLowerCase()} role from this person?`}
                  unlinkAction={() =>
                    removeClubRoleFromPersonAction(
                      person.id,
                      role.kind,
                      role.id,
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {addable.length > 0 ? (
        <AddClubRoleForm personId={person.id} addable={addable} />
      ) : (
        <p className="text-muted-foreground text-sm">
          This person already has every club role.
        </p>
      )}
    </div>
  );
}

function AddClubRoleForm({
  personId,
  addable,
}: {
  personId: string;
  addable: PersonRoleKind[];
}) {
  const bound = addClubRoleToPersonAction.bind(null, personId);
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
        <Label htmlFor="club-role">Add role</Label>
        <NativeSelect
          id="club-role"
          name="role"
          required
          disabled={pending}
          defaultValue={addable[0]}
        >
          {addable.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
      {state.success ? (
        <p
          className="text-muted-foreground w-full text-sm sm:basis-full"
          role="status"
        >
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
