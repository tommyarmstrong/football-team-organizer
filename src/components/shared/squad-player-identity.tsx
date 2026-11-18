import type { ReactNode } from "react";

export function SquadPlayerIdentity({
  name,
  shirtNumber,
  trailing,
}: {
  name: string;
  shirtNumber?: number | null;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden
        className="font-display bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sm leading-none tabular-nums"
      >
        {shirtNumber ?? "—"}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </span>
    </>
  );
}
