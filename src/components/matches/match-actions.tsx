"use client";

import { useState, useTransition } from "react";
import {
  BanIcon,
  CalendarClockIcon,
  CalendarIcon,
  ClockPlusIcon,
  EllipsisIcon,
  FlagIcon,
  RepeatIcon,
} from "lucide-react";
import { matchAllowsEvents } from "@/lib/constants";
import type { ExtraTimeOrPenaltyPeriodName } from "@/lib/constants";
import type { RosterPlayer } from "@/lib/data/players";
import {
  PERIOD_FORMAT_LABELS,
  type PeriodFormat,
} from "@/lib/match-periods/format-change";
import { updateMatchStatusAction } from "@/lib/matches/actions";
import {
  matchActionPlan,
  quickStatusLabel,
} from "@/lib/matches/status-actions";
import type { MatchStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ErrorBanner } from "@/components/shared/error-banner";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import {
  optionsButtonClassName,
  primaryActionButtonClassName,
  primaryActionRowClassName,
} from "@/components/shared/stacked-actions";
import { MatchPeriodCreateSection } from "@/components/matches/match-period-create-section";
import {
  MatchPeriodFormatSection,
  periodFormatChangeLabel,
  periodFormatChangeTarget,
  type PeriodFormatPeriod,
} from "@/components/matches/match-period-format-section";

export type MatchActionsAddPeriod = {
  availablePeriodNames: ExtraTimeOrPenaltyPeriodName[];
  squadPlayers: RosterPlayer[];
  defaultStarterPlayerIds: string[];
};

/** One row of the Options menu. */
export type MatchOptionEntry =
  | { kind: "status"; status: MatchStatus }
  | { kind: "add-period"; enabled: boolean }
  | {
      kind: "change-format";
      enabled: boolean;
      /** Null before kick-off, when there are no periods to convert yet. */
      target: PeriodFormat | null;
    };

/**
 * The Options menu for a match: its other status changes, then Add period and
 * Change to halves/quarters. Periods only exist once a match has kicked off, so
 * before then those two are listed but disabled. A played match has no status
 * changes but keeps the two period actions. Returns [] for cancelled and
 * postponed matches, which have no controls at all.
 */
export function matchOptionEntries({
  status,
  changeFormatTarget,
}: {
  status: MatchStatus;
  changeFormatTarget: PeriodFormat | null;
}): MatchOptionEntry[] {
  const plan = matchActionPlan(status);
  const periodsOpen = matchAllowsEvents(status);
  if (!plan && !periodsOpen) return [];
  const entries: MatchOptionEntry[] = (plan?.menu ?? []).map((next) => ({
    kind: "status",
    status: next,
  }));
  entries.push({ kind: "add-period", enabled: periodsOpen });
  if (!periodsOpen) {
    entries.push({ kind: "change-format", enabled: false, target: null });
  } else if (changeFormatTarget) {
    entries.push({
      kind: "change-format",
      enabled: true,
      target: changeFormatTarget,
    });
  }
  return entries;
}

type StatusConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
};

/** Changes that need confirming; Kick off and Full time apply straight away. */
export const STATUS_CONFIRMATIONS: Partial<
  Record<MatchStatus, StatusConfirmation>
> = {
  cancelled: {
    title: "Cancel this match?",
    description:
      "This marks the fixture as cancelled. You can still view it later from the matches list.",
    confirmLabel: "Cancel match",
    pendingLabel: "Cancelling…",
    cancelLabel: "Keep match",
  },
  postponed: {
    title: "Postpone this match?",
    description:
      "This marks the fixture as postponed. You can still view it later from the matches list.",
    confirmLabel: "Postpone match",
    pendingLabel: "Postponing…",
    cancelLabel: "Keep match",
  },
  scheduled: {
    title: "Move back to scheduled?",
    description:
      "The match goes back to scheduled. Goals and cards you recorded are kept but hidden until it kicks off again, and Player of the Match choices are cleared.",
    confirmLabel: "Move to scheduled",
    pendingLabel: "Updating…",
    cancelLabel: "Keep in progress",
  },
};

const STATUS_ICONS: Partial<Record<MatchStatus, typeof FlagIcon>> = {
  played: FlagIcon,
  scheduled: CalendarIcon,
  cancelled: BanIcon,
  postponed: CalendarClockIcon,
};

type PeriodDialog = "add-period" | "change-format";
type PeriodEntry = Exclude<MatchOptionEntry, { kind: "status" }>;

function periodEntryLabel(entry: PeriodEntry): string {
  if (entry.kind === "add-period") return "Add period";
  return entry.target
    ? periodFormatChangeLabel(entry.target)
    : "Change to halves/quarters";
}

export const matchOptionItemClassName =
  "hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

/**
 * Controls under the match card: one primary status button (Kick off or Full
 * time) and an Options menu with the other status changes and the period
 * actions, in the same primary + Options layout as under Goals. A played
 * match has no status changes, so its two period actions are shown as buttons
 * rather than behind Options.
 *
 * Dialogs live here, outside the popover, so they survive it closing.
 */
export function MatchActions({
  matchId,
  status,
  addPeriod,
  changeFormat,
}: {
  matchId: string;
  status: MatchStatus;
  addPeriod: MatchActionsAddPeriod;
  changeFormat: { periods: PeriodFormatPeriod[] };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [periodDialog, setPeriodDialog] = useState<PeriodDialog | null>(null);
  const [confirming, setConfirming] = useState<MatchStatus | null>(null);

  const plan = matchActionPlan(status);
  const changeFormatTarget = periodFormatChangeTarget(changeFormat.periods);
  const entries = matchOptionEntries({ status, changeFormatTarget });
  if (entries.length === 0) return null;

  function setStatus(next: MatchStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateMatchStatusAction(matchId, next);
      if (result.error) setError(result.error);
    });
  }

  /** Confirmable changes ask first; the rest apply straight away. */
  function requestStatus(next: MatchStatus) {
    if (STATUS_CONFIRMATIONS[next]) setConfirming(next);
    else setStatus(next);
  }

  function chooseStatus(next: MatchStatus) {
    setMenuOpen(false);
    requestStatus(next);
  }

  function choosePeriodDialog(dialog: PeriodDialog) {
    setMenuOpen(false);
    setPeriodDialog(dialog);
  }

  const confirmation = confirming ? STATUS_CONFIRMATIONS[confirming] : null;
  const dialogOpen = periodDialog !== null || confirming !== null;

  return (
    <div className="space-y-2">
      <div className={primaryActionRowClassName()}>
        {plan ? (
          <Button
            type="button"
            className={primaryActionButtonClassName()}
            disabled={pending}
            onClick={() => requestStatus(plan.primary)}
          >
            {quickStatusLabel(plan.primary)}
          </Button>
        ) : null}

        {plan ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={optionsButtonClassName()}
                  disabled={pending}
                />
              }
            >
              <EllipsisIcon aria-hidden="true" />
              Options
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              // A menu item opens a dialog; the dialog owns focus from there.
              finalFocus={!dialogOpen}
              className="w-64 max-w-[calc(100vw-2rem)] gap-0.5 p-1.5"
            >
              {entries.map((entry) => {
                if (entry.kind === "status") {
                  const Icon = STATUS_ICONS[entry.status] ?? FlagIcon;
                  return (
                    <button
                      key={entry.status}
                      type="button"
                      className={matchOptionItemClassName}
                      onClick={() => chooseStatus(entry.status)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {quickStatusLabel(entry.status)}
                    </button>
                  );
                }
                const Icon =
                  entry.kind === "add-period" ? ClockPlusIcon : RepeatIcon;
                const label = periodEntryLabel(entry);
                return (
                  <button
                    key={entry.kind}
                    type="button"
                    className={matchOptionItemClassName}
                    disabled={!entry.enabled}
                    onClick={() =>
                      choosePeriodDialog(
                        entry.kind === "add-period"
                          ? "add-period"
                          : "change-format",
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      {label}
                      {entry.enabled ? null : (
                        <span className="text-muted-foreground block text-xs font-normal">
                          After kick off
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        ) : (
          entries.map((entry) =>
            entry.kind === "status" ? null : (
              <Button
                key={entry.kind}
                type="button"
                variant="outline"
                className={primaryActionButtonClassName()}
                disabled={!entry.enabled}
                onClick={() =>
                  choosePeriodDialog(
                    entry.kind === "add-period"
                      ? "add-period"
                      : "change-format",
                  )
                }
              >
                {periodEntryLabel(entry)}
              </Button>
            ),
          )
        )}
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Dialog
        open={confirming !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen && pending) return;
          if (!nextOpen) setConfirming(null);
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              {confirmation?.cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirming === "scheduled" ? "default" : "destructive"}
              disabled={pending}
              onClick={() => {
                if (!confirming) return;
                const next = confirming;
                setConfirming(null);
                setStatus(next);
              }}
            >
              {pending
                ? confirmation?.pendingLabel
                : confirmation?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InlineFormDialog
        open={periodDialog === "add-period"}
        onOpenChange={(next) => setPeriodDialog(next ? "add-period" : null)}
        title="Add extra time or penalties"
        description="Choose the period and who starts it. Save keeps you on this match."
      >
        {(close) => (
          <MatchPeriodCreateSection
            matchId={matchId}
            availablePeriodNames={addPeriod.availablePeriodNames}
            squadPlayers={addPeriod.squadPlayers}
            defaultStarterPlayerIds={addPeriod.defaultStarterPlayerIds}
            stayOnPage
            onSuccess={close}
            onCancel={close}
          />
        )}
      </InlineFormDialog>

      {changeFormatTarget ? (
        <InlineFormDialog
          open={periodDialog === "change-format"}
          onOpenChange={(next) =>
            setPeriodDialog(next ? "change-format" : null)
          }
          title="Change period format"
          description={`Switch this match to ${PERIOD_FORMAT_LABELS[changeFormatTarget]}. Goals and starting players are kept.`}
        >
          {(close) => (
            <MatchPeriodFormatSection
              matchId={matchId}
              periods={changeFormat.periods}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </InlineFormDialog>
      ) : null}
    </div>
  );
}
