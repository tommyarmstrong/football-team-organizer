import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getActiveTeam, listVisibleTeams } from "@/lib/data/team";
import { ClubIcon } from "@/components/clubs/club-icon";
import { AppNav, MobileNavMenu } from "@/components/layout/app-nav";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { UserMenu } from "@/components/layout/user-menu";

function viewerFullName(ctx: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
}) {
  if (ctx.firstName && ctx.lastName) {
    return `${ctx.firstName} ${ctx.lastName}`;
  }
  return ctx.firstName || ctx.lastName || ctx.displayName;
}

export async function AppHeader() {
  const ctx = await getViewerContext();
  const [{ data: teams }, activeTeam, club] = await Promise.all([
    listVisibleTeams(),
    getActiveTeam(),
    getPrimaryClub(),
  ]);

  const showManagement = Boolean(ctx?.isManagement);
  const accountName = ctx ? viewerFullName(ctx) : null;
  const accountEmail = ctx?.email ?? null;
  const activeTeamId = activeTeam?.id ?? null;

  const brandName = club?.name?.trim() || APP_NAME;

  return (
    <header className="border-border club-themed-header bg-background/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <Link
              href="/dashboard"
              className="focus-visible:ring-ring mt-0.5 shrink-0 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ClubIcon
                iconUrl={club?.icon_url}
                alt={club ? `${club.name} icon` : "Club icon"}
                size={32}
                className="size-8 shrink-0"
              />
            </Link>
            <div className="flex min-w-0 flex-col">
              <Link
                href="/dashboard"
                className="focus-visible:ring-ring truncate text-base font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none sm:text-lg"
              >
                {brandName}
              </Link>
              <div className="md:hidden">
                <TeamSwitcher
                  teams={teams}
                  activeTeamId={activeTeamId}
                  align="start"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <MobileNavMenu
                showManagement={showManagement}
                name={accountName}
                email={accountEmail}
              />
            </div>
            <div className="hidden items-center gap-2 md:flex">
              {ctx ? (
                <UserMenu name={accountName} email={accountEmail} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <AppNav
            showManagement={showManagement}
            teams={teams}
            activeTeamId={activeTeamId}
          />
        </div>
      </div>
    </header>
  );
}
