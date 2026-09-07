import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/layout/app-header";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      id="app-shell"
      className="flex min-h-full flex-1 flex-col"
      data-club-colour="false"
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
