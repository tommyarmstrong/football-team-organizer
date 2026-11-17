"use client";

import Link from "next/link";
import { useState } from "react";
import { ClockPlusIcon, EllipsisIcon, RepeatIcon } from "lucide-react";
import type { ExtraTimeOrPenaltyPeriodName } from "@/lib/constants";
import type { RosterPlayer } from "@/lib/data/players";
import {
  PERIOD_FORMAT_LABELS,
  type PeriodFormat,
} from "@/lib/match-periods/format-change";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { MatchPeriodCreateSection } from "@/components/matches/match-period-create-section";
import {
  MatchPeriodFormatSection,
  periodFormatChangeLabel,
  type PeriodFormatPeriod,
} from "@/components/matches/match-period-format-section";

export type MatchPeriodOptionsAddPeriod = {
  availablePeriodNames: ExtraTimeOrPenaltyPeriodName[];
  squadPlayers: RosterPlayer[];
  defaultStarterPlayerIds: string[];
};

export type MatchPeriodOptionsItem = "add-period" | "change-format";

/** Which period-configuration actions the Options menu offers, in order. */
export function matchPeriodOptionsItems({
  showAddPeriod,
  changeFormatTarget,
}: {
  showAddPeriod: boolean;
  changeFormatTarget: PeriodFormat | null;
}): MatchPeriodOptionsItem[] {
  const items: MatchPeriodOptionsItem[] = [];
  if (showAddPeriod) items.push("add-period");
  if (changeFormatTarget) items.push("change-format");
  return items;
}

export const matchPeriodOptionItemClassName =
  "hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none";

/**
 * Secondary "Options" control for the match goals actions. Add goal stays the
 * only prominent button; the rarely used period-configuration actions live
 * here. The dialogs are owned by this component (not the popover content) so
 * they survive the popover closing.
 */
export function MatchPeriodOptionsMenu({
  matchId,
  addPeriod,
  changeFormat,
  changeFormatTarget,
  showAddPeriod,
}: {
  matchId: string;
  addPeriod: MatchPeriodOptionsAddPeriod | null;
  changeFormat: { periods: PeriodFormatPeriod[] } | null;
  changeFormatTarget: PeriodFormat | null;
  showAddPeriod: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<MatchPeriodOptionsItem | null>(null);
  const items = matchPeriodOptionsItems({ showAddPeriod, changeFormatTarget });

  if (items.length === 0) return null;

  function openDialog(item: MatchPeriodOptionsItem) {
    setMenuOpen(false);
    setDialog(item);
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-11 px-3 sm:h-8 sm:px-2.5"
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
          finalFocus={dialog === null}
          className="w-64 max-w-[calc(100vw-2rem)] gap-0.5 p-1.5"
        >
          {showAddPeriod && addPeriod ? (
            <button
              type="button"
              className={matchPeriodOptionItemClassName}
              onClick={() => openDialog("add-period")}
            >
              <ClockPlusIcon className="size-4 shrink-0" aria-hidden="true" />
              Add period
            </button>
          ) : showAddPeriod ? (
            <Link
              href={`/matches/${matchId}/periods/new`}
              className={matchPeriodOptionItemClassName}
            >
              <ClockPlusIcon className="size-4 shrink-0" aria-hidden="true" />
              Add period
            </Link>
          ) : null}
          {changeFormatTarget && changeFormat ? (
            <button
              type="button"
              className={matchPeriodOptionItemClassName}
              onClick={() => openDialog("change-format")}
            >
              <RepeatIcon className="size-4 shrink-0" aria-hidden="true" />
              {periodFormatChangeLabel(changeFormatTarget)}
            </button>
          ) : null}
        </PopoverContent>
      </Popover>

      {addPeriod ? (
        <InlineFormDialog
          open={dialog === "add-period"}
          onOpenChange={(next) => setDialog(next ? "add-period" : null)}
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
      ) : null}

      {changeFormat && changeFormatTarget ? (
        <InlineFormDialog
          open={dialog === "change-format"}
          onOpenChange={(next) => setDialog(next ? "change-format" : null)}
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
    </>
  );
}
