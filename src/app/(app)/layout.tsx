import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
        {children}
      </main>
    </>
  );
}
