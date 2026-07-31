"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveTeamAction } from "@/lib/team/actions";
import { labelGender } from "@/lib/format";
import type { Team } from "@/lib/supabase/database.types";
import { objectListRowClassName } from "@/components/shared/object-list";

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
      className={objectListRowClassName("w-full text-left disabled:opacity-60")}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{team.name}</p>
        <p className="text-muted-foreground text-sm">
          {labelGender(team.gender)} · {team.age_group} · {team.season_label}
          {pending ? " · Opening…" : ""}
        </p>
      </div>
    </button>
  );
}
