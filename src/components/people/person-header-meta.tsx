import { formatShortDate } from "@/lib/format";
import type { PersonPlayerRef } from "@/lib/data/people";
import {
  PersonRoleChips,
  type PersonRoleKind,
} from "@/components/shared/role-chip";

export function PersonHeaderMeta({
  email,
  phone,
  roles,
  player,
  emergencyContactName,
  emergencyPhone,
}: {
  email: string | null;
  phone: string | null;
  roles: Partial<Record<PersonRoleKind, boolean>>;
  player: PersonPlayerRef | null;
  emergencyContactName: string | null;
  emergencyPhone: string | null;
}) {
  const showEmergency = Boolean(roles.player || roles.coach);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {email ? <p>{email}</p> : null}
        {phone ? <p>{phone}</p> : null}
        {player?.position ? <p>{player.position}</p> : null}
        {player?.date_of_birth ? (
          <p>{formatShortDate(player.date_of_birth)}</p>
        ) : null}
        {player?.school ? <p>{player.school}</p> : null}
        {showEmergency && emergencyContactName ? (
          <p className="font-bold">Emergency contact: {emergencyContactName}</p>
        ) : null}
        {showEmergency && emergencyPhone ? (
          <p className="font-bold">Emergency phone: {emergencyPhone}</p>
        ) : null}
      </div>
      <PersonRoleChips roles={roles} />
    </div>
  );
}
