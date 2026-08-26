"use client";

import Link from "next/link";
import { UserIcon } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function AccountDetails({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const title = name ?? email ?? "Account";
  const showEmailUnderName = Boolean(name && email);

  return (
    <div className="flex flex-col gap-0.5 px-0.5">
      <p className="truncate text-sm font-medium">{title}</p>
      {showEmailUnderName ? (
        <p className="truncate text-sm opacity-70">{email}</p>
      ) : null}
    </div>
  );
}

export function SignOutLink({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="link" size="sm" className={className}>
        Sign out
      </Button>
    </form>
  );
}

export function ResetPasswordLink({ className }: { className?: string }) {
  return (
    <Link
      href="/account/password"
      className={cn(buttonVariants({ variant: "link", size: "sm" }), className)}
    >
      Reset password
    </Link>
  );
}

export function UserMenu({
  name,
  email,
  triggerClassName,
}: {
  name: string | null;
  email: string | null;
  triggerClassName?: string;
}) {
  const title = name ?? email ?? "Account";
  const showEmailUnderName = Boolean(name && email);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Account"
            className={cn(triggerClassName)}
          />
        }
      >
        <UserIcon className="size-4 shrink-0" />
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
        <ResetPasswordLink className="h-auto justify-start px-0.5 py-1" />
        <SignOutLink className="h-auto justify-start px-0.5 py-1" />
      </PopoverContent>
    </Popover>
  );
}
