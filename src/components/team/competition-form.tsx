"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  AGE_GROUPS,
  COMPETITION_GENDERS,
  COMPETITION_GENDER_LABELS,
  COMPETITION_KINDS,
  COMPETITION_PERIODS,
  COMPETITION_PERIOD_LABELS,
  COMPETITION_RESULTS,
  COMPETITION_RESULT_LABELS,
  COMPETITION_VENUE_SPECIAL,
  COMPETITION_VENUE_SPECIAL_LABELS,
  DEFAULT_COMPETITION_PERIODS,
  DEFAULT_COMPETITION_RESULT,
} from "@/lib/constants";
import {
  createCompetitionAndReturnAction,
  saveCompetitionAndReturnAction,
} from "@/lib/team/actions";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition, Venue } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { DeleteCompetitionButton } from "@/components/team/delete-competition-button";
import { SeasonInput } from "@/components/team/season-input";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function competitionVenueSelectValue(competition: Competition | null): string {
  if (!competition) return "unknown";
  if (competition.venue_mode === "venue" && competition.venue_id) {
    return competition.venue_id;
  }
  if (
    competition.venue_mode === "multiple" ||
    competition.venue_mode === "unknown"
  ) {
    return competition.venue_mode;
  }
  return "unknown";
}

export function CompetitionForm({
  competition,
  venues,
  mode = "edit",
}: {
  competition: Competition | null;
  venues: Venue[];
  mode?: "create" | "edit";
}) {
  const boundReturn =
    mode === "edit" && competition
      ? saveCompetitionAndReturnAction.bind(null, competition.id)
      : createCompetitionAndReturnAction;
  const [state, formAction, pending] = useActionState(
    boundReturn,
    INITIAL_ACTION_STATE,
  );

  const formId = "competition-details-form";
  const title = mode === "create" ? "New competition" : "Competition details";
  const description =
    mode === "create"
      ? "Enter competition details. Use Save to create and return."
      : "Update competition details. Use Save to save and return.";

  return (
    <>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {mode === "edit" && competition ? (
              <DeleteCompetitionButton
                competitionId={competition.id}
                competitionName={competition.name}
                label="Delete competition"
              />
            ) : null}
            <Button type="submit" form={formId} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        <form id={formId} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">
                Name <span className="text-muted-foreground">(required)</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                aria-required="true"
                defaultValue={competition?.name ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="organizer">Organizer</Label>
              <Input
                id="organizer"
                name="organizer"
                defaultValue={competition?.organizer ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind">Kind</Label>
              <NativeSelect
                id="kind"
                name="kind"
                defaultValue={competition?.kind ?? "league"}
                disabled={pending}
              >
                {COMPETITION_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {labelCompetitionKind(kind)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <NativeSelect
                id="result"
                name="result"
                defaultValue={competition?.result ?? DEFAULT_COMPETITION_RESULT}
                disabled={pending}
              >
                {COMPETITION_RESULTS.map((result) => (
                  <option key={result} value={result}>
                    {COMPETITION_RESULT_LABELS[result]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <SeasonInput
                id="season"
                name="season"
                defaultValue={competition?.season}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knockout">Knock out</Label>
              <NativeSelect
                id="knockout"
                name="knockout"
                defaultValue={competition?.knockout ? "yes" : "no"}
                disabled={pending}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age_group">Age group</Label>
              <NativeSelect
                id="age_group"
                name="age_group"
                defaultValue={competition?.age_group ?? ""}
                disabled={pending}
              >
                <option value="">None</option>
                {AGE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <NativeSelect
                id="gender"
                name="gender"
                defaultValue={competition?.gender ?? ""}
                disabled={pending}
              >
                <option value="">None</option>
                {COMPETITION_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {COMPETITION_GENDER_LABELS[gender]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <NativeSelect
                id="venue"
                name="venue"
                defaultValue={competitionVenueSelectValue(competition)}
                disabled={pending}
              >
                {COMPETITION_VENUE_SPECIAL.map((value) => (
                  <option key={value} value={value}>
                    {COMPETITION_VENUE_SPECIAL_LABELS[value]}
                  </option>
                ))}
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="players_per_team">Players per team</Label>
              <Input
                id="players_per_team"
                name="players_per_team"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                defaultValue={competition?.players_per_team ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periods">Periods per match</Label>
              <NativeSelect
                id="periods"
                name="periods"
                defaultValue={
                  competition?.periods ?? DEFAULT_COMPETITION_PERIODS
                }
                disabled={pending}
              >
                {COMPETITION_PERIODS.map((periods) => (
                  <option key={periods} value={periods}>
                    {COMPETITION_PERIOD_LABELS[periods]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes_per_period">Minutes per period</Label>
              <Input
                id="minutes_per_period"
                name="minutes_per_period"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                defaultValue={competition?.minutes_per_period ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={competition?.notes ?? ""}
                disabled={pending}
              />
            </div>
          </div>

          {state.error ? <ErrorBanner message={state.error} /> : null}
        </form>
      </CardContent>
    </>
  );
}
