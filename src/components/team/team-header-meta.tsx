import Link from "next/link";
import { formatTeamHeaderSummary } from "@/lib/format";
import type { TeamGender } from "@/lib/supabase/database.types";

export function TeamHeaderMeta({
  clubName,
  gender,
  ageGroup,
  seasonLabel,
  archived,
  headCoachName,
  homeVenue,
  trainingVenue,
  trainingDaysLabel,
}: {
  clubName: string;
  gender: TeamGender;
  ageGroup: string;
  seasonLabel: string;
  archived: boolean;
  headCoachName: string | null;
  homeVenue: { id: string; name: string } | null;
  trainingVenue: { id: string; name: string } | null;
  trainingDaysLabel: string;
}) {
  const summaryLine = formatTeamHeaderSummary({
    clubName,
    gender,
    ageGroup,
    seasonLabel,
    archived,
  });

  return (
    <div className="space-y-1">
      <p>{summaryLine}</p>
      <p>Head coach: {headCoachName ?? "—"}</p>
      <p>
        Home venue:{" "}
        {homeVenue ? (
          <Link
            href={`/venues/${homeVenue.id}`}
            className="text-foreground underline-offset-2 hover:underline"
          >
            {homeVenue.name}
          </Link>
        ) : (
          "—"
        )}
      </p>
      <p>
        Training venue:{" "}
        {trainingVenue ? (
          <Link
            href={`/venues/${trainingVenue.id}`}
            className="text-foreground underline-offset-2 hover:underline"
          >
            {trainingVenue.name}
          </Link>
        ) : (
          "—"
        )}
      </p>
      <p>Training days: {trainingDaysLabel}</p>
    </div>
  );
}
