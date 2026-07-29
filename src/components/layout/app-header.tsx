import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { getViewerContext, viewerRoleLabel } from "@/lib/authz/context";
import { getActiveTeam, listVisibleTeams } from "@/lib/data/team";
import { AppNav } from "@/components/layout/app-nav";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const ctx = await getViewerContext();
  const [{ data: teams }, activeTeam] = await Promise.all([
    listVisibleTeams(),
    getActiveTeam(),
  ]);

  const showStaff = Boolean(
    ctx?.isManagement || (ctx && ctx.coachTeamIds.length > 0),
  );
  const showManagement = Boolean(ctx?.isManagement);

  return (
    <header className="border-border bg-background/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/dashboard"
            className="focus-visible:ring-ring rounded-sm text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            {APP_NAME}
          </Link>
          <AppNav showStaff={showStaff} showManagement={showManagement} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TeamSwitcher teams={teams} activeTeamId={activeTeam?.id ?? null} />
          {ctx ? (
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {viewerRoleLabel(ctx)}
            </span>
          ) : null}
          {ctx?.email ? (
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              {ctx.email}
            </span>
          ) : null}
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
