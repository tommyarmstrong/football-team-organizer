import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getViewerContext, viewerRoleLabel } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getActiveTeam, listVisibleTeams } from "@/lib/data/team";
import { ClubIcon } from "@/components/clubs/club-icon";
import { AppNav, MobileNavMenu } from "@/components/layout/app-nav";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { UserMenu } from "@/components/layout/user-menu";

export async function AppHeader() {
  const ctx = await getViewerContext();
  const [{ data: teams }, activeTeam, club] = await Promise.all([
    listVisibleTeams(),
    getActiveTeam(),
    getPrimaryClub(),
  ]);

  const showStaff = Boolean(
    ctx?.isManagement || (ctx && ctx.coachTeamIds.length > 0),
  );
  const showManagement = Boolean(ctx?.isManagement);

  const brandName = club?.name?.trim() || APP_NAME;

  return (
    <header className="border-border club-themed-header bg-background/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="focus-visible:ring-ring flex min-w-0 items-center gap-2.5 text-base font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none sm:text-lg"
          >
            <ClubIcon
              iconUrl={club?.icon_url}
              alt={club ? `${club.name} icon` : "Club icon"}
              size={32}
              className="size-8 shrink-0"
            />
            <span className="truncate">{brandName}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
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

        <div className="flex items-center justify-between gap-3">
          <div className="hidden min-w-0 flex-1 md:block">
            <AppNav showStaff={showStaff} showManagement={showManagement} />
          </div>

          <div className="flex shrink-0 items-center justify-end md:ml-auto">
            <TeamSwitcher teams={teams} activeTeamId={activeTeam?.id ?? null} />
          </div>
        </div>
      </div>
    </header>
  );
}
