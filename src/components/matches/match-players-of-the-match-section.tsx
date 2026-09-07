"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { RosterPlayer } from "@/lib/data/players";
import { playerDisplayName } from "@/lib/format";
import { updateMatchPlayersOfTheMatchAction } from "@/lib/matches/actions";
import { PlayerOfTheMatchChip } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import { Label, OptionalHint } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Section } from "@/components/shared/section";

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
      <>
        <Section title="Coach's Player of the Match">
          {coachMotm ? (
            <PlayerOfTheMatchChip name={playerDisplayName(coachMotm)} />
          ) : (
            <p className="text-muted-foreground text-sm">Not selected</p>
          )}
        </Section>
        <Section title="Players' Player of the Match">
          {playersMotm ? (
            <PlayerOfTheMatchChip name={playerDisplayName(playersMotm)} />
          ) : (
            <p className="text-muted-foreground text-sm">Not selected</p>
          )}
        </Section>
      </>
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
    <form action={formAction} className="space-y-8">
      <Section title="Coach's Player of the Match">
        <div className="space-y-2">
          <Label htmlFor="coach-potm-player">
            Player <OptionalHint />
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
      </Section>

      <Section title="Players' Player of the Match">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="players-potm-player">
              Player <OptionalHint />
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

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>

          {state.error ? <ErrorBanner message={state.error} /> : null}
          {state.success ? (
            <p className="text-muted-foreground text-sm" role="status">
              {state.success}
            </p>
          ) : null}
        </div>
      </Section>
    </form>
  );
}
