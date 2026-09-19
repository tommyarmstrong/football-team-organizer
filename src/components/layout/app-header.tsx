import { Suspense } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { canAccessClubAndPeople, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getActiveTeam, sortTeamsForDisplay } from "@/lib/data/team";
import { isValidClubColour } from "@/lib/clubs/branding";
import { ClubIcon } from "@/components/clubs/club-icon";
import { AppNav, MobileTabBar } from "@/components/layout/app-nav";
import { ClubColourBinder } from "@/components/layout/club-colour-binder";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { Skeleton } from "@/components/shared/skeleton";

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

// ---------------------------------------------------------------------------
// Per-zone fallback skeletons
// ---------------------------------------------------------------------------

function BrandFallback() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-6 w-40 max-w-full" />
        <Skeleton className="h-4 w-28 max-w-full md:hidden" />
      </div>
    </div>
  );
}

function NavFallback() {
  return <Skeleton className="hidden h-10 w-full md:block" />;
}

function MobileTabBarFallback() {
  return (
    <nav
      aria-hidden
      className="club-themed-footer club-chrome border-header/20 text-header-foreground fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex min-h-14 items-center justify-around px-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="size-8 rounded-md" />
        ))}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Full-header fallback (kept for backward compat / error boundary use)
// ---------------------------------------------------------------------------

export function AppHeaderFallback() {
  return (
    <>
      <header className="club-themed-header club-chrome text-header-foreground border-header/30 sticky top-0 z-30 border-b shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          <BrandFallback />
          <NavFallback />
        </div>
      </header>
      <MobileTabBarFallback />
    </>
  );
}

// ---------------------------------------------------------------------------
// Zone 1 — Brand bar (club name, icon, colour + mobile team switcher)
// §4.2: resolves from getPrimaryClub() alone; fast path once §4.3 is in place.
// ---------------------------------------------------------------------------

async function AppHeaderBrand() {
  const [club, activeTeam, ctx] = await Promise.all([
    getPrimaryClub(),
    getActiveTeam(),
    getViewerContext(),
  ]);

  const colour =
    club?.colour && isValidClubColour(club.colour) ? club.colour : null;
  const brandName = club?.name?.trim() || APP_NAME;
  const teams = ctx ? sortTeamsForDisplay(ctx.visibleTeams) : [];
  const activeTeamId = activeTeam?.id ?? null;

  return (
    <>
      <ClubColourBinder colour={colour} />
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Link
            href="/dashboard"
            className="focus-visible:ring-header-foreground/70 mt-0.5 shrink-0 focus-visible:ring-2 focus-visible:outline-none"
          >
            <ClubIcon
              iconUrl={club?.icon_url}
              alt={club ? `${club.name} icon` : "Club icon"}
              size={36}
              className="ring-header-foreground/20 size-9 shrink-0"
            />
          </Link>
          <div className="flex min-w-0 flex-col">
            <Link
              href="/dashboard"
              className="font-display focus-visible:ring-header-foreground/70 truncate text-xl leading-tight tracking-tight focus-visible:ring-2 focus-visible:outline-none sm:text-2xl"
            >
              {brandName}
            </Link>
            <div className="md:hidden">
              <TeamSwitcher
                teams={teams}
                activeTeamId={activeTeamId}
                align="start"
                triggerClassName="text-header-foreground/75 hover:text-header-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Zone 2 — Navigation bar (desktop nav + user menu)
// §4.2: resolves from getViewerContext() — streams independently of brand bar.
// ---------------------------------------------------------------------------

async function AppHeaderNav() {
  const [ctx, activeTeam] = await Promise.all([
    getViewerContext(),
    getActiveTeam(),
  ]);

  const teams = ctx ? sortTeamsForDisplay(ctx.visibleTeams) : [];
  const showClubAndPeople = Boolean(ctx && canAccessClubAndPeople(ctx));
  const accountName = ctx ? viewerFullName(ctx) : null;
  const accountEmail = ctx?.email ?? null;
  const activeTeamId = activeTeam?.id ?? null;

  return (
    <AppNav
      showClubAndPeople={showClubAndPeople}
      teams={teams}
      activeTeamId={activeTeamId}
      name={accountName}
      email={accountEmail}
      showAccount={Boolean(ctx)}
    />
  );
}

// ---------------------------------------------------------------------------
// Zone 2b — Mobile tab bar (separate Suspense so it streams with nav data)
// ---------------------------------------------------------------------------

async function AppHeaderMobileNav() {
  const ctx = await getViewerContext();

  const showClubAndPeople = Boolean(ctx && canAccessClubAndPeople(ctx));
  const accountName = ctx ? viewerFullName(ctx) : null;
  const accountEmail = ctx?.email ?? null;

  return (
    <MobileTabBar
      showClubAndPeople={showClubAndPeople}
      name={accountName}
      email={accountEmail}
    />
  );
}

// ---------------------------------------------------------------------------
// AppHeader — synchronous component that renders two independent Suspense zones
// §4.2: splits the previous monolithic async server component into independently-
// streaming brand and navigation zones.
// ---------------------------------------------------------------------------

export function AppHeader() {
  return (
    <>
      <header className="club-themed-header club-chrome text-header-foreground border-header/30 sticky top-0 z-30 border-b shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          {/* Zone 1: brand bar — club name, icon, colour, mobile team switcher */}
          <Suspense fallback={<BrandFallback />}>
            <AppHeaderBrand />
          </Suspense>

          {/* Zone 2: desktop navigation bar */}
          <div className="hidden md:block">
            <Suspense fallback={<NavFallback />}>
              <AppHeaderNav />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Mobile tab bar streams with the nav data */}
      <Suspense fallback={<MobileTabBarFallback />}>
        <AppHeaderMobileNav />
      </Suspense>
    </>
  );
}
