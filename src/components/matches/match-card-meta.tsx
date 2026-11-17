import Link from "next/link";
import { Fragment } from "react";

export type MatchCardMetaLines = {
  competition: string | null;
  venue: string | null;
  dateTime: string;
  meetup: string | null;
  kickoff: string | null;
};

/** The parts of the date row, in display order, with missing ones dropped. */
export function matchDateRowParts(
  meta: Pick<MatchCardMetaLines, "dateTime" | "meetup" | "kickoff">,
): string[] {
  return [meta.dateTime, meta.meetup, meta.kickoff].filter(
    (part): part is string => Boolean(part),
  );
}

/** One size for every line; only the competition is bold. */
export function matchCardMetaClassName(): string {
  return "text-muted-foreground mt-3 space-y-1 text-center text-xs sm:mt-4 sm:text-sm";
}

/** Phone-only hit area so the venue link is tappable without moving the layout. */
export const MATCH_VENUE_LINK_CLASS_NAME =
  "text-foreground underline-offset-2 hover:underline max-sm:-my-2 max-sm:inline-block max-sm:py-2";

/**
 * The meta block under the score on every match card (dashboard, matches list
 * and match page): competition (bold), venue, then date, meet up and kick off
 * on one centred row separated by dots.
 */
export function MatchCardMeta({
  meta,
  venueHref,
}: {
  meta: MatchCardMetaLines;
  venueHref?: string;
}) {
  const dateRow = matchDateRowParts(meta);
  return (
    <div data-slot="match-card-stack" className={matchCardMetaClassName()}>
      {meta.competition ? (
        <p className="text-foreground font-bold">{meta.competition}</p>
      ) : null}
      {meta.venue ? (
        <p>
          {venueHref ? (
            <Link href={venueHref} className={MATCH_VENUE_LINK_CLASS_NAME}>
              {meta.venue}
            </Link>
          ) : (
            meta.venue
          )}
        </p>
      ) : null}
      <p
        data-slot="match-card-date-row"
        className="flex flex-wrap items-center justify-center gap-x-2"
      >
        {dateRow.map((part, index) => (
          <Fragment key={part}>
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            <span>{part}</span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
