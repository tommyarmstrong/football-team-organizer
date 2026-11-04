import type { ReactElement } from "react";
import { formatShortDate } from "@/lib/format";
import {
  GALLERY_CARDS_PER_PAGE,
  GALLERY_COLUMNS,
} from "@/lib/report/card-path";
import { chunkAtLeastOne, splitMarkdownPages } from "@/lib/report/paginate";
import { REPORT_SECTION_TITLES } from "@/lib/report/sections";
import {
  biggestWin,
  cleanSheets,
  honourNames,
  goalTotals,
  leaders,
  longestUnbeaten,
  perMatch,
  sortSquad,
  tally,
  winPercentage,
} from "@/lib/report/summary";
import type {
  ReportCompetition,
  ReportData,
  ReportMatch,
  ReportPlayer,
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
import { ReportCardImage } from "@/components/report/report-cards";
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

          {data.team.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.team.photoUrl}
              alt={`${data.team.name} team photo`}
              className="mt-auto h-[84mm] w-full rounded-[3.5mm] border-[1.2mm] border-white object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
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
            To every player, parent, guardian and volunteer who made{" "}
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
  const { matches } = data;
  const t = tally(matches);
  const goals = goalTotals(matches);

  if (matches.length === 0) {
    return (
      <ReportPage
        kicker={`Season ${data.team.seasonLabel}`}
        title={REPORT_SECTION_TITLES.glance}
        label={label}
      >
        <EmptyNote>No matches have been played yet.</EmptyNote>
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
        <StatTile value={goals.goalsFor} label="Goals scored" />
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
        <PanelTitle>Form · every match, in order</PanelTitle>
        <FormStrip matches={matches} />
      </Panel>

      <Panel className="mt-[5mm]">
        <PanelTitle>
          Points through the season · 3 for a win, 1 for a draw
        </PanelTitle>
        <PointsTrend matches={matches} />
      </Panel>
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------

function ScoreChip({ match }: { match: ReportMatch }) {
  return (
    <span
      className="font-display inline-flex h-[8.5mm] w-[22mm] items-center justify-center rounded-[2mm] text-[15pt] leading-none font-semibold"
      style={{
        backgroundColor: RESULT_COLOURS[match.result],
        color: match.result === "D" ? "#2b2205" : "#fff",
      }}
    >
      {match.goalsFor}–{match.goalsAgainst}
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
      <p className="mt-auto pt-[4mm] text-[8pt] text-neutral-500">
        H home · A away · N neutral. Score shown as ours first.
      </p>
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
        <PanelTitle>Goals in every match</PanelTitle>
        {data.matches.length === 0 ? (
          <p className="text-[10pt] text-neutral-500 italic">No matches yet.</p>
        ) : (
          <>
            <GoalsPerMatch matches={data.matches} />
            <p className="mt-[2mm] text-[8pt] text-neutral-500">
              Numbered in date order, matching the Results pages.
            </p>
          </>
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
      kicker="League, cups and tournaments"
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
// Player Gallery
// ---------------------------------------------------------------------------

/**
 * A placeholder card in the same 4:5 shape. It sits behind the real card
 * image, so it only shows when the image is missing (sample data without a
 * card route, or a card that failed to render). Always first name only.
 */
function CardPlaceholder({ player }: { player: ReportPlayer }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-(--club) text-(--club-fg)">
      <div className="flex items-start justify-between p-[3mm]">
        <span
          className="size-[7mm] rounded-full bg-white/90"
          aria-hidden="true"
        />
        {player.shirtNumber !== null ? (
          <span className="font-display flex size-[9mm] items-center justify-center rounded-full bg-(--club-deep) text-[13pt] font-semibold text-white">
            {player.shirtNumber}
          </span>
        ) : null}
      </div>
      <div className="mt-auto bg-(--club-deep) px-[2mm] py-[3mm] text-center text-white">
        <p className="font-display truncate text-[14pt] leading-none font-semibold uppercase">
          {player.firstName}
        </p>
        {player.position ? (
          <p className="mt-[1mm] text-[6pt] tracking-[0.2em] uppercase opacity-80">
            {player.position}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PlayerCardTile({ player }: { player: ReportPlayer }) {
  return (
    <li
      className="relative aspect-[4/5] overflow-hidden rounded-[2.2mm] bg-white shadow-[0_0_0_0.25mm_var(--club-line)]"
      aria-label={player.name}
    >
      <CardPlaceholder player={player} />
      {/* The real card, from the same route as "Share player card". */}
      {player.cardUrl ? <ReportCardImage url={player.cardUrl} /> : null}
    </li>
  );
}

export function galleryPages({ data }: { data: ReportData }): ReactElement[] {
  const label = footerLabel(data);
  const pages = chunkAtLeastOne(
    sortSquad(data.players),
    GALLERY_CARDS_PER_PAGE,
  );

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
        <EmptyNote>No players are in the squad.</EmptyNote>
      ) : (
        <ul
          className="grid gap-[4mm]"
          style={{ gridTemplateColumns: `repeat(${GALLERY_COLUMNS}, 1fr)` }}
        >
          {rows.map((p) => (
            <PlayerCardTile key={p.id} player={p} />
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

export function AwardsPage({ data }: { data: ReportData }) {
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
      title={REPORT_SECTION_TITLES.awards}
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
            <ol className="space-y-[3.2mm]">
              {data.monthAwards.map((a) => (
                <li
                  key={a.month}
                  className="border-l-[1mm] border-(--club) pl-[3.5mm]"
                >
                  <p className="text-[7.5pt] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                    {a.monthLabel}
                  </p>
                  <p className="font-display text-[15pt] leading-tight font-semibold uppercase">
                    {a.playerName}
                  </p>
                  {a.notes ? (
                    <p className="mt-[0.5mm] text-[9pt] text-neutral-600">
                      {a.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <section className="mt-[8mm]" aria-label="The coaching team">
        <h3 className="font-display mb-[3.5mm] text-[17pt] leading-none font-semibold text-neutral-900 uppercase">
          Thank you to the coaching team
        </h3>
        {data.staff.length === 0 ? (
          <p className="text-[10pt] text-neutral-500 italic">
            No coaching staff are assigned to this team.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-[3.5mm]">
            {data.staff.slice(0, MAX_STAFF).map((s) => (
              <li
                key={`${s.name}-${s.role}`}
                className="rounded-[3mm] border border-(--club-line) px-[4.5mm] py-[3.5mm]"
              >
                <p className="font-display text-[16pt] leading-none font-semibold uppercase">
                  {s.name}
                </p>
                <p className="mt-[1.8mm] text-[8pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
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

export function NotesPage({ data }: { data: ReportData }) {
  return (
    <ReportPage kicker="Your space" title="Notes" label={footerLabel(data)}>
      <div
        className="min-h-0 flex-1 rounded-[3mm] border border-(--club-line)"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 9.2mm, var(--club-line) 9.2mm, var(--club-line) 9.5mm)",
        }}
      />
    </ReportPage>
  );
}
