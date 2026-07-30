"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { saveMatchSquadAction } from "@/lib/match-players/actions";
import { playerDisplayName } from "@/lib/format";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchSquadSection({
  matchId,
  roster,
  selectedPlayerIds,
  canEdit = true,
}: {
  matchId: string;
  roster: RosterPlayer[];
  selectedPlayerIds: string[];
  canEdit?: boolean;
}) {
  const selected = new Set(selectedPlayerIds);
  const selectedPlayers = roster.filter((p) => selected.has(p.id));

  if (!canEdit) {
    return selectedPlayers.length === 0 ? (
      <EmptyState
        title="No match-day squad"
        description="Available players for this match have not been selected yet."
      />
    ) : (
      <ul className="divide-border border-border divide-y rounded-xl border">
        {selectedPlayers.map((player) => (
          <li key={player.id} className="px-4 py-3 text-sm font-medium">
            {playerDisplayName(player, { shirtNumber: player.shirt_number })}
          </li>
        ))}
      </ul>
    );
  }

  if (roster.length === 0) {
    return (
      <EmptyState
        title="No squad players"
        description="Add players to the team roster before selecting a match-day squad."
      />
    );
  }

  return <SquadForm matchId={matchId} roster={roster} selected={selected} />;
}

function SquadForm({
  matchId,
  roster,
  selected,
}: {
  matchId: string;
  roster: RosterPlayer[];
  selected: Set<string>;
}) {
  const bound = saveMatchSquadAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const active = roster.filter((p) => p.active);
  const inactive = roster.filter((p) => !p.active);
  const options = [...active, ...inactive];

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select which players are available for this match. Period starters,
        goals, cards, and players of the match use this list when set.
      </p>
      <ul className="border-border divide-border max-h-80 divide-y overflow-y-auto rounded-xl border">
        {options.map((player) => (
          <li key={player.id}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm">
              <input
                type="checkbox"
                name="player_id"
                value={player.id}
                defaultChecked={selected.has(player.id)}
                disabled={pending}
                className="border-input size-4 rounded"
              />
              <span className="font-medium">
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
                {!player.active ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (inactive)
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save match-day squad"}
      </Button>
    </form>
  );
}
