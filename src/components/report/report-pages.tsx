import type { ReactElement } from "react";
import { formatShortDate } from "@/lib/format";
import {
  GALLERY_CARDS_PER_PAGE,
  GALLERY_COLUMNS,
} from "@/lib/report/card-path";
import { chunkAtLeastOne, splitMarkdownPages } from "@/lib/report/paginate";
import { galleryEntries, type GalleryEntry } from "@/lib/report/gallery";
import { SEASON_AWARD_BOXES } from "@/lib/report/season-awards";
import { REPORT_SECTION_TITLES, VENUES_PER_PAGE } from "@/lib/report/sections";
import {
  biggestWin,
  cleanSheets,
  displayScore,
  honourNames,
  goalTotals,
  leaders,
  longestUnbeaten,
  perMatch,
  tally,
  winPercentage,
} from "@/lib/report/summary";
import type {
  ReportCompetition,
  ReportData,
  ReportMatch,
  ReportPlayer,
  ReportVenue,
} from "@/lib/report/types";
import {
  FormStrip,
  GoalsPerMatch,
  LeaderBars,
  PointsTrend,
  RESULT_COLOURS,
  ResultsDonut,
  ResultsLegend,
} from "@/components/report/report-charts";
import { ReportGalleryCard } from "@/components/report/report-gallery-card";
import { ReportMarkdown } from "@/components/report/report-markdown";
import {
  Panel,
  PanelTitle,
  ReportPage,
  SlotPlaceholder,
} from "@/components/report/report-page";

/** Rows that fit on one page of each table. Keep conservative. */
export const RESULTS_PER_PAGE = 14;
/** Coaching staff cards on the awards page. */
export const MAX_STAFF = 8;

export function footerLabel(data: ReportData): string {
  return [data.club.name, data.team.seasonLabel].filter(Boolean).join(" · ");
}

function EmptyNote({ children }: { children: string }) {
  return (
    <Panel>
      <p className="text-[11pt] text-neutral-600 italic">{children}</p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Cover and back cover
// ---------------------------------------------------------------------------

/** Pitch markings and a dark wedge, behind the text on the cover panels. */
function PitchMarkings({ subtle = false }: { subtle?: boolean }) {
  return (
    <svg
      viewBox="0 0 210 297"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <polygon
        points="0,297 210,205 210,297"
        fill="var(--club-deep)"
        opacity="0.5"
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity={subtle ? 0.09 : 0.16}
      >
        <circle cx="105" cy="150" r="46" />
        <circle cx="105" cy="150" r="1.6" fill="currentColor" />
        <line x1="-10" y1="150" x2="220" y2="150" />
        <path d="M 55 -2 A 50 50 0 0 0 155 -2" />
        <path d="M 55 299 A 50 50 0 0 1 155 299" />
      </g>
    </svg>
  );
}

function ClubBadge({ data, size }: { data: ReportData; size: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data.club.iconUrl}
      alt=""
      className={`${size} rounded-full bg-white object-contain p-[2mm]`}
    />
  );
}

export function CoverPage({ data }: { data: ReportData }) {
  return (
    <section className="report-sheet" aria-label="Cover">
      <div className="absolute inset-[10mm] overflow-hidden rounded-[6mm] bg-(--club) text-(--club-fg)">
        <PitchMarkings />
        <div className="relative flex h-full flex-col p-[13mm]">
          <div className="flex items-center gap-[5mm]">
            <ClubBadge data={data} size="size-[19mm]" />
            <p className="font-display text-[17pt] font-medium tracking-[0.2em] uppercase">
              {data.club.name}
            </p>
          </div>

          <div className="mt-[22mm]">
            <p className="flex items-center gap-[4mm] text-[10pt] font-semibold tracking-[0.35em] uppercase">
              <span className="inline-block h-[1.6mm] w-[14mm] rounded-full bg-current" />
              Season report
            </p>
            <h1 className="font-display mt-[5mm] text-[27mm] leading-[0.86] font-semibold tracking-[0.005em] uppercase">
              {data.team.name}
            </h1>
            <p className="font-display mt-[6mm] text-[22pt] font-medium tracking-[0.12em] uppercase opacity-90">
              {data.team.seasonLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A cover with nothing on it. The front and back covers are printed on a
 * double-sided sheet, so each is followed (or preceded) by a plain page in
 * the same club colour.
 */
export function BlankCoverPage({
  label,
  subtle = false,
}: {
  label: string;
  subtle?: boolean;
}) {
  return (
    <section className="report-sheet" aria-label={label}>
      <div className="absolute inset-[10mm] overflow-hidden rounded-[6mm] bg-(--club) text-(--club-fg)">
        <PitchMarkings subtle={subtle} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Team info
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline gap-[4mm] border-b border-(--club-line) py-[3mm] last:border-b-0">
      <dt className="w-[34mm] shrink-0 text-[8pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
        {label}
      </dt>
      <dd className="text-[12pt] text-neutral-900">{value ?? "—"}</dd>
    </div>
  );
}

export function TeamInfoPage({ data }: { data: ReportData }) {
  const { team } = data;

  return (
    <ReportPage
      kicker={REPORT_SECTION_TITLES.teamInfo}
      title={team.name}
      label={footerLabel(data)}
    >
      {team.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.photoUrl}
          alt={`${team.name} team photo`}
          className="mb-[8mm] h-[112mm] w-full rounded-[3.5mm] border-[1.2mm] border-white object-cover shadow-[0_0_0_0.25mm_var(--club-line)]"
        />
      ) : null}

      <Panel>
        <p className="font-display text-[15pt] leading-tight font-semibold tracking-[0.04em] text-(--club-ink) uppercase">
          {team.summary}
        </p>
        <dl className="mt-[3mm]">
          <InfoRow label="Head coach" value={data.headCoachName} />
          <InfoRow label="Home venue" value={team.homeVenue} />
          <InfoRow label="Training venue" value={team.trainingVenue} />
          <InfoRow label="Training days" value={team.trainingDays} />
        </dl>
      </Panel>
    </ReportPage>
  );
}

export function BackCoverPage({ data }: { data: ReportData }) {
  return (
    <section className="report-sheet" aria-label="Back cover">
      <div className="absolute inset-[10mm] overflow-hidden rounded-[6mm] bg-(--club) text-(--club-fg)">
        <PitchMarkings subtle />
        <div className="relative flex h-full flex-col items-center justify-center px-[18mm] text-center">
          <ClubBadge data={data} size="size-[34mm]" />
          <p className="font-display mt-[12mm] text-[44pt] leading-none font-semibold tracking-[0.04em] uppercase">
            Thank you
          </p>
          <p className="mt-[5mm] max-w-[110mm] text-[12pt] leading-relaxed opacity-90">
            To every player, coach, parent, guardian and volunteer who made{" "}
            {data.team.seasonLabel} possible.
          </p>
          <p className="font-display mt-[16mm] text-[15pt] tracking-[0.22em] uppercase">
            {data.team.name}
          </p>
          <p className="mt-[1.5mm] text-[9pt] tracking-[0.25em] uppercase opacity-80">
            {data.club.name}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Coach's notes and looking ahead (markdown slots)
// ---------------------------------------------------------------------------

export function coachNotesPages({
  data,
}: {
  data: ReportData;
}): ReactElement[] {
  const slot = data.content.coachNotes;
  const label = footerLabel(data);
  const pages = slot.markdown ? splitMarkdownPages(slot.markdown) : [];

  if (pages.length === 0) {
    return [
      <ReportPage
        key="coach-notes"
        kicker="From the dugout"
        title={REPORT_SECTION_TITLES.coachNotes}
        label={label}
      >
        <SlotPlaceholder
          expectedPath={slot.expectedPath}
          hint="Write the coach's season write-up in this markdown file. Put <!-- page --> on its own line to start a new page."
        />
      </ReportPage>,
    ];
  }

  return pages.map((markdown, index) => (
    <ReportPage
      key={`coach-notes-${index}`}
      kicker={index === 0 ? "From the dugout" : "From the dugout (continued)"}
      title={REPORT_SECTION_TITLES.coachNotes}
      label={label}
    >
      <ReportMarkdown markdown={markdown} />
      {index === pages.length - 1 && data.headCoachName ? (
        <div className="mt-auto pt-[8mm]">
          <p className="font-display text-[20pt] leading-none font-semibold text-(--club-ink) uppercase">
            {data.headCoachName}
          </p>
          <p className="mt-[1.5mm] text-[9pt] tracking-[0.2em] text-neutral-500 uppercase">
            Head Coach
          </p>
        </div>
      ) : null}
    </ReportPage>
  ));
}

export function lookingAheadPages({
  data,
}: {
  data: ReportData;
}): ReactElement[] {
  const slot = data.content.lookingAhead;
  const label = footerLabel(data);
  const pages = slot.markdown ? splitMarkdownPages(slot.markdown) : [];

  if (pages.length === 0) {
    return [
      <ReportPage
        key="looking-ahead"
        kicker="What's next"
        title={REPORT_SECTION_TITLES.lookingAhead}
        label={label}
      >
        <SlotPlaceholder
          expectedPath={slot.expectedPath}
          hint="Write about next season, training plans, dates and thank-yous in this markdown file."
        />
      </ReportPage>,
    ];
  }

  return pages.map((markdown, index) => (
    <ReportPage
      key={`looking-ahead-${index}`}
      kicker={index === 0 ? "What's next" : "What's next (continued)"}
      title={REPORT_SECTION_TITLES.lookingAhead}
      label={label}
    >
      <ReportMarkdown markdown={markdown} />
    </ReportPage>
  ));
}

// ---------------------------------------------------------------------------
// Season at a glance
// ---------------------------------------------------------------------------

function StatTile({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-[3mm] bg-(--club) p-[4.5mm] text-(--club-fg)"
          : "rounded-[3mm] border border-(--club-line) bg-(--club-soft) p-[4.5mm]"
      }
    >
      <p className="font-display text-[22mm] leading-[0.9] font-semibold">
        {value}
      </p>
      <p className="mt-[2mm] text-[8pt] font-semibold tracking-[0.2em] uppercase opacity-80">
        {label}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-[4mm] border-b border-(--club-line) py-[2.2mm] last:border-b-0">
      <dt className="text-[9.5pt] text-neutral-600">{label}</dt>
      <dd className="font-display text-right text-[13pt] leading-none font-semibold">
        {value}
      </dd>
    </div>
  );
}

function formatBiggestWin(match: ReportMatch | null): string {
  return match
    ? `${match.goalsFor}–${match.goalsAgainst} v ${match.opponent}`
    : "—";
}

export function GlancePage({ data }: { data: ReportData }) {
  const label = footerLabel(data);
  // League and cup only; the Results pages list every match.
  const matches = data.leagueCupMatches;
  const t = tally(matches);
  const goals = goalTotals(matches);

  if (matches.length === 0) {
    return (
      <ReportPage
        kicker={`Season ${data.team.seasonLabel}`}
        title={REPORT_SECTION_TITLES.glance}
        label={label}
      >
        <EmptyNote>No league or cup matches have been played yet.</EmptyNote>
      </ReportPage>
    );
  }

  return (
    <ReportPage
      kicker={`Season ${data.team.seasonLabel}`}
      title={REPORT_SECTION_TITLES.glance}
      label={label}
    >
      <div className="grid grid-cols-4 gap-[3.5mm]">
        <StatTile value={matches.length} label="Played" accent />
        <StatTile value={t.wins} label="Won" />
        <StatTile value={goals.goalsFor} label="Goals scored" accent />
        <StatTile value={goals.goalsAgainst} label="Goals conceded" />
      </div>

      <div className="mt-[5mm] grid grid-cols-[1fr_1.35fr] gap-[5mm]">
        <Panel>
          <PanelTitle>Results</PanelTitle>
          <div className="flex items-center gap-[4mm]">
            <div className="size-[38mm] shrink-0">
              <ResultsDonut tally={t} />
            </div>
            <ResultsLegend tally={t} />
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Key facts</PanelTitle>
          <dl>
            <Fact label="Win rate" value={`${winPercentage(t)}%`} />
            <Fact
              label="Goals per match"
              value={perMatch(goals.goalsFor, matches.length)}
            />
            <Fact label="Clean sheets" value={String(cleanSheets(matches))} />
            <Fact
              label="Longest unbeaten run"
              value={`${longestUnbeaten(matches)} matches`}
            />
            <Fact
              label="Biggest win"
              value={formatBiggestWin(biggestWin(matches))}
            />
          </dl>
        </Panel>
      </div>

      <Panel className="mt-[5mm]">
        <PanelTitle>Results · every league and cup match, in order</PanelTitle>
        <FormStrip matches={matches} />
      </Panel>

      <Panel className="mt-[5mm]">
        <PanelTitle>Results through the season</PanelTitle>
        <PointsTrend matches={matches} />
      </Panel>
      <p className="mt-auto pt-[4mm] text-[8pt] text-neutral-500">
        League and cup matches only. Friendlies and tournaments are not counted.
      </p>
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------

function ScoreChip({ match }: { match: ReportMatch }) {
  const score = displayScore(match);
  return (
    <span
      className="font-display inline-flex h-[8.5mm] w-[22mm] items-center justify-center rounded-[2mm] text-[15pt] leading-none font-semibold"
      style={{
        backgroundColor: RESULT_COLOURS[match.result],
        color: match.result === "D" ? "#2b2205" : "#fff",
      }}
    >
      {score.first}–{score.second}
    </span>
  );
}

const HOME_AWAY_LABEL = { home: "H", away: "A", neutral: "N" } as const;

export function resultsPages({ data }: { data: ReportData }): ReactElement[] {
  const label = footerLabel(data);
  const pages = chunkAtLeastOne(data.matches, RESULTS_PER_PAGE);
  let number = 0;

  return pages.map((rows, pageIndex) => (
    <ReportPage
      key={`results-${pageIndex}`}
      kicker={pageIndex === 0 ? "Every match" : "Every match (continued)"}
      title={REPORT_SECTION_TITLES.results}
      label={label}
    >
      {rows.length === 0 ? (
        <EmptyNote>No matches have been played yet.</EmptyNote>
      ) : (
        <ol className="border-t border-(--club-line)">
          {rows.map((m) => {
            number += 1;
            return (
              <li
                key={m.id}
                className="grid grid-cols-[9mm_25mm_8mm_1fr_22mm] items-center gap-[3mm] border-b border-(--club-line) py-[2.6mm]"
              >
                <span className="font-display text-[13pt] text-neutral-400">
                  {number}
                </span>
                <span className="text-[9.5pt] text-neutral-600">
                  {formatShortDate(m.date)}
                </span>
                <span
                  className="font-display inline-flex size-[6.2mm] items-center justify-center rounded-full bg-(--club-soft) text-[9pt] font-semibold text-(--club-ink) ring-1 ring-(--club-line)"
                  title={m.homeAway}
                >
                  {HOME_AWAY_LABEL[m.homeAway]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11.5pt] font-medium">
                    {m.opponent}
                  </span>
                  {m.competitionLabel ? (
                    <span className="block truncate text-[8.5pt] tracking-[0.08em] text-neutral-500 uppercase">
                      {m.competitionLabel}
                    </span>
                  ) : null}
                </span>
                <ScoreChip match={m} />
              </li>
            );
          })}
        </ol>
      )}
    </ReportPage>
  ));
}

// ---------------------------------------------------------------------------
// The season in numbers
// ---------------------------------------------------------------------------

export function NumbersPage({ data }: { data: ReportData }) {
  const label = footerLabel(data);
  const scorers = leaders(data.players, (p) => p.goals, 8);
  const assisters = leaders(data.players, (p) => p.assists, 8);

  return (
    <ReportPage
      kicker="Charts"
      title={REPORT_SECTION_TITLES.numbers}
      label={label}
    >
      <Panel>
        <PanelTitle>Goals in every league and cup match</PanelTitle>
        {data.leagueCupMatches.length === 0 ? (
          <p className="text-[10pt] text-neutral-500 italic">
            No league or cup matches yet.
          </p>
        ) : (
          <GoalsPerMatch matches={data.leagueCupMatches} />
        )}
      </Panel>
      <div className="mt-[5mm] grid grid-cols-2 gap-[5mm]">
        <Panel>
          <PanelTitle>Top scorers</PanelTitle>
          <LeaderBars
            rows={scorers}
            unit="goals"
            emptyText="No goals recorded."
          />
        </Panel>
        <Panel>
          <PanelTitle>Most assists</PanelTitle>
          <LeaderBars
            rows={assisters}
            unit="assists"
            emptyText="No assists recorded."
          />
        </Panel>
      </div>
      <p className="mt-auto pt-[4mm] text-[8pt] text-neutral-500">
        League and cup matches only. Friendlies and tournaments are not counted.
      </p>
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Competitions
// ---------------------------------------------------------------------------

function CompetitionCard({ c }: { c: ReportCompetition }) {
  const podium = c.result === "champions";
  return (
    <Panel className="flex items-center gap-[5mm]">
      <div className="min-w-0 flex-1">
        <p className="text-[8pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
          {c.kindLabel}
        </p>
        <p className="font-display mt-[1mm] truncate text-[19pt] leading-none font-semibold uppercase">
          {c.name}
        </p>
        <p className="mt-[2.5mm] text-[10pt] text-neutral-600">
          {c.played === 0
            ? "No matches recorded"
            : `Played ${c.played} · Won ${c.wins} · Drawn ${c.draws} · Lost ${c.losses} · Goals ${c.goalsFor}–${c.goalsAgainst}`}
        </p>
      </div>
      <span
        className={
          podium
            ? "font-display rounded-full bg-[#e0a526] px-[5mm] py-[2.2mm] text-[12pt] font-semibold tracking-[0.08em] text-[#2b2205] uppercase"
            : "font-display rounded-full bg-(--club) px-[5mm] py-[2.2mm] text-[12pt] font-semibold tracking-[0.08em] text-(--club-fg) uppercase"
        }
      >
        {c.resultLabel}
      </span>
    </Panel>
  );
}

export function CompetitionsPage({ data }: { data: ReportData }) {
  return (
    <ReportPage
      kicker="League and cups"
      title={REPORT_SECTION_TITLES.competitions}
      label={footerLabel(data)}
    >
      {data.competitions.length === 0 ? (
        <EmptyNote>No competitions were recorded this season.</EmptyNote>
      ) : (
        <div className="space-y-[4mm]">
          {data.competitions.slice(0, 7).map((c) => (
            <CompetitionCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

function VenueCard({ venue }: { venue: ReportVenue }) {
  return (
    <li className="flex flex-col rounded-[3mm] border border-(--club-line) bg-(--club-soft) p-[4mm]">
      <div className="flex items-start justify-between gap-[3mm]">
        <h3 className="font-display line-clamp-2 text-[16pt] leading-[1.02] font-semibold tracking-[0.01em] text-neutral-900 uppercase">
          {venue.name}
        </h3>
        {venue.isHome ? (
          <span className="shrink-0 rounded-full bg-(--club) px-[3mm] py-[1mm] text-[7pt] font-semibold tracking-[0.15em] text-(--club-fg) uppercase">
            Home
          </span>
        ) : null}
      </div>
      {venue.surface ? (
        <p className="mt-[1mm] text-[7.5pt] font-semibold tracking-[0.18em] text-(--club-ink) uppercase">
          {venue.surface}
        </p>
      ) : null}
      {venue.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={venue.photoUrl}
          alt={`Photo of ${venue.name}`}
          className="mt-[3mm] h-[32mm] w-full rounded-[2mm] border-[0.8mm] border-white object-cover shadow-[0_0_0_0.25mm_var(--club-line)]"
        />
      ) : null}

      <div className="mt-auto pt-[3mm]">
        <div className="border-t border-(--club-line) pt-[3mm]">
          <p className="font-display text-[13pt] font-semibold text-(--club-ink) uppercase">
            Played {venue.played} · W{venue.wins} D{venue.draws} L{venue.losses}
          </p>
          <p className="mt-[1mm] text-[8.5pt] text-neutral-600">
            Goals {venue.goalsFor}–{venue.goalsAgainst}
            {venue.biggestWin ? ` · Biggest win ${venue.biggestWin}` : ""}
          </p>
        </div>
      </div>
    </li>
  );
}

export function venuesPages({ data }: { data: ReportData }): ReactElement[] {
  const label = footerLabel(data);
  const pages = chunkAtLeastOne(data.venues, VENUES_PER_PAGE);

  return pages.map((venues, pageIndex) => (
    <ReportPage
      key={`venues-${pageIndex}`}
      kicker={
        pageIndex === 0 ? "Where we played" : "Where we played (continued)"
      }
      title={REPORT_SECTION_TITLES.venues}
      label={label}
    >
      {venues.length === 0 ? (
        <EmptyNote>
          No venues were recorded for this season&apos;s matches.
        </EmptyNote>
      ) : (
        <ul className="grid grid-cols-2 content-start gap-[4mm]">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </ul>
      )}
    </ReportPage>
  ));
}

// ---------------------------------------------------------------------------
// Player Gallery
// ---------------------------------------------------------------------------

/** One card tile, drawn inline: nothing is fetched. */
function GalleryTile({
  entry,
  crestSrc,
}: {
  entry: GalleryEntry;
  crestSrc: string | null;
}) {
  return (
    <li
      className="relative aspect-[4/5] overflow-hidden rounded-[2.2mm] bg-white shadow-[0_0_0_0.25mm_var(--club-line)]"
      aria-label={entry.label}
    >
      <ReportGalleryCard entry={entry} crestSrc={crestSrc} />
    </li>
  );
}

export function galleryPages({ data }: { data: ReportData }): ReactElement[] {
  const label = footerLabel(data);
  const pages = chunkAtLeastOne(galleryEntries(data), GALLERY_CARDS_PER_PAGE);

  return pages.map((rows, pageIndex) => (
    <ReportPage
      key={`gallery-${pageIndex}`}
      kicker={
        pageIndex === 0 ? "Collect the squad" : "Collect the squad (continued)"
      }
      title={REPORT_SECTION_TITLES.gallery}
      label={label}
    >
      {rows.length === 0 ? (
        <EmptyNote>No players or coaches are in the squad.</EmptyNote>
      ) : (
        <ul
          className="grid content-start gap-[4mm]"
          style={{ gridTemplateColumns: `repeat(${GALLERY_COLUMNS}, 1fr)` }}
        >
          {rows.map((entry) => (
            <GalleryTile
              key={entry.id}
              entry={entry}
              crestSrc={data.club.iconUrl}
            />
          ))}
        </ul>
      )}
      <p className="mt-auto pt-[4mm] text-[8pt] text-neutral-500">
        Card stats count league and cup matches only.
      </p>
    </ReportPage>
  ));
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

function Honour({
  title,
  names,
  value,
  unit,
}: {
  title: string;
  names: string[];
  value: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-[3mm] bg-(--club) p-[4.5mm] text-(--club-fg)">
      <p className="text-[7.5pt] font-semibold tracking-[0.2em] uppercase opacity-85">
        {title}
      </p>
      <p className="font-display mt-[3mm] min-h-[12mm] text-[17pt] leading-[1.05] font-semibold uppercase">
        {honourNames(names)}
      </p>
      {value !== null ? (
        <p className="mt-[2mm] text-[9pt] opacity-85">
          {value} {unit}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One whole-season award. With no winner chosen the box prints a blank line to
 * write the name on by hand.
 */
function SeasonAwardBox({
  title,
  winner,
}: {
  title: string;
  winner: string | null;
}) {
  return (
    <div className="flex flex-col rounded-[3mm] border-[0.5mm] border-(--club) bg-white p-[4.5mm]">
      <p className="min-h-[9mm] text-[7.5pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
        {title}
      </p>
      {winner ? (
        <p className="font-display mt-[2mm] text-[19pt] leading-[1.05] font-semibold uppercase">
          {winner}
        </p>
      ) : (
        <div
          className="mt-[2mm] h-[9mm] border-b-[0.4mm] border-dashed border-neutral-400"
          role="img"
          aria-label="Blank line to write the winner"
        />
      )}
    </div>
  );
}

export function RecordsPage({ data }: { data: ReportData }) {
  const label = footerLabel(data);
  const top = (metric: (p: ReportPlayer) => number) =>
    leaders(data.players, metric, 1);
  const scorers = top((p) => p.goals);
  const assisters = top((p) => p.assists);
  const appearances = top((p) => p.appearances);
  const potm = leaders(data.players, (p) => p.playerOfTheMatch, 5);

  return (
    <ReportPage
      kicker="Recognition"
      title={REPORT_SECTION_TITLES.records}
      label={label}
    >
      <div className="grid grid-cols-3 gap-[3.5mm]">
        <Honour
          title="Golden boot"
          names={scorers.map((s) => s.name)}
          value={scorers[0]?.value ?? null}
          unit="goals"
        />
        <Honour
          title="Top playmaker"
          names={assisters.map((s) => s.name)}
          value={assisters[0]?.value ?? null}
          unit="assists"
        />
        <Honour
          title="Most appearances"
          names={appearances.map((s) => s.name)}
          value={appearances[0]?.value ?? null}
          unit="matches"
        />
      </div>

      <div className="mt-[5mm] grid grid-cols-[1fr_1.4fr] gap-[5mm]">
        <Panel>
          <PanelTitle>Player of the match</PanelTitle>
          <LeaderBars
            rows={potm}
            unit="awards"
            emptyText="No awards recorded."
          />
        </Panel>
        <Panel>
          <PanelTitle>Player of the month</PanelTitle>
          {data.monthAwards.length === 0 ? (
            <p className="text-[10pt] text-neutral-500 italic">
              No monthly awards this season.
            </p>
          ) : (
            // Small type: a full season can have nine to twelve awards.
            <ol className="grid grid-cols-2 gap-x-[4mm] gap-y-[2mm]">
              {data.monthAwards.map((a) => (
                <li
                  key={a.month}
                  className="min-w-0 border-l-[0.8mm] border-(--club) pl-[2.5mm]"
                >
                  <p className="text-[6.5pt] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                    {a.monthLabel}
                  </p>
                  <p className="font-display truncate text-[10.5pt] leading-tight font-semibold uppercase">
                    {a.playerName}
                  </p>
                  {a.notes ? (
                    <p className="mt-[0.3mm] line-clamp-1 text-[7pt] leading-snug text-neutral-600">
                      {a.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <section className="mt-[5mm]" aria-label="Awards for the season">
        <div className="grid grid-cols-3 gap-[3.5mm]">
          {SEASON_AWARD_BOXES.map(({ key, title }) => (
            <SeasonAwardBox
              key={key}
              title={title}
              winner={data.content.seasonAwards[key]}
            />
          ))}
        </div>
      </section>

      <section className="mt-[6mm]" aria-label="The coaching team">
        <h3 className="font-display mb-[3.5mm] text-[17pt] leading-none font-semibold text-neutral-900 uppercase">
          Thank you to the coaching team
        </h3>
        {data.staff.length === 0 ? (
          <p className="text-[10pt] text-neutral-500 italic">
            No coaching staff are assigned to this team.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-[3.5mm]">
            {data.staff.slice(0, MAX_STAFF).map((s) => (
              <li
                key={`${s.name}-${s.role}`}
                className="rounded-[3mm] border border-(--club-line) px-[4.5mm] py-[2.5mm]"
              >
                <p className="font-display text-[14pt] leading-none font-semibold uppercase">
                  {s.name}
                </p>
                <p className="mt-[1.4mm] text-[7.5pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
                  {s.role ?? "Coach"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Notes and filler
// ---------------------------------------------------------------------------

export function AutographsPage({ data }: { data: ReportData }) {
  return (
    <ReportPage
      kicker="Collect them all"
      title={REPORT_SECTION_TITLES.autographs}
      label={footerLabel(data)}
    >
      <p className="mb-[5mm] max-w-[120mm] text-[10.5pt] leading-relaxed text-neutral-600">
        Pass the book around the team and get your team mates to sign.
      </p>
      {/* Deliberately blank: this is the space to sign. */}
      <div
        className="min-h-0 flex-1 rounded-[7mm] border-[0.5mm] border-(--club) bg-white"
        role="img"
        aria-label="Blank space for autographs"
      />
    </ReportPage>
  );
}

/** Ruled lines on the Notes page: more than fit, the box clips the rest. */
export const NOTES_LINE_COUNT = 30;

export function NotesPage({ data }: { data: ReportData }) {
  return (
    <ReportPage kicker="Your space" title="Notes" label={footerLabel(data)}>
      <div
        className="min-h-0 flex-1 overflow-hidden rounded-[7mm] border-[0.5mm] border-(--club) bg-white px-[6mm] pt-[3mm]"
        role="img"
        aria-label="Lined pages for notes"
      >
        {Array.from({ length: NOTES_LINE_COUNT }, (_, i) => (
          <div
            key={i}
            data-notes-line=""
            className="h-[9.5mm] border-b-[0.3mm] border-(--club-line)"
          />
        ))}
      </div>
    </ReportPage>
  );
}
