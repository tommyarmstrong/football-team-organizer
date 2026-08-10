"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  MATCH_HOME_AWAYS,
  MATCH_STATUSES,
  matchAllowsEvents,
} from "@/lib/constants";
import { createMatchAction, updateMatchAction } from "@/lib/matches/actions";
import {
  labelHomeAway,
  labelMatchStatus,
  playerDisplayName,
} from "@/lib/format";
import type {
  Competition,
  Match,
  MatchStatus,
  Venue,
} from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchForm({
  mode,
  match,
  competitions,
  venues = [],
  players = [],
  matchDaySquadCount,
}: {
  mode: "create" | "edit";
  match?: Match;
  competitions: Competition[];
  venues?: Venue[];
  players?: RosterPlayer[];
  /** Read-only match-day squad size (edit mode). */
  matchDaySquadCount?: number;
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
  const showEvents = matchAllowsEvents(status);

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
          <Label htmlFor="home_away">Home / away</Label>
          <NativeSelect
            id="home_away"
            name="home_away"
            required
            defaultValue={match?.home_away ?? "home"}
            disabled={pending}
          >
            {MATCH_HOME_AWAYS.map((value) => (
              <option key={value} value={value}>
                {labelHomeAway(value)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue_id">Venue</Label>
          <NativeSelect
            id="venue_id"
            name="venue_id"
            defaultValue={match?.venue_id ?? ""}
            disabled={pending}
          >
            <option value="">Unknown</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
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
          <div className="space-y-2">
            <Label htmlFor="match_day_squad_count">Match-day squad</Label>
            <Input
              id="match_day_squad_count"
              readOnly
              value={
                matchDaySquadCount == null ? "—" : String(matchDaySquadCount)
              }
              disabled
            />
          </div>
        ) : null}

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

        {mode === "edit" ? (
          showEvents ? (
            <>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-muted-foreground text-sm">
                  Score is taken from goals recorded on the match page
                  (including opposition goals). Goals and cards unlock when
                  status is In progress or Played.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_of_the_match_id">
                  Coach&apos;s player of the match
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
              <div className="space-y-2">
                <Label htmlFor="players_player_of_the_match_id">
                  Player&apos;s player of the match
                </Label>
                <NativeSelect
                  id="players_player_of_the_match_id"
                  name="players_player_of_the_match_id"
                  defaultValue={match?.players_player_of_the_match_id ?? ""}
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
              Goals, cards, and players of the match unlock when status is In
              progress or Played. Changing away from those statuses clears
              player of the match selections (goals and cards already recorded
              are kept).
            </p>
          )
        ) : showEvents ? (
          <p className="text-muted-foreground text-sm sm:col-span-2">
            After you create this fixture, you can record goals, cards, periods,
            and players of the match on the match page.
          </p>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Coach&apos;s notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={match?.notes ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="club_notes">Club notes</Label>
          <Textarea
            id="club_notes"
            name="club_notes"
            defaultValue={match?.club_notes ?? ""}
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
