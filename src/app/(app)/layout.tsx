import type { CSSProperties, ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { getPrimaryClub } from "@/lib/data/clubs";
import { isValidClubColour } from "@/lib/clubs/branding";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const club = await getPrimaryClub();
  const colour =
    club?.colour && isValidClubColour(club.colour) ? club.colour : null;

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      data-club-colour={colour ? "true" : "false"}
      style={
        colour ? ({ "--club-colour": colour } as CSSProperties) : undefined
      }
    >
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
        {children}
      </main>
    </div>
  );
}
