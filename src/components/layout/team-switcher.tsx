"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveTeamAction } from "@/lib/team/actions";
import { NativeSelect } from "@/components/ui/native-select";
import type { Team } from "@/lib/supabase/database.types";

export function TeamSwitcher({
  teams,
  activeTeamId,
}: {
  teams: Pick<Team, "id" | "name">[];
  activeTeamId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (teams.length === 0) return null;

  if (teams.length === 1) {
    return (
      <span className="text-muted-foreground text-xs sm:text-sm">
        {teams[0].name}
      </span>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground sr-only sm:not-sr-only">Team</span>
      <NativeSelect
        aria-label="Active team"
        value={activeTeamId ?? ""}
        disabled={pending}
        onChange={(event) => {
          const teamId = event.target.value;
          startTransition(async () => {
            await setActiveTeamAction(teamId);
            router.refresh();
          });
        }}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
