"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team" },
  { href: "/venues", label: "Venues" },
  { href: "/matches", label: "Matches" },
  { href: "/stats", label: "Stats" },
] as const;

const STAFF_NAV_ITEM = { href: "/coaches", label: "Coaches" } as const;
const MANAGEMENT_NAV_ITEMS = [{ href: "/club", label: "Club" }] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavItems(showStaff: boolean, showManagement: boolean) {
  return [
    ...BASE_NAV_ITEMS,
    ...(showStaff ? [STAFF_NAV_ITEM] : []),
    ...(showManagement ? MANAGEMENT_NAV_ITEMS : []),
  ];
}

export function AppNav({
  showStaff = false,
  showManagement = false,
}: {
  showStaff?: boolean;
  showManagement?: boolean;
}) {
  const pathname = usePathname();
  const items = getNavItems(showStaff, showManagement);

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

export function MobileNavMenu({
  showStaff = false,
  showManagement = false,
}: {
  showStaff?: boolean;
  showManagement?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = getNavItems(showStaff, showManagement);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Menu"
          />
        }
      >
        <MenuIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-56 max-w-[calc(100vw-2rem)] p-1.5"
      >
        <nav aria-label="Main" className="flex flex-col gap-0.5 text-sm">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-visible:ring-ring inline-flex min-h-9 items-center rounded-md px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
