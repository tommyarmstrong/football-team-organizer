"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  linkGuardianToPlayerAction,
  unlinkGuardianFromPlayerAction,
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
            <li key={link.player_guardian_id} className="flex items-stretch">
              <Link
                href={`/players/${link.player_id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {playerDisplayName({
                    first_name: link.player_first_name,
                    last_name: link.player_last_name,
                  })}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                  {link.legal_guardian ? " · Legal guardian" : ""}
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Unlink ${playerDisplayName({
                      first_name: link.player_first_name,
                      last_name: link.player_last_name,
                    })}`}
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
