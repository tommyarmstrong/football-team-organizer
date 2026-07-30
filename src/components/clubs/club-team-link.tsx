"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveTeamAction } from "@/lib/team/actions";
import { labelGender } from "@/lib/format";
import type { Team } from "@/lib/supabase/database.types";

export function ClubTeamLink({ team }: { team: Team }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setActiveTeamAction(team.id);
          router.push("/team");
        });
      }}
      className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
    >
      <div>
        <p className="font-medium">{team.name}</p>
        <p className="text-muted-foreground text-sm">
          {labelGender(team.gender)} · {team.age_group} · {team.season_label}
        </p>
      </div>
      <span className="text-muted-foreground text-xs">
        {pending ? "Opening…" : "Edit"}
      </span>
    </button>
  );
}
