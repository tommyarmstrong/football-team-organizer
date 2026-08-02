import { formatAge, formatShortDate } from "@/lib/format";
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
  const telHref = emergencyPhone
    ? `tel:${emergencyPhone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {email ? <p>{email}</p> : null}
        {phone ? <p>{phone}</p> : null}
        {player?.position ? <p>{player.position}</p> : null}
        {player?.date_of_birth ? (
          <p>
            DOB: {formatShortDate(player.date_of_birth)}
            <span className="text-muted-foreground">
              {" "}
              ({formatAge(player.date_of_birth)})
            </span>
          </p>
        ) : null}
        {player?.school ? <p>School: {player.school}</p> : null}
        {showEmergency && emergencyContactName ? (
          <p className="font-bold">
            Emergency Contact: {emergencyContactName}
            {emergencyPhone ? (
              <>
                {" "}
                {telHref ? (
                  <a href={telHref} className="underline md:no-underline">
                    {emergencyPhone}
                  </a>
                ) : (
                  emergencyPhone
                )}
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <PersonRoleChips roles={roles} />
    </div>
  );
}
