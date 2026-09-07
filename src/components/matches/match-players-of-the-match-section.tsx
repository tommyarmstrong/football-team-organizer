"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { RosterPlayer } from "@/lib/data/players";
import { playerDisplayName } from "@/lib/format";
import { updateMatchPlayersOfTheMatchAction } from "@/lib/matches/actions";
import { PlayerOfTheMatchChip } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Section } from "@/components/shared/section";

export function playerOfTheMatchChipName(
  players: Pick<RosterPlayer, "id" | "first_name" | "last_name">[],
  playerId: string | null,
): string | null {
  if (!playerId) return null;
  const player = players.find((candidate) => candidate.id === playerId);
  return player ? playerDisplayName(player) : null;
}

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
  const coachName = playerOfTheMatchChipName(players, coachPlayerOfTheMatchId);
  const playersName = playerOfTheMatchChipName(
    players,
    playersPlayerOfTheMatchId,
  );

  if (!canEdit) {
    return (
      <>
        <Section title="Coach's Player of the Match">
          {coachName ? (
            <PlayerOfTheMatchChip name={coachName} />
          ) : (
            <p className="text-muted-foreground text-sm">Not selected</p>
          )}
        </Section>
        <Section title="Players' Player of the Match">
          {playersName ? (
            <PlayerOfTheMatchChip name={playersName} />
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
  const [coachId, setCoachId] = useState(coachPlayerOfTheMatchId);
  const [playersId, setPlayersId] = useState(playersPlayerOfTheMatchId);

  const playerOptions = players.map((player) => ({
    value: player.id,
    label: `${playerDisplayName(player, {
      shirtNumber: player.shirt_number,
    })}${!player.active ? " (inactive)" : ""}`,
  }));

  const coachName = playerOfTheMatchChipName(players, coachId);
  const playersName = playerOfTheMatchChipName(players, playersId);

  return (
    <form action={formAction} className="space-y-8">
      <Section title="Coach's Player of the Match">
        <div className="space-y-2">
          {coachName ? <PlayerOfTheMatchChip name={coachName} /> : null}
          <SearchableSelect
            id="coach-potm-player"
            name="player_of_the_match_id"
            aria-label="Coach's player of the match"
            disabled={pending}
            placeholder="Add player…"
            emptyMessage="No players match that name."
            defaultValue={coachPlayerOfTheMatchId ?? undefined}
            options={playerOptions}
            onValueChange={(value) => setCoachId(value || null)}
          />
        </div>
      </Section>

      <Section title="Players' Player of the Match">
        <div className="space-y-4">
          <div className="space-y-2">
            {playersName ? <PlayerOfTheMatchChip name={playersName} /> : null}
            <SearchableSelect
              id="players-potm-player"
              name="players_player_of_the_match_id"
              aria-label="Players' player of the match"
              disabled={pending}
              placeholder="Add player…"
              emptyMessage="No players match that name."
              defaultValue={playersPlayerOfTheMatchId ?? undefined}
              options={playerOptions}
              onValueChange={(value) => setPlayersId(value || null)}
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
