"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  linkGuardianToPlayerAction,
  unlinkGuardianFromPlayerAction,
  updateGuardianPlayerLinkAction,
} from "@/lib/guardians/actions";
import {
  GUARDIAN_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIP_LABELS,
} from "@/lib/constants";
import type { GuardianPlayerLink } from "@/lib/data/guardians";
import { playerDisplayName } from "@/lib/format";
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
import { SearchableSelect } from "@/components/shared/searchable-select";

type PlayerOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export function GuardianPlayersSection({
  guardianId,
  links,
  availablePlayers,
  canEdit,
}: {
  guardianId: string;
  links: GuardianPlayerLink[];
  availablePlayers: PlayerOption[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <EmptyState
          title="No players linked"
          description={
            canEdit
              ? "Link this guardian to one or more players."
              : "This guardian is not linked to a player yet."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {links.map((link) => (
            <GuardianPlayerLinkRow
              key={link.player_guardian_id}
              guardianId={guardianId}
              link={link}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}

      {canEdit && availablePlayers.length > 0 ? (
        <LinkPlayerForm
          guardianId={guardianId}
          availablePlayers={availablePlayers}
        />
      ) : null}
    </div>
  );
}

function GuardianPlayerLinkRow({
  guardianId,
  link,
  canEdit,
}: {
  guardianId: string;
  link: GuardianPlayerLink;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const playerName = playerDisplayName({
    first_name: link.player_first_name,
    last_name: link.player_last_name,
  });

  if (canEdit && editing) {
    return (
      <li className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/players/${link.player_id}`}
            className="min-w-0 truncate text-sm font-medium hover:underline"
          >
            {playerName}
          </Link>
          <ListUnlinkButton
            label={`Unlink ${playerName}`}
            unlinkAction={() =>
              unlinkGuardianFromPlayerAction(
                link.player_guardian_id,
                guardianId,
                link.player_id,
              )
            }
          />
        </div>
        <EditLinkForm
          guardianId={guardianId}
          link={link}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-stretch">
      <Link
        href={`/players/${link.player_id}`}
        className={objectListRowClassName()}
      >
        <span className="min-w-0 flex-1 truncate font-medium">
          {playerName}
        </span>
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <span className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium">
            {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
          </span>
          {link.legal_guardian ? (
            <span className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium">
              Legal guardian
            </span>
          ) : null}
          {link.emergency_contact ? (
            <span className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium">
              Emergency contact
            </span>
          ) : null}
        </span>
      </Link>
      {canEdit ? (
        <div className="flex items-center gap-1 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <ListUnlinkButton
            label={`Unlink ${playerName}`}
            unlinkAction={() =>
              unlinkGuardianFromPlayerAction(
                link.player_guardian_id,
                guardianId,
                link.player_id,
              )
            }
          />
        </div>
      ) : null}
    </li>
  );
}

function EditLinkForm({
  guardianId,
  link,
  onCancel,
}: {
  guardianId: string;
  link: GuardianPlayerLink;
  onCancel: () => void;
}) {
  const bound = updateGuardianPlayerLinkAction.bind(
    null,
    link.player_guardian_id,
    guardianId,
    link.player_id,
  );
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="space-y-2 sm:w-44">
        <Label htmlFor={`edit-relationship-${link.player_guardian_id}`}>
          Relationship
        </Label>
        <NativeSelect
          id={`edit-relationship-${link.player_guardian_id}`}
          name="relationship"
          required
          disabled={pending}
          defaultValue={link.relationship}
        >
          {GUARDIAN_RELATIONSHIPS.map((value) => (
            <option key={value} value={value}>
              {GUARDIAN_RELATIONSHIP_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label className="flex min-h-9 items-center gap-2 text-sm sm:pb-1">
        <input
          type="checkbox"
          name="legal_guardian"
          disabled={pending}
          defaultChecked={link.legal_guardian}
          className="border-input size-4 rounded"
        />
        Legal guardian
      </label>
      <label className="flex min-h-9 items-center gap-2 text-sm sm:pb-1">
        <input
          type="checkbox"
          name="emergency_contact"
          disabled={pending}
          defaultChecked={link.emergency_contact}
          className="border-input size-4 rounded"
        />
        Emergency contact
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}

function LinkPlayerForm({
  guardianId,
  availablePlayers,
}: {
  guardianId: string;
  availablePlayers: PlayerOption[];
}) {
  const bound = linkGuardianToPlayerAction.bind(null, guardianId);
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
        <Label htmlFor="guardian-player">Player</Label>
        <SearchableSelect
          id="guardian-player"
          name="player_id"
          required
          disabled={pending}
          placeholder="Search players by name…"
          emptyMessage="No players match that name."
          options={availablePlayers.map((player) => ({
            value: player.id,
            label: playerDisplayName(player),
          }))}
        />
      </div>
      <div className="space-y-2 sm:w-40">
        <Label htmlFor="guardian-relationship">Relationship</Label>
        <NativeSelect
          id="guardian-relationship"
          name="relationship"
          required
          disabled={pending}
          defaultValue="guardian"
        >
          {GUARDIAN_RELATIONSHIPS.map((value) => (
            <option key={value} value={value}>
              {GUARDIAN_RELATIONSHIP_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label className="flex min-h-9 items-center gap-2 text-sm sm:pb-1">
        <input
          type="checkbox"
          name="legal_guardian"
          disabled={pending}
          className="border-input size-4 rounded"
        />
        Legal guardian
      </label>
      <label className="flex min-h-9 items-center gap-2 text-sm sm:pb-1">
        <input
          type="checkbox"
          name="emergency_contact"
          disabled={pending}
          className="border-input size-4 rounded"
        />
        Emergency contact
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Linking…" : "Add"}
      </Button>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
