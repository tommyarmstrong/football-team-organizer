import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AppHeader, AppHeaderFallback } from "@/components/layout/app-header";
import {
  CLUB_COLOUR_HINT_COOKIE,
  parseClubColourHint,
} from "@/lib/clubs/colour-hint";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const colourHint = parseClubColourHint(
    cookieStore.get(CLUB_COLOUR_HINT_COOKIE)?.value,
  );

  return (
    <div
      id="app-shell"
      className="flex min-h-full flex-1 flex-col"
      data-club-colour={colourHint ? "true" : "false"}
      style={
        colourHint
          ? ({ "--club-colour": colourHint } as CSSProperties)
          : undefined
      }
    >
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8 md:pb-8">
        {children}
      </main>
    </div>
  );
}
