"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { MATCH_STATUSES, MATCH_VENUES } from "@/lib/constants";
import { createMatchAction, updateMatchAction } from "@/lib/matches/actions";
import { labelMatchStatus, labelVenue, playerDisplayName } from "@/lib/format";
import type {
  Competition,
  Match,
  MatchStatus,
} from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { useState } from "react";

export function MatchForm({
  mode,
  match,
  competitions,
  players = [],
}: {
  mode: "create" | "edit";
  match?: Match;
  competitions: Competition[];
  players?: RosterPlayer[];
}) {
  const action =
    mode === "create"
      ? createMatchAction
      : updateMatchAction.bind(null, match!.id);

  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  const [status, setStatus] = useState<MatchStatus>(
    match?.status ?? "scheduled",
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="opponent_name">
            Opponent <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="opponent_name"
            name="opponent_name"
            required
            aria-required="true"
            defaultValue={match?.opponent_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">
            Date <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            aria-required="true"
            defaultValue={match?.date}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kickoff_time">Kick-off (optional)</Label>
          <Input
            id="kickoff_time"
            name="kickoff_time"
            type="time"
            defaultValue={match?.kickoff_time?.slice(0, 5) ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <NativeSelect
            id="venue"
            name="venue"
            required
            defaultValue={match?.venue ?? "home"}
            disabled={pending}
          >
            {MATCH_VENUES.map((venue) => (
              <option key={venue} value={venue}>
                {labelVenue(venue)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="competition_id">Competition</Label>
          <NativeSelect
            id="competition_id"
            name="competition_id"
            defaultValue={match?.competition_id ?? ""}
            disabled={pending}
          >
            <option value="">None</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        {mode === "edit" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <NativeSelect
                id="status"
                name="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                disabled={pending}
              >
                {MATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelMatchStatus(s)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {status === "played" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="goals_for">Goals for</Label>
                  <Input
                    id="goals_for"
                    name="goals_for"
                    type="number"
                    min={0}
                    required
                    defaultValue={match?.goals_for ?? 0}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals_against">Goals against</Label>
                  <Input
                    id="goals_against"
                    name="goals_against"
                    type="number"
                    min={0}
                    required
                    defaultValue={match?.goals_against ?? 0}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="player_of_the_match_id">
                    Player of the match
                  </Label>
                  <NativeSelect
                    id="player_of_the_match_id"
                    name="player_of_the_match_id"
                    defaultValue={match?.player_of_the_match_id ?? ""}
                    disabled={pending}
                  >
                    <option value="">None</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {playerDisplayName(player, {
                          shirtNumber: player.shirt_number,
                        })}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm sm:col-span-2">
                Score is only required when status is Played. Changing away from
                Played clears the stored score (goals recorded below are kept).
              </p>
            )}
          </>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={match?.notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {mode === "edit" && state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create fixture"
            : "Save match"}
      </Button>
    </form>
  );
}
