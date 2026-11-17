"use client";

import Link from "next/link";
import { TrophyIcon } from "lucide-react";
import { competitionDisplayName } from "@/lib/format";
import type { Competition, Venue } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import {
  competitionListToday,
  listedCompetitionResult,
} from "@/components/team/competition-list-badge";
import { CompetitionForm } from "@/components/team/competition-form";
import { CompetitionResultChip } from "@/components/team/competition-result-chip";
import { Button } from "@/components/ui/button";

export function CompetitionsSection({
  competitions,
  venues = [],
  canEdit = true,
  showAddForm = true,
  compact = false,
  today = competitionListToday(),
}: {
  competitions: Competition[];
  venues?: Venue[];
  canEdit?: boolean;
  showAddForm?: boolean;
  /** Slightly shorter rows, used on the dashboard. */
  compact?: boolean;
  /** Calendar day (YYYY-MM-DD) for the Upcoming badge. */
  today?: string;
}) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <EmptyState
          title="No competitions yet"
          description={
            canEdit
              ? "Add a league, cup, or tournament your team enters this season."
              : "Competitions this team enters will appear here."
          }
        />
      ) : (
        <ul className={objectListClassName}>
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Link
                href={`/competitions/${competition.id}`}
                className={objectListRowClassName(
                  compact ? "min-h-9 py-1.5" : undefined,
                )}
              >
                <span
                  className={
                    compact
                      ? "bg-draw/20 text-draw inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                      : "bg-draw/20 text-draw inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                  }
                >
                  <TrophyIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {competitionDisplayName(competition)}
                </span>
                <CompetitionResultChip
                  result={listedCompetitionResult(competition, today)}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canEdit && showAddForm ? (
        <InlineFormDialog
          size="lg"
          title="Add competition"
          description="Enter competition details. Save keeps you on this page."
          trigger={(open) => (
            <Button type="button" onClick={open}>
              Add
            </Button>
          )}
        >
          {(close) => (
            <CompetitionForm
              competition={null}
              venues={venues}
              mode="create"
              stayOnPage
              onSuccess={close}
              onCancel={close}
            />
          )}
        </InlineFormDialog>
      ) : null}
    </div>
  );
}
