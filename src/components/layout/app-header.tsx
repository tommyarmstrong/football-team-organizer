import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          <AppNav />
        </div>

        <div className="flex items-center gap-3">
          {user?.email ? (
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              {user.email}
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
