import Link from "next/link";
import { labelCompetitionKind } from "@/lib/format";
import type { Competition } from "@/lib/supabase/database.types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { AddCompetitionForm } from "@/components/team/add-competition-form";
import { DeleteCompetitionButton } from "@/components/team/delete-competition-button";

export function CompetitionsSection({
  competitions,
  canEdit = true,
}: {
  competitions: Competition[];
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-6">
      {competitions.length === 0 ? (
        <EmptyState
          title="No competitions yet"
          description={
            canEdit
              ? "Add a league, cup, or friendly series your team enters this season."
              : "Competitions this team enters will appear here."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {competitions.map((competition) => (
            <li
              key={competition.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="truncate font-medium">{competition.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {labelCompetitionKind(competition.kind)}
                </span>
              </div>
              {canEdit ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/competitions/${competition.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Edit
                  </Link>
                  <DeleteCompetitionButton
                    competitionId={competition.id}
                    competitionName={competition.name}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? <AddCompetitionForm /> : null}
    </div>
  );
}
