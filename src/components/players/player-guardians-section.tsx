"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PhoneIcon } from "lucide-react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  GUARDIAN_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIP_LABELS,
} from "@/lib/constants";
import {
  linkPlayerToGuardianAction,
  unlinkGuardianFromPlayerAction,
} from "@/lib/guardians/actions";
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
  availableGuardians,
  canEdit,
}: {
  playerId: string;
  links: PlayerGuardianLink[];
  availableGuardians: GuardianOption[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <EmptyState
          title="No guardians linked"
          description={
            canEdit
              ? "Link an existing guardian to this player."
              : "Guardians linked to this player will appear here."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {links.map((link) => (
            <li key={link.player_guardian_id} className="flex items-stretch">
              <Link
                href={
                  link.guardian_person_id
                    ? `/people/${link.guardian_person_id}`
                    : `/guardians/${link.guardian_id}`
                }
                className={objectListRowClassName()}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{guardianDisplayName(link)}</p>
                </div>
                <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <RoleChip>
                    {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                  </RoleChip>
                  {link.legal_guardian ? (
                    <RoleChip>Legal guardian</RoleChip>
                  ) : null}
                  {link.phone ? (
                    <RoleChip>
                      <PhoneIcon
                        className="size-3 shrink-0"
                        aria-hidden="true"
                      />
                      {link.phone}
                    </RoleChip>
                  ) : null}
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Unlink ${guardianDisplayName(link)}`}
                    unlinkAction={() =>
                      unlinkGuardianFromPlayerAction(
                        link.player_guardian_id,
                        link.guardian_id,
                        playerId,
                      )
                    }
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && availableGuardians.length > 0 ? (
        <LinkGuardianForm
          playerId={playerId}
          availableGuardians={availableGuardians}
        />
      ) : null}
    </div>
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
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
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
            label: `${guardian.first_name} ${guardian.last_name}`.trim(),
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
