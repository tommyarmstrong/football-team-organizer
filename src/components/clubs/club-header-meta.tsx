import { AGE_GROUPS, TEAM_GENDER_LABELS } from "@/lib/constants";
import { isTeamArchived } from "@/lib/team/season";
import { labelGender } from "@/lib/format";
import type { Team, TeamGender } from "@/lib/supabase/database.types";
import { RoleChip } from "@/components/shared/role-chip";

function ageGroupIndex(ageGroup: string): number {
  const index = (AGE_GROUPS as readonly string[]).indexOf(ageGroup);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/** Prefer current (non-archived) seasons for club summary chips. */
function currentSeasonTeams(teams: Team[]): Team[] {
  const active = teams.filter((team) => !isTeamArchived(team));
  return active.length > 0 ? active : teams;
}

export function clubAgeRangeLabel(teams: Team[]): string | null {
  const known = currentSeasonTeams(teams)
    .map((team) => team.age_group)
    .filter((ageGroup) => (AGE_GROUPS as readonly string[]).includes(ageGroup));

  if (known.length === 0) return null;

  const sorted = [...new Set(known)].sort(
    (a, b) => ageGroupIndex(a) - ageGroupIndex(b),
  );
  if (sorted.length === 1) return sorted[0];
  return `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

export function clubGendersPresent(teams: Team[]): TeamGender[] {
  const present = new Set(currentSeasonTeams(teams).map((team) => team.gender));
  return (Object.keys(TEAM_GENDER_LABELS) as TeamGender[]).filter((gender) =>
    present.has(gender),
  );
}

function formatWebsiteHref(website: string): string {
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
}

export function ClubHeaderMeta({
  club,
  teams,
}: {
  club: {
    established: number | null;
    website: string | null;
    email: string | null;
    phone: string | null;
  };
  teams: Team[];
}) {
  const genders = clubGendersPresent(teams);
  const ageRange = clubAgeRangeLabel(teams);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {club.established != null ? (
          <p>Established {club.established}</p>
        ) : null}
        {club.website ? (
          <p>
            Website:{" "}
            <a
              href={formatWebsiteHref(club.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              {club.website}
            </a>
          </p>
        ) : null}
        {club.email ? (
          <p>
            Email:{" "}
            <a
              href={`mailto:${club.email}`}
              className="text-foreground underline-offset-2 hover:underline"
            >
              {club.email}
            </a>
          </p>
        ) : null}
        {club.phone ? (
          <p>
            Phone:{" "}
            <a
              href={`tel:${club.phone}`}
              className="text-foreground underline-offset-2 hover:underline"
            >
              {club.phone}
            </a>
          </p>
        ) : null}
      </div>

      {genders.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Team genders">
          {genders.map((gender) => (
            <li key={gender}>
              <RoleChip>{labelGender(gender)}</RoleChip>
            </li>
          ))}
        </ul>
      ) : null}

      {ageRange ? <p>Age range: {ageRange}</p> : null}
    </div>
  );
}
