"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { RosterPlayer } from "@/lib/data/players";
import { playerDisplayName } from "@/lib/format";
import { updateMatchPlayersOfTheMatchAction } from "@/lib/matches/actions";
import { Button } from "@/components/ui/button";
import { Label, OptionalHint } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function MatchPlayersOfTheMatchSection({
  matchId,
  players,
  coachPlayerOfTheMatchId,
  playersPlayerOfTheMatchId,
  canEdit = true,
}: {
  matchId: string;
  players: RosterPlayer[];
  coachPlayerOfTheMatchId: string | null;
  playersPlayerOfTheMatchId: string | null;
  canEdit?: boolean;
}) {
  const coachMotm = coachPlayerOfTheMatchId
    ? players.find((player) => player.id === coachPlayerOfTheMatchId)
    : null;
  const playersMotm = playersPlayerOfTheMatchId
    ? players.find((player) => player.id === playersPlayerOfTheMatchId)
    : null;

  if (!canEdit) {
    return (
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">
            Coach&apos;s player of the match
          </dt>
          <dd className="font-medium">
            {coachMotm
              ? playerDisplayName(coachMotm, {
                  shirtNumber: coachMotm.shirt_number,
                })
              : "Not selected"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">
            Player&apos;s player of the match
          </dt>
          <dd className="font-medium">
            {playersMotm
              ? playerDisplayName(playersMotm, {
                  shirtNumber: playersMotm.shirt_number,
                })
              : "Not selected"}
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <PlayersOfTheMatchForm
      key={`${coachPlayerOfTheMatchId ?? ""}:${playersPlayerOfTheMatchId ?? ""}`}
      matchId={matchId}
      players={players}
      coachPlayerOfTheMatchId={coachPlayerOfTheMatchId}
      playersPlayerOfTheMatchId={playersPlayerOfTheMatchId}
    />
  );
}

function PlayersOfTheMatchForm({
  matchId,
  players,
  coachPlayerOfTheMatchId,
  playersPlayerOfTheMatchId,
}: {
  matchId: string;
  players: RosterPlayer[];
  coachPlayerOfTheMatchId: string | null;
  playersPlayerOfTheMatchId: string | null;
}) {
  const bound = updateMatchPlayersOfTheMatchAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const playerOptions = players.map((player) => ({
    value: player.id,
    label: `${playerDisplayName(player, {
      shirtNumber: player.shirt_number,
    })}${!player.active ? " (inactive)" : ""}`,
  }));

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coach-potm-player">
            Coach&apos;s player of the match <OptionalHint />
          </Label>
          <SearchableSelect
            id="coach-potm-player"
            name="player_of_the_match_id"
            disabled={pending}
            placeholder="Add player…"
            emptyMessage="No players match that name."
            defaultValue={coachPlayerOfTheMatchId ?? undefined}
            options={playerOptions}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="players-potm-player">
            Player&apos;s player of the match <OptionalHint />
          </Label>
          <SearchableSelect
            id="players-potm-player"
            name="players_player_of_the_match_id"
            disabled={pending}
            placeholder="Add player…"
            emptyMessage="No players match that name."
            defaultValue={playersPlayerOfTheMatchId ?? undefined}
            options={playerOptions}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
