"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2Icon,
  ChartColumnIcon,
  EllipsisIcon,
  GoalIcon,
  HouseIcon,
  MapPinIcon,
  ShirtIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AccountDetails,
  SignOutLink,
  UserMenu,
} from "@/components/layout/user-menu";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import type { Team } from "@/lib/supabase/database.types";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
};

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: HouseIcon,
  },
  { href: "/team", label: "Team", icon: ShirtIcon },
  { href: "/matches", label: "Matches", icon: GoalIcon },
  { href: "/stats", label: "Stats", icon: ChartColumnIcon },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { href: "/venues", label: "Venues", icon: MapPinIcon },
];

export const CLUB_NAV_ITEMS: NavItem[] = [
  { href: "/club", label: "Club", icon: Building2Icon },
  { href: "/people", label: "People", icon: UsersIcon },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getMoreNavItems(showClubAndPeople: boolean) {
  return [...MORE_NAV_ITEMS, ...(showClubAndPeople ? CLUB_NAV_ITEMS : [])];
}

export function getDesktopNavItems(showClubAndPeople: boolean) {
  return [
    ...PRIMARY_NAV_ITEMS,
    ...MORE_NAV_ITEMS,
    ...(showClubAndPeople ? CLUB_NAV_ITEMS : []),
  ];
}

function isMoreSectionActive(pathname: string, showClubAndPeople: boolean) {
  return getMoreNavItems(showClubAndPeople).some((item) =>
    isActivePath(pathname, item.href),
  );
}

export function desktopNavItemClassName(active = false) {
  return cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
    active
      ? "bg-header-foreground/15 text-header-foreground"
      : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground",
  );
}

export function AppNav({
  showClubAndPeople = false,
  teams = [],
  activeTeamId = null,
  name = null,
  email = null,
  showAccount = false,
}: {
  showClubAndPeople?: boolean;
  teams?: Pick<Team, "id" | "name" | "season_label" | "archived_at">[];
  activeTeamId?: string | null;
  name?: string | null;
  email?: string | null;
  showAccount?: boolean;
}) {
  const pathname = usePathname();
  const items = getDesktopNavItems(showClubAndPeople);

  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap items-center gap-1 text-sm"
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={desktopNavItemClassName(active)}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <TeamSwitcher
        teams={teams}
        activeTeamId={activeTeamId}
        triggerClassName="min-h-9 rounded-full px-3 py-1.5 text-header-foreground/80 hover:text-header-foreground"
      />
      {showAccount ? (
        <UserMenu
          name={name}
          email={email}
          triggerClassName={cn(
            desktopNavItemClassName(),
            "aria-expanded:bg-header-foreground/15 aria-expanded:text-header-foreground",
          )}
        />
      ) : null}
    </nav>
  );
}

export function MobileTabBar({
  showClubAndPeople = false,
  name,
  email,
}: {
  showClubAndPeople?: boolean;
  name: string | null;
  email: string | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = getMoreNavItems(showClubAndPeople);
  const moreActive = isMoreSectionActive(pathname, showClubAndPeople);

  return (
    <nav
      aria-label="Main"
      className="border-header/20 bg-header text-header-foreground fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold tracking-wide",
                  active
                    ? "text-pitch-lime"
                    : "text-header-foreground/70 hover:text-header-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.shortLabel ?? item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-current={moreActive ? "true" : undefined}
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold tracking-wide",
              moreOpen || moreActive
                ? "text-pitch-lime"
                : "text-header-foreground/70 hover:text-header-foreground",
            )}
          >
            <EllipsisIcon className="size-5" />
            More
          </button>
        </li>
      </ul>

      {moreOpen ? (
        <div className="border-header-foreground/15 bg-header absolute inset-x-0 bottom-full border-t px-3 pt-3 pb-2 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
          <div className="mx-auto max-w-5xl">
            <div className="border-header-foreground/15 mb-2 border-b px-1 pb-2">
              <AccountDetails name={name} email={email} />
            </div>
            <ul className="grid grid-cols-2 gap-1 pb-1">
              {moreItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium",
                        active
                          ? "bg-header-foreground/15 text-pitch-lime"
                          : "text-header-foreground/85 hover:bg-header-foreground/10",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-header-foreground/15 mt-1 border-t pt-1">
              <SignOutLink className="text-header-foreground h-10 w-full justify-start px-3" />
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
