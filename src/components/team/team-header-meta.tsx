import Link from "next/link";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ShirtIcon,
  UserIcon,
} from "lucide-react";
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
    <div className="space-y-2.5">
      <p className="flex items-start gap-2">
        <ShirtIcon className="text-primary mt-0.5 size-4 shrink-0" />
        <span>{summaryLine}</span>
      </p>
      <p className="flex items-start gap-2">
        <UserIcon className="text-primary mt-0.5 size-4 shrink-0" />
        <span>Head coach: {headCoachName ?? "—"}</span>
      </p>
      <p className="flex items-start gap-2">
        <MapPinIcon className="text-primary mt-0.5 size-4 shrink-0" />
        <span>
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
        </span>
      </p>
      <p className="flex items-start gap-2">
        <MapPinIcon className="text-primary mt-0.5 size-4 shrink-0" />
        <span>
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
        </span>
      </p>
      <p className="flex items-start gap-2">
        <CalendarDaysIcon className="text-primary mt-0.5 size-4 shrink-0" />
        <span>Training days: {trainingDaysLabel}</span>
      </p>
    </div>
  );
}
