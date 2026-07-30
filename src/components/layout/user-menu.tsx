"use client";

import { UserIcon } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UserMenu({
  name,
  email,
  roleLabel,
}: {
  name: string | null;
  email: string | null;
  roleLabel: string;
}) {
  const title = name ?? email ?? "Account";
  const showEmailUnderName = Boolean(name && email);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Account"
          />
        }
      >
        <UserIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-64 max-w-[calc(100vw-2rem)]"
      >
        <PopoverHeader className="gap-1 px-0.5">
          <PopoverTitle className="truncate">{title}</PopoverTitle>
          {showEmailUnderName ? (
            <PopoverDescription className="truncate">
              {email}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>
        <p className="text-muted-foreground px-0.5 text-xs">{roleLabel}</p>
        <form action={signOut} className="pt-0.5">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
