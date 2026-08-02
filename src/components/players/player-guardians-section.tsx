"use client";

import Link from "next/link";
import { PhoneIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  linkPlayerToGuardianAction,
  unlinkGuardianFromPlayerAction,
  updateGuardianPlayerLinkAction,
} from "@/lib/guardians/actions";
import {
  GUARDIAN_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIP_LABELS,
} from "@/lib/constants";
import type { PlayerGuardianLink } from "@/lib/data/guardians";
import { guardianDisplayName } from "@/lib/format";
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
import { RoleChip } from "@/components/shared/role-chip";
import { SearchableSelect } from "@/components/shared/searchable-select";

type GuardianOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export function PlayerGuardiansSection({
  playerId,
  links,
  availableGuardians = [],
  canEdit = false,
}: {
  playerId?: string;
  links: PlayerGuardianLink[];
  availableGuardians?: GuardianOption[];
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <EmptyState
          title="No guardians linked"
          description={
            canEdit
              ? "Link this player to one or more guardians."
              : "Guardians linked to this player will appear here."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {links.map((link) =>
            canEdit && playerId ? (
              <PlayerGuardianLinkRow
                key={link.player_guardian_id}
                playerId={playerId}
                link={link}
              />
            ) : (
              <li key={link.player_guardian_id}>
                <Link
                  href={`/guardians/${link.guardian_id}`}
                  className={objectListRowClassName()}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{guardianDisplayName(link)}</p>
                  </div>
                  <LinkChips link={link} />
                </Link>
              </li>
            ),
          )}
        </ul>
      )}

      {canEdit && playerId && availableGuardians.length > 0 ? (
        <LinkGuardianForm
          playerId={playerId}
          availableGuardians={availableGuardians}
        />
      ) : null}
    </div>
  );
}

function LinkChips({ link }: { link: PlayerGuardianLink }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      <RoleChip>{GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}</RoleChip>
      {link.legal_guardian ? <RoleChip>Legal guardian</RoleChip> : null}
      {link.emergency_contact ? <RoleChip>Emergency contact</RoleChip> : null}
      {link.phone ? (
        <RoleChip>
          <PhoneIcon className="size-3 shrink-0" aria-hidden="true" />
          {link.phone}
        </RoleChip>
      ) : null}
    </span>
  );
}

function PlayerGuardianLinkRow({
  playerId,
  link,
}: {
  playerId: string;
  link: PlayerGuardianLink;
}) {
  const [editing, setEditing] = useState(false);
  const name = guardianDisplayName(link);

  if (editing) {
    return (
      <li className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/guardians/${link.guardian_id}`}
            className="min-w-0 truncate text-sm font-medium hover:underline"
          >
            {name}
          </Link>
          <ListUnlinkButton
            label={`Unlink ${name}`}
            unlinkAction={() =>
              unlinkGuardianFromPlayerAction(
                link.player_guardian_id,
                link.guardian_id,
                playerId,
              )
            }
          />
        </div>
        <EditLinkForm
          playerId={playerId}
          link={link}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-stretch">
      <Link
        href={`/guardians/${link.guardian_id}`}
        className={objectListRowClassName()}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        <LinkChips link={link} />
      </Link>
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
          label={`Unlink ${name}`}
          unlinkAction={() =>
            unlinkGuardianFromPlayerAction(
              link.player_guardian_id,
              link.guardian_id,
              playerId,
            )
          }
        />
      </div>
    </li>
  );
}

function EditLinkForm({
  playerId,
  link,
  onCancel,
}: {
  playerId: string;
  link: PlayerGuardianLink;
  onCancel: () => void;
}) {
  const bound = updateGuardianPlayerLinkAction.bind(
    null,
    link.player_guardian_id,
    link.guardian_id,
    playerId,
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
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
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

function LinkGuardianForm({
  playerId,
  availableGuardians,
}: {
  playerId: string;
  availableGuardians: GuardianOption[];
}) {
  const bound = linkPlayerToGuardianAction.bind(null, playerId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="player-guardian">Guardian</Label>
        <SearchableSelect
          id="player-guardian"
          name="guardian_id"
          required
          disabled={pending}
          placeholder="Search guardians by name…"
          emptyMessage="No guardians match that name."
          options={availableGuardians.map((guardian) => ({
            value: guardian.id,
            label: guardianDisplayName({
              first_name: guardian.first_name,
              last_name: guardian.last_name,
            }),
          }))}
        />
      </div>
      <div className="space-y-2 sm:w-40">
        <Label htmlFor="player-guardian-relationship">Relationship</Label>
        <NativeSelect
          id="player-guardian-relationship"
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
