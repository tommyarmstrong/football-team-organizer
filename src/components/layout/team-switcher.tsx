"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { setActiveTeamAction } from "@/lib/team/actions";
import { isTeamArchived } from "@/lib/team/season";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Team } from "@/lib/supabase/database.types";

type TeamOption = Pick<Team, "id" | "name" | "season_label" | "archived_at">;

function teamSwitcherLabel(team: TeamOption): string {
  const base = `${team.name} · ${team.season_label}`;
  return isTeamArchived(team) ? `${base} (archived)` : base;
}

export function TeamPickerList({
  teams,
  activeTeamId,
  onSelected,
  className,
}: {
  teams: TeamOption[];
  activeTeamId: string | null;
  onSelected?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (teams.length < 2) return null;

  function selectTeam(teamId: string) {
    if (teamId === activeTeamId || pending) return;
    startTransition(async () => {
      await setActiveTeamAction(teamId);
      router.refresh();
    });
    onSelected?.();
  }

  return (
    <div
      role="listbox"
      aria-label="Active team"
      aria-disabled={pending || undefined}
      className={cn("flex flex-col gap-0.5", className)}
    >
      {teams.map((team) => {
        const active = team.id === activeTeamId;
        const archived = isTeamArchived(team);
        return (
          <button
            key={team.id}
            type="button"
            role="option"
            aria-selected={active}
            disabled={pending}
            onClick={() => selectTeam(team.id)}
            className={cn(
              "focus-visible:ring-ring inline-flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="block truncate">{team.name}</span>
              <span
                className={cn(
                  "block truncate text-xs font-normal",
                  archived ? "text-muted-foreground" : "text-muted-foreground",
                )}
              >
                {team.season_label}
                {archived ? " · archived" : ""}
              </span>
            </span>
            {active ? (
              <CheckIcon className="text-foreground size-4 shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Active team name control that opens the team picker. Only renders when the user can switch teams. */
export function TeamSwitcher({
  teams,
  activeTeamId,
  align = "end",
  triggerClassName,
}: {
  teams: TeamOption[];
  activeTeamId: string | null;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
}) {
  if (teams.length < 2) return null;

  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? null;
  const activeName = activeTeam
    ? teamSwitcherLabel(activeTeam)
    : "Team";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Active team: ${activeName}. Switch team`}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex max-w-full min-w-0 items-center gap-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              triggerClassName,
            )}
          />
        }
      >
        <span className="truncate">{activeName}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-64 max-w-[calc(100vw-2rem)] p-1.5"
      >
        <PopoverHeader className="px-2.5 pt-1.5 pb-1">
          <PopoverTitle className="text-muted-foreground text-xs font-medium">
            Switch team
          </PopoverTitle>
        </PopoverHeader>
        <TeamPickerList teams={teams} activeTeamId={activeTeamId} />
      </PopoverContent>
    </Popover>
  );
}
