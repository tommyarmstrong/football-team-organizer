"use client";

import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  linkRoleToPersonAction,
  sendInvitationAction,
} from "@/lib/people/actions";
import type { PersonWithRoles } from "@/lib/data/people";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  none: "No account",
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

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

export function PersonRoleLinkForm({
  personId,
  managers,
  coaches,
  guardians,
  players,
}: {
  personId: string;
  managers: { id: string; label: string }[];
  coaches: { id: string; label: string }[];
  guardians: { id: string; label: string }[];
  players: { id: string; label: string }[];
}) {
  const action = linkRoleToPersonAction.bind(null, personId);
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [role, setRole] = useState("guardian");

  const options =
    role === "manager"
      ? managers
      : role === "coach"
        ? coaches
        : role === "player"
          ? players
          : guardians;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Role type</Label>
          <NativeSelect
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={pending}
          >
            <option value="manager">Manager</option>
            <option value="coach">Coach</option>
            <option value="guardian">Guardian</option>
            <option value="player">Player</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role_id">Existing role record</Label>
          <NativeSelect id="role_id" name="role_id" required disabled={pending}>
            <option value="">Select…</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
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

      <Button type="submit" disabled={pending || options.length === 0}>
        {pending ? "Linking…" : "Link role"}
      </Button>
    </form>
  );
}
