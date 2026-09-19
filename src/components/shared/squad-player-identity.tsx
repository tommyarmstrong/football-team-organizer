export function SquadPlayerIdentity({
  name,
  shirtNumber,
}: {
  name: string;
  shirtNumber?: number | null;
}) {
  return (
    <>
      <span
        aria-hidden
        className="font-display bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sm leading-none tabular-nums"
      >
        {shirtNumber ?? "—"}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
    </>
  );
}
