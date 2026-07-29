"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Matches" },
  { href: "/stats", label: "Stats" },
] as const;

const STAFF_NAV_ITEM = { href: "/coaches", label: "Coaches" } as const;
const MANAGEMENT_NAV_ITEMS = [
  { href: "/club", label: "Club" },
  { href: "/guardians", label: "Guardians" },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  showStaff = false,
  showManagement = false,
}: {
  showStaff?: boolean;
  showManagement?: boolean;
}) {
  const pathname = usePathname();

  const items = [
    ...BASE_NAV_ITEMS,
    ...(showStaff ? [STAFF_NAV_ITEM] : []),
    ...(showManagement ? MANAGEMENT_NAV_ITEMS : []),
  ];

  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1 text-sm">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring inline-flex min-h-9 items-center rounded-md px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
