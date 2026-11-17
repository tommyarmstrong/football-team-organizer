"use client";

import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { RosterPlayer } from "@/lib/data/players";
import { playerDisplayName } from "@/lib/format";
import { updateMatchPlayersOfTheMatchAction } from "@/lib/matches/actions";
import { PlayerOfTheMatchName } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Section } from "@/components/shared/section";

export const COACH_POTM_LABEL = "Coach's Player of the Match";
export const PLAYERS_POTM_LABEL = "Players' Player of the Match";

export function playerOfTheMatchName(
  players: Pick<RosterPlayer, "id" | "first_name" | "last_name">[],
  playerId: string | null,
): string | null {
  if (!playerId) return null;
  const player = players.find((candidate) => candidate.id === playerId);
  return player ? playerDisplayName(player) : null;
}

/** "7 Alex Smith" when the player has a shirt number, otherwise "Alex Smith". */
export function playerOfTheMatchLabel(
  players: Pick<
    RosterPlayer,
    "id" | "first_name" | "last_name" | "shirt_number"
  >[],
  playerId: string | null,
): string | null {
  if (!playerId) return null;
  const player = players.find((candidate) => candidate.id === playerId);
  return player
    ? playerDisplayName(player, { shirtNumber: player.shirt_number })
    : null;
}

/** Option text for the selectors: shirt number, name, and an inactive marker. */
export function playerOfTheMatchOptions(players: RosterPlayer[]) {
  return players.map((player) => ({
    value: player.id,
    label: `${playerDisplayName(player, {
      shirtNumber: player.shirt_number,
    })}${!player.active ? " (inactive)" : ""}`,
  }));
}

function ReadOnlyAward({
  label,
  name,
}: {
  label: string;
  name: string | null;
}) {
  return (
    <div className="flex min-h-11 flex-col justify-center gap-0.5 py-1.5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd>
        {name ? (
          <PlayerOfTheMatchName name={name} />
        ) : (
          <span className="text-muted-foreground text-sm">Not selected</span>
        )}
      </dd>
    </div>
  );
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
  if (!canEdit) {
    return (
      <Section title="Player of the Match" compact>
        <dl className="divide-border divide-y">
          <ReadOnlyAward
            label={COACH_POTM_LABEL}
            name={playerOfTheMatchLabel(players, coachPlayerOfTheMatchId)}
          />
          <ReadOnlyAward
            label={PLAYERS_POTM_LABEL}
            name={playerOfTheMatchLabel(players, playersPlayerOfTheMatchId)}
          />
        </dl>
      </Section>
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
  const [state, formAction, pending] = useToastActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const playerOptions = playerOfTheMatchOptions(players);

  return (
    <form action={formAction}>
      <Section title="Player of the Match" compact>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="coach-potm-player">{COACH_POTM_LABEL}</Label>
            <SearchableSelect
              id="coach-potm-player"
              name="player_of_the_match_id"
              size="touch"
              disabled={pending}
              placeholder="Add player…"
              emptyMessage="No players match that name."
              defaultValue={coachPlayerOfTheMatchId ?? undefined}
              options={playerOptions}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="players-potm-player">{PLAYERS_POTM_LABEL}</Label>
            <SearchableSelect
              id="players-potm-player"
              name="players_player_of_the_match_id"
              size="touch"
              disabled={pending}
              placeholder="Add player…"
              emptyMessage="No players match that name."
              defaultValue={playersPlayerOfTheMatchId ?? undefined}
              options={playerOptions}
            />
          </div>

          <Button type="submit" disabled={pending} className="h-11 sm:h-8">
            {pending ? "Saving…" : "Save"}
          </Button>

          {state.error ? <ErrorBanner message={state.error} /> : null}
        </div>
      </Section>
    </form>
  );
}
