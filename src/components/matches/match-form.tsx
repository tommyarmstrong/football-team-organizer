"use client";

import { useEffect, useState } from "react";
import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  COMPETITION_PERIODS,
  COMPETITION_PERIOD_LABELS,
  DEFAULT_MATCH_PERIODS,
  DEFAULT_MATCH_STAGE,
  FRIENDLY_COMPETITION_VALUE,
  MATCH_HOME_AWAYS,
  MATCH_STAGES,
  MATCH_STATUSES,
  matchAllowsEvents,
} from "@/lib/constants";
import {
  createMatchAction,
  createMatchOnPageAction,
  updateMatchAction,
  updateMatchOnPageAction,
} from "@/lib/matches/actions";
import {
  competitionDisplayName,
  labelHomeAway,
  labelMatchStage,
  labelMatchStatus,
  playerDisplayName,
} from "@/lib/format";
import {
  applyTournamentMatchFields,
  competitionHasMatchStage,
  competitionIsTournament,
} from "@/lib/matches/tournament-defaults";
import type {
  Competition,
  CompetitionPeriods,
  Match,
  MatchHomeAway,
  MatchStage,
  MatchStatus,
  Venue,
} from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function MatchForm({
  mode,
  match,
  competitions,
  venues = [],
  players = [],
  matchDaySquadCount,
  canEditPlayerOfTheMatch = true,
  stayOnPage = false,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  match?: Match;
  competitions: Competition[];
  venues?: Venue[];
  players?: RosterPlayer[];
  /** Read-only match-day squad size (edit mode). */
  matchDaySquadCount?: number;
  canEditPlayerOfTheMatch?: boolean;
  stayOnPage?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const action =
    mode === "create"
      ? stayOnPage
        ? createMatchOnPageAction
        : createMatchAction
      : stayOnPage
        ? updateMatchOnPageAction.bind(null, match!.id)
        : updateMatchAction.bind(null, match!.id);

  const [state, formAction, pending] = useToastActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  const [status, setStatus] = useState<MatchStatus>(
    match?.status ?? "scheduled",
  );
  const [competitionId, setCompetitionId] = useState(
    match?.is_friendly
      ? FRIENDLY_COMPETITION_VALUE
      : (match?.competition_id ?? ""),
  );
  const [date, setDate] = useState(match?.date ?? "");
  const [meetupTime, setMeetupTime] = useState(
    match?.meetup_time?.slice(0, 5) ?? "",
  );
  const [homeAway, setHomeAway] = useState<MatchHomeAway>(
    match?.home_away ?? "home",
  );
  const [venueId, setVenueId] = useState(match?.venue_id ?? "");
  const [periods, setPeriods] = useState<CompetitionPeriods>(
    DEFAULT_MATCH_PERIODS,
  );
  const [stage, setStage] = useState<MatchStage>(
    match?.stage ?? DEFAULT_MATCH_STAGE,
  );
  const showEvents = matchAllowsEvents(status);
  const selectedCompetition =
    competitions.find((competition) => competition.id === competitionId) ??
    null;
  const tournament = competitionIsTournament(selectedCompetition?.kind)
    ? selectedCompetition
    : null;
  const showStage = competitionHasMatchStage(selectedCompetition?.kind);

  function handleCompetitionChange(nextId: string) {
    setCompetitionId(nextId);
    const competition =
      nextId && nextId !== FRIENDLY_COMPETITION_VALUE
        ? competitions.find((item) => item.id === nextId)
        : undefined;
    if (!competition || !competitionIsTournament(competition.kind)) {
      setPeriods(competition?.periods ?? DEFAULT_MATCH_PERIODS);
      return;
    }
    const applied = applyTournamentMatchFields(
      {
        date,
        meetup_time: meetupTime || null,
        home_away: homeAway,
        venue_id: venueId || null,
        periods: competition.periods,
      },
      competition,
    );
    setDate(applied.date);
    setMeetupTime(applied.meetup_time?.slice(0, 5) ?? "");
    setHomeAway(applied.home_away);
    setVenueId(applied.venue_id ?? "");
    setPeriods(applied.periods);
  }

  return (
    <form action={formAction} className="w-full min-w-0 space-y-4">
      <div className="grid w-full min-w-0 grid-cols-1 gap-4">
        <div className="min-w-0 space-y-2">
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
        <div className="min-w-0 space-y-2">
          <Label htmlFor="competition_id">
            Competition <OptionalHint />
          </Label>
          <NativeSelect
            id="competition_id"
            name="competition_id"
            value={competitionId}
            onChange={(e) => handleCompetitionChange(e.target.value)}
            disabled={pending}
          >
            <option value="">None</option>
            <option value={FRIENDLY_COMPETITION_VALUE}>Friendly</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {competitionDisplayName(c)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {tournament ? (
          <p className="text-muted-foreground text-sm">
            Date, meet-up, home/away, venue, and periods start from this
            tournament. You can change them for this match.
          </p>
        ) : null}

        {showStage ? (
          <div className="min-w-0 space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <NativeSelect
              id="stage"
              name="stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as MatchStage)}
              disabled={pending}
            >
              {MATCH_STAGES.map((value) => (
                <option key={value} value={value}>
                  {labelMatchStage(value)}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : null}

        <div className="min-w-0 space-y-2 overflow-hidden">
          <Label htmlFor="date">
            Date <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            aria-required="true"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={pending}
          />
        </div>
        <div className="min-w-0 space-y-2 overflow-hidden">
          <Label htmlFor="kickoff_time">
            Kick-off <OptionalHint />
          </Label>
          <Input
            id="kickoff_time"
            name="kickoff_time"
            type="time"
            defaultValue={match?.kickoff_time?.slice(0, 5) ?? ""}
            disabled={pending}
          />
        </div>
        <div className="min-w-0 space-y-2 overflow-hidden">
          <Label htmlFor="meetup_time">
            Meet-up <OptionalHint />
          </Label>
          <Input
            id="meetup_time"
            name="meetup_time"
            type="time"
            value={meetupTime}
            onChange={(event) => setMeetupTime(event.target.value)}
            disabled={pending}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="home_away">Home / away</Label>
          <NativeSelect
            id="home_away"
            name="home_away"
            required
            value={homeAway}
            onChange={(event) =>
              setHomeAway(event.target.value as MatchHomeAway)
            }
            disabled={pending}
          >
            {MATCH_HOME_AWAYS.map((value) => (
              <option key={value} value={value}>
                {labelHomeAway(value)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="venue_id">
            Venue <OptionalHint />
          </Label>
          <NativeSelect
            id="venue_id"
            name="venue_id"
            value={venueId}
            onChange={(event) => setVenueId(event.target.value)}
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

        {mode === "create" ? (
          <div className="min-w-0 space-y-2">
            <Label htmlFor="periods">Periods</Label>
            <NativeSelect
              id="periods"
              name="periods"
              value={periods}
              onChange={(e) => setPeriods(e.target.value as CompetitionPeriods)}
              disabled={pending}
            >
              {COMPETITION_PERIODS.map((value) => (
                <option key={value} value={value}>
                  {COMPETITION_PERIOD_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : null}

        <div className="min-w-0 space-y-2">
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
          <div className="min-w-0 space-y-2">
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

        {mode === "edit" ? (
          showEvents ? (
            <>
              <div className="min-w-0 space-y-2">
                <p className="text-muted-foreground text-sm">
                  Score is taken from goals recorded on the match page
                  (including opposition goals). Goals and cards unlock when
                  status is In progress or Played.
                </p>
              </div>
              {canEditPlayerOfTheMatch ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="player_of_the_match_id">
                      Coach&apos;s player of the match <OptionalHint />
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
                      Player&apos;s player of the match <OptionalHint />
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
              ) : null}
            </>
          ) : null
        ) : showEvents ? (
          <p className="text-muted-foreground text-sm">
            After you create this fixture, you can record goals and cards on the
            match page.
          </p>
        ) : null}

        <div className="min-w-0 space-y-2">
          <Label htmlFor="notes">
            Coach&apos;s notes <OptionalHint />
          </Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={match?.notes ?? ""}
            disabled={pending}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="club_notes">
            Club notes <OptionalHint />
          </Label>
          <Textarea
            id="club_notes"
            name="club_notes"
            defaultValue={match?.club_notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      {mode === "edit" && match ? (
        <FormActions
          pending={pending}
          cancelHref={onCancel ? undefined : `/matches/${match.id}`}
          onCancel={onCancel}
        />
      ) : onCancel ? (
        <FormActions pending={pending} onCancel={onCancel} />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create fixture"}
        </Button>
      )}
    </form>
  );
}
