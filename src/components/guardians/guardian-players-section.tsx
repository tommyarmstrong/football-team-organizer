"use client";

import { useActionState } from "react";
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
  const bound = linkGuardianToPlayerAction.bind(null, guardianId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-6">
      {canEdit && availablePlayers.length > 0 ? (
        <form
          key={state.success ?? "idle"}
          action={formAction}
          className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto_auto] sm:items-end"
        >
          <div className="space-y-2">
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
          <div className="space-y-2">
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
            {pending ? "Linking…" : "Link"}
          </Button>
          {state.error ? (
            <div className="sm:col-span-4">
              <ErrorBanner message={state.error} />
            </div>
          ) : null}
        </form>
      ) : null}

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
        <ul className="divide-border border-border space-y-3">
          {links.map((link) => (
            <li key={link.player_guardian_id}>
              {canEdit ? (
                <EditLinkForm guardianId={guardianId} link={link} />
              ) : (
                <div className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
                  <span className="font-medium">
                    {playerDisplayName({
                      first_name: link.player_first_name,
                      last_name: link.player_last_name,
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                    {link.legal_guardian ? " · Legal guardian" : ""}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditLinkForm({
  guardianId,
  link,
}: {
  guardianId: string;
  link: GuardianPlayerLink;
}) {
  const updateBound = updateGuardianPlayerLinkAction.bind(
    null,
    link.player_guardian_id,
    guardianId,
    link.player_id,
  );
  const [state, formAction, pending] = useActionState(
    updateBound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto_auto_auto] sm:items-end"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {playerDisplayName({
            first_name: link.player_first_name,
            last_name: link.player_last_name,
          })}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`relationship-${link.player_guardian_id}`}>
          Relationship
        </Label>
        <NativeSelect
          id={`relationship-${link.player_guardian_id}`}
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
          defaultChecked={link.legal_guardian}
          disabled={pending}
          className="border-input size-4 rounded"
        />
        Legal guardian
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
      <UnlinkButton
        linkId={link.player_guardian_id}
        guardianId={guardianId}
        playerId={link.player_id}
      />
      {state.error ? (
        <div className="sm:col-span-5">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
      {state.success ? (
        <p
          className="text-muted-foreground text-xs sm:col-span-5"
          role="status"
        >
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

function UnlinkButton({
  linkId,
  guardianId,
  playerId,
}: {
  linkId: string;
  guardianId: string;
  playerId: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => unlinkGuardianFromPlayerAction(linkId, guardianId, playerId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction}>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Unlink"}
      </Button>
    </form>
  );
}
