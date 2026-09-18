import { InitialsAvatar } from "@/components/shared/initials-avatar";

export function SquadPlayerIdentity({
  name,
  shirtNumber,
}: {
  name: string;
  shirtNumber?: number | null;
}) {
  return (
    <>
      <InitialsAvatar name={name} className="size-9" />
      <span className="text-muted-foreground w-[2ch] shrink-0 text-right tabular-nums">
        {shirtNumber ?? "—"}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
    </>
  );
}
