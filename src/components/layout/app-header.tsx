import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getViewerContext, viewerRoleLabel } from "@/lib/authz/context";
import { getActiveTeam, listVisibleTeams } from "@/lib/data/team";
import { AppNav, MobileNavMenu } from "@/components/layout/app-nav";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { UserMenu } from "@/components/layout/user-menu";

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
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/dashboard"
            className="focus-visible:ring-ring rounded-sm text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            {APP_NAME}
          </Link>
          <div className="hidden md:block">
            <AppNav showStaff={showStaff} showManagement={showManagement} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <TeamSwitcher teams={teams} activeTeamId={activeTeam?.id ?? null} />
          <div className="md:hidden">
            <MobileNavMenu
              showStaff={showStaff}
              showManagement={showManagement}
            />
          </div>
          {ctx ? (
            <UserMenu
              name={ctx.displayName}
              email={ctx.email}
              roleLabel={viewerRoleLabel(ctx)}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
