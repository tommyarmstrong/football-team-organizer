import type { CSSProperties, ReactNode } from "react";
import {
  postcardPotmLine,
  SCHEDULED_POSTCARD_TBC,
  scheduledPostcardKickoffText,
  scheduledPostcardMeetupLine,
  scheduledPostcardVenueLabel,
} from "@/lib/postcards/content";
import type { MatchPostcardPayload } from "@/lib/postcards/types";

export const POSTCARD_WIDTH = 1080;
export const POSTCARD_HEIGHT = 1350;

/** Same dark page and light ink as the app (`--background`, `--foreground`). */
export const POSTCARD_BACKGROUND = "#181c1d";
export const POSTCARD_INK = "#f5f7f6";
/** Team names sit larger than the score box beside them. */
export const POSTCARD_TEAM_NAME_FONT_SIZE = 50;
export const POSTCARD_SCORE_FONT_SIZE = 40;
/** Scorers and award lines share one size. Icons are a step smaller. */
export const POSTCARD_DETAIL_FONT_SIZE = 32;
export const POSTCARD_ICON_FONT_SIZE = 20;
/** One column until a longer list would crowd the card. */
export const POSTCARD_GOAL_SINGLE_COLUMN_MAX = 4;

const PITCH_DEEP = "#143328";
const BACKGROUND = POSTCARD_BACKGROUND;
const INK = POSTCARD_INK;
const MUTED = "#a9b5b2";
const PITCH_LINE = "#A9B5B2";
const PAPER = "#F4FBF5";
const WIN_BG = "#36dd52";
const WIN_FG = "#101414";
const DRAW_BG = "#ffd12b";
const DRAW_FG = "#101414";
const LOSS_BG = "#ff5555";
const LOSS_FG = "#101414";

export function postcardGoalColumnCount(rowCount: number): 1 | 2 {
  return rowCount > POSTCARD_GOAL_SINGLE_COLUMN_MAX ? 2 : 1;
}

export function splitPostcardGoalRows<T>(rows: readonly T[]): T[][] {
  if (postcardGoalColumnCount(rows.length) === 1) return [[...rows]];
  const mid = Math.ceil(rows.length / 2);
  return [rows.slice(0, mid), rows.slice(mid)];
}

function luminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function contrastingInk(hex: string): string {
  return luminance(hex) > 0.55 ? PITCH_DEEP : PAPER;
}

function resultColors(result: "W" | "D" | "L"): { bg: string; fg: string } {
  if (result === "W") return { bg: WIN_BG, fg: WIN_FG };
  if (result === "D") return { bg: DRAW_BG, fg: DRAW_FG };
  return { bg: LOSS_BG, fg: LOSS_FG };
}

function ellipsisStyle(extra?: CSSProperties): CSSProperties {
  return {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ...extra,
  };
}

/**
 * Satori refuses to lay out a div with more than one child unless `display` is
 * set explicitly, so every stacking wrapper below declares a column flexbox.
 */
function stackStyle(extra?: CSSProperties): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    ...extra,
  };
}

/** Satori ignores `text-align`, so centred lines need flex centring instead. */
function centredStyle(extra?: CSSProperties): CSSProperties {
  return {
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
    ...extra,
  };
}

/**
 * Twemoji 👟 paths with the red upper recast as white. ImageResponse can only
 * pick one emoji set for the whole card, so this keeps the red alarm clock.
 */
function WhiteTrainerMark() {
  return (
    <svg width={40} height={40} viewBox="0 0 36 36" aria-hidden="true">
      <path
        fill="#8899A6"
        d="M24.161 10.166l-.676-2.034c-.134-.302-.49-.43-.781-.275-.918.487-2.944 1.318-3.684 1.575 1.419.505 3.499 1.503 4.511 1.396.384-.04.787-.308.63-.662zm10.21 24.574c-.399.225-6.509 1.692-18.621-8.906C12.083 22.625 1.2 12.879 1.341 12.547c0 0-.329.36-.602.736-.197.271-.319.559-.274.848.31 1.967 3.112 3.819 6.962 6.781l.549.422.363.279c.588.452 2.316 1.815 4.329 3.403 2.753 2.171 8.284 6.49 8.445 6.61 2.12 1.574 4.635 2.817 7.667 3.672 3.838 1.081 5.591-.558 5.591-.558z"
      />
      <path
        fill="#FFFFFF"
        stroke="#C5D0C8"
        strokeWidth={0.4}
        d="M34.371 34.74s.477-.219.97-.918c.493-.699.79-1.924.045-3.248-.745-1.323-3.456-5.121-4.345-6.671-.433-.755-.297-1.447-1.125-2.835 0 0-3.164-5.523-3.864-6.723-1.497-2.567-.84-3.902-1.837-4.668-.665-.511-7.306.166-9.327-1.389-1.397-1.074-1.418-4.428-2.003-5.526-.466-.875-2.02-.475-3.087.11S5.825 6.661 5.123 7.574s-1.601 1.909-1.679 2.928l-.079 1.018S19.226 26.67 23.74 29.726c7.697 5.211 10.631 5.014 10.631 5.014z"
      />
      <path
        fill="#E8E8E8"
        d="M24.74 10.464c-.103-.314-.249-.575-.525-.788-.665-.511-7.306.167-9.327-1.389-1.397-1.074-1.418-4.429-2.003-5.526-.182-.341-.532-.485-.952-.502.69 1.4.621 5.574 2.312 6.874 2.038 1.569 8.016 1.133 10.495 1.331z"
      />
      <path
        fill="#F4F4F4"
        d="M13.265 17.873c.505-1.472 1.044-4.915.074-6.962-.909-1.917-4.441-5.955-5.112-6.72C6.987 5.296 5.33 7.229 4.83 7.879c-.66.858-1.455 1.822-1.494 2.801-.014.352.087.51.087.51s9.822 6.741 9.842 6.683z"
      />
      <path
        fill="#CCD6DD"
        d="M23.107 14.256c-.335 0-.65-.202-.78-.533-.169-.431.043-.917.474-1.087l1.823-.715c.43-.167.919.043 1.087.475.169.431-.043.917-.474 1.087l-1.823.715c-.101.039-.204.058-.307.058zm1.347 3.063c-.291 0-.573-.151-.728-.421-.231-.401-.093-.914.309-1.145l1.793-1.031c.402-.231.915-.092 1.145.309.231.401.093.914-.309 1.145l-1.793 1.031c-.132.076-.275.112-.417.112zm1.821 2.752c-.256 0-.509-.117-.673-.338-.277-.371-.2-.896.171-1.173l1.514-1.129c.371-.277.897-.201 1.173.171.277.372.2.897-.171 1.174l-1.514 1.128c-.15.113-.326.167-.5.167zm1.945 2.571c-.242 0-.482-.104-.648-.307-.294-.358-.241-.887.116-1.181l1.155-.948c.357-.293.887-.242 1.181.116s.241.887-.116 1.181l-1.155.948c-.157.128-.346.191-.533.191zM3.2 10.76s.675.612 1.425.726c.75.114 2.079.95 2.993 1.653.914.703 4.399 3.292 6.534 5.444s5.495 6.58 6.801 7.863c1.306 1.282 3.413 3.193 5.214 4.347s3.455 2.131 4.516 2.686c1.368.716 2.632 1.144 3.688 1.261-.368.216-2.313.946-5.69-.205-3.228-1.101-5.332-2.294-7.071-3.586-1.739-1.292-11.208-8.808-12.759-10.001-1.551-1.193-6.188-4.728-6.92-5.787-1.04-1.504-.99-2.162-.788-2.424.492-.641 1.531-2.382 2.057-1.977z"
      />
      <path
        fill="#F4F4F4"
        d="M35.386 30.574c-.745-1.323-3.456-5.121-4.345-6.671-.174-.304-.257-.599-.347-.931-.091.034-.189.054-.269.109-1.154.792-1.148 3.185.571 5.687 1.378 2.006 3.59 3.552 4.832 3.576.026-.538-.088-1.142-.442-1.77z"
      />
    </svg>
  );
}

function FormBox({
  letter,
  colors,
}: {
  letter: "W" | "D" | "L";
  colors: { bg: string; fg: string };
}) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        marginRight: 10,
        borderRadius: 12,
        backgroundColor: colors.bg,
        color: colors.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
        fontWeight: 700,
      }}
    >
      {letter}
    </div>
  );
}

/** The same low-contrast pitch motif used behind the app shell. */
function PitchLines() {
  return (
    <svg
      width={1080}
      height={1190}
      viewBox="0 0 1080 1190"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        color: PITCH_LINE,
        opacity: 0.45,
      }}
    >
      <rect
        x="42"
        y="38"
        width="996"
        height="1114"
        rx="16"
        stroke="currentColor"
        strokeWidth="5"
      />
      <line
        x1="42"
        y1="595"
        x2="1038"
        y2="595"
        stroke="currentColor"
        strokeWidth="5"
      />
      <circle cx="540" cy="595" r="138" stroke="currentColor" strokeWidth="5" />
      <circle cx="540" cy="595" r="8" fill="currentColor" />
      <rect
        x="302"
        y="38"
        width="476"
        height="176"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="408"
        y="38"
        width="264"
        height="76"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M420 214a138 138 0 0 0 240 0"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="302"
        y="976"
        width="476"
        height="176"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="408"
        y="1076"
        width="264"
        height="76"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M420 976a138 138 0 0 1 240 0"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}

function ClubMasthead({
  payload,
  crestSrc,
}: {
  payload: MatchPostcardPayload;
  crestSrc: string | null;
}) {
  const masthead = payload.clubColour ?? PITCH_DEEP;
  const mastheadInk = contrastingInk(masthead);
  const clubInitial = (payload.clubName.trim()[0] ?? "F").toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: masthead,
        color: mastheadInk,
        padding: "34px 48px",
      }}
    >
      {crestSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={crestSrc}
          width={84}
          height={84}
          alt=""
          style={{
            width: 84,
            height: 84,
            borderRadius: 18,
            objectFit: "cover",
            marginRight: 20,
          }}
        />
      ) : (
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 18,
            backgroundColor: mastheadInk,
            color: masthead,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 700,
            marginRight: 20,
          }}
        >
          {clubInitial}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={ellipsisStyle({
            fontSize: 36,
            fontWeight: 700,
            maxWidth: 860,
          })}
        >
          {payload.clubName}
        </div>
        <div
          style={ellipsisStyle({
            fontSize: 29,
            marginTop: 4,
            maxWidth: 860,
            opacity: 0.9,
          })}
        >
          {`${payload.teamName} · ${payload.seasonLabel}`}
        </div>
      </div>
    </div>
  );
}

function ScoreboardNames({
  homeName,
  awayName,
  centre,
}: {
  homeName: string;
  awayName: string;
  centre: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          paddingRight: 20,
        }}
      >
        <div
          data-slot="postcard-team-name"
          style={ellipsisStyle({
            fontSize: POSTCARD_TEAM_NAME_FONT_SIZE,
            fontWeight: 700,
          })}
        >
          {homeName}
        </div>
      </div>
      {centre}
      <div style={{ flex: 1, display: "flex", paddingLeft: 20 }}>
        <div
          data-slot="postcard-team-name"
          style={ellipsisStyle({
            fontSize: POSTCARD_TEAM_NAME_FONT_SIZE,
            fontWeight: 700,
          })}
        >
          {awayName}
        </div>
      </div>
    </div>
  );
}

function PostcardDate({ dateLabel }: { dateLabel: string }) {
  return (
    <div
      data-slot="postcard-date"
      style={centredStyle({
        fontSize: 29,
        color: MUTED,
        marginBottom: 16,
      })}
    >
      {dateLabel}
    </div>
  );
}

function CompetitionLine({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <div
      style={centredStyle({
        fontSize: 32,
        color: INK,
        fontWeight: 700,
        marginBottom: 16,
      })}
    >
      {label}
    </div>
  );
}

function PostcardIcon({
  glyph,
  gapBefore = 0,
}: {
  glyph: string;
  gapBefore?: number;
}) {
  return (
    <div
      data-slot="postcard-icon"
      style={{
        display: "flex",
        fontSize: POSTCARD_ICON_FONT_SIZE,
        lineHeight: 1,
        marginLeft: gapBefore,
        marginRight: 8,
      }}
    >
      {glyph}
    </div>
  );
}

function GoalLine({
  row,
  nameWidth,
}: {
  row: {
    label: string;
    isPenalty: boolean;
    assistLabel: string | null;
  };
  nameWidth: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: INK,
        marginBottom: 10,
      }}
    >
      <PostcardIcon glyph="⚽" />
      <div
        data-slot="postcard-goal-label"
        style={ellipsisStyle({
          maxWidth: nameWidth,
          fontSize: POSTCARD_DETAIL_FONT_SIZE,
          fontWeight: 700,
        })}
      >
        {`${row.label}${row.isPenalty ? " (P)" : ""}`}
      </div>
      {row.assistLabel ? (
        <>
          <PostcardIcon glyph="🤝" gapBefore={10} />
          <div
            style={ellipsisStyle({
              maxWidth: nameWidth,
              fontSize: POSTCARD_DETAIL_FONT_SIZE,
            })}
          >
            {row.assistLabel}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GoalRows({
  payload,
}: {
  payload: Extract<MatchPostcardPayload, { kind: "played" }>;
}): ReactNode {
  const list = payload.goalList;
  if (list.kind === "none") return null;

  if (list.kind === "summary") {
    return (
      <div style={stackStyle({ marginBottom: 32 })}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <PostcardIcon glyph="⚽" />
          <div
            data-slot="postcard-goal-label"
            style={{
              fontSize: POSTCARD_DETAIL_FONT_SIZE,
              color: INK,
              lineHeight: 1.35,
            }}
          >
            {list.text}
          </div>
        </div>
        {list.extra ? (
          <div style={{ fontSize: 30, color: MUTED, marginTop: 6 }}>
            {list.extra}
          </div>
        ) : null}
      </div>
    );
  }

  const columns = splitPostcardGoalRows(list.rows);
  const twoColumns = columns.length === 2;
  const nameWidth = twoColumns ? 160 : 420;

  return (
    <div
      data-slot="postcard-goals"
      data-columns={columns.length}
      style={{
        display: "flex",
        width: "100%",
        marginBottom: 32,
      }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          style={stackStyle({
            width: twoColumns ? "50%" : "100%",
            paddingRight: twoColumns && columnIndex === 0 ? 12 : 0,
          })}
        >
          {column.map((row, index) => (
            <GoalLine
              key={`${row.label}-${index}`}
              row={row}
              nameWidth={nameWidth}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function AwardLine({ label }: { label: string }) {
  const text = label.replace(/^🏆\s*/, "");
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 0 }}>
      <PostcardIcon glyph="🏆" />
      <div
        data-slot="postcard-award"
        style={ellipsisStyle({
          fontSize: POSTCARD_DETAIL_FONT_SIZE,
          fontWeight: 700,
          maxWidth: 920,
        })}
      >
        {text}
      </div>
    </div>
  );
}

function PlayedPostcardBody({
  payload,
}: {
  payload: Extract<MatchPostcardPayload, { kind: "played" }>;
}) {
  const scoreColors = resultColors(payload.result);
  const hasPotm = Boolean(payload.coachPotmLabel || payload.playersPotmLabel);

  return (
    <div style={stackStyle({ width: "100%" })}>
      <PostcardDate dateLabel={payload.dateLabel} />
      <ScoreboardNames
        homeName={payload.homeName}
        awayName={payload.awayName}
        centre={
          <div
            data-slot="postcard-score"
            style={{
              backgroundColor: scoreColors.bg,
              color: scoreColors.fg,
              fontSize: POSTCARD_SCORE_FONT_SIZE,
              fontWeight: 700,
              padding: "2px 12px",
              borderRadius: 10,
              letterSpacing: -1,
            }}
          >
            {payload.scoreLabel}
          </div>
        }
      />
      <CompetitionLine label={payload.competitionLabel} />

      <div
        style={centredStyle({
          fontSize: 42,
          fontWeight: 700,
          marginBottom: 34,
          lineHeight: 1.25,
          paddingLeft: 40,
          paddingRight: 40,
        })}
      >
        {payload.story}
      </div>

      <GoalRows payload={payload} />

      {hasPotm ? (
        <div style={stackStyle({ marginBottom: 28 })}>
          {payload.coachPotmLabel ? (
            <div
              style={{
                display: "flex",
                marginBottom: payload.playersPotmLabel ? 13 : 0,
              }}
            >
              <AwardLine
                label={postcardPotmLine(payload.coachPotmLabel, "coach")}
              />
            </div>
          ) : null}
          {payload.playersPotmLabel ? (
            <div style={{ display: "flex" }}>
              <AwardLine
                label={postcardPotmLine(payload.playersPotmLabel, "players")}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <PostcardSquadAndForm
        squadLines={payload.squadLines}
        form={payload.form}
      />
    </div>
  );
}

function PostcardSquadAndForm({
  squadLines,
  form,
  marginTop = 0,
}: {
  squadLines: string[];
  form: Array<"W" | "D" | "L">;
  /** Gap above the block. Played cards already separate this from the awards. */
  marginTop?: number;
}) {
  const squadMarginTop = squadLines.length > 0 ? marginTop : 0;
  const formMarginTop = squadLines.length > 0 ? 28 : Math.max(marginTop, 28);
  if (squadLines.length === 0 && form.length === 0) return null;

  return (
    <div style={stackStyle({ width: "100%" })}>
      {squadLines.length > 0 ? (
        <div
          style={stackStyle({
            alignItems: "center",
            marginBottom: 10,
            marginTop: squadMarginTop,
          })}
        >
          <div
            style={{
              fontSize: 30,
              color: MUTED,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Matchday Squad
          </div>
          {squadLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={centredStyle({
                width: "100%",
                fontSize: 30,
                color: INK,
                lineHeight: 1.35,
              })}
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {form.length > 0 ? (
        <div
          style={stackStyle({
            marginTop: formMarginTop,
            alignItems: "center",
          })}
        >
          <div
            style={{
              fontSize: 30,
              color: MUTED,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Form
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {form.map((letter, index) => (
              <FormBox
                key={`${letter}-${index}`}
                letter={letter}
                colors={resultColors(letter)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScheduledPostcardBody({
  payload,
}: {
  payload: Extract<MatchPostcardPayload, { kind: "scheduled" }>;
}) {
  return (
    <div style={stackStyle({ width: "100%" })}>
      <PostcardDate
        dateLabel={payload.dateLabel.trim() || SCHEDULED_POSTCARD_TBC}
      />
      <ScoreboardNames
        homeName={payload.homeName}
        awayName={payload.awayName}
        centre={
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: 6,
              color: MUTED,
              padding: "4px 12px",
            }}
          >
            VS
          </div>
        }
      />
      <CompetitionLine label={payload.competitionLabel} />

      <div
        style={centredStyle({
          fontSize: 32,
          color: INK,
          fontWeight: 700,
          marginBottom: 8,
        })}
      >
        {scheduledPostcardMeetupLine(
          payload.meetupLabel.trim() || SCHEDULED_POSTCARD_TBC,
        )}
      </div>
      <div
        style={centredStyle({
          fontSize: 32,
          color: INK,
          fontWeight: 700,
          marginBottom: 28,
          alignItems: "center",
          gap: 10,
        })}
      >
        <WhiteTrainerMark />
        {scheduledPostcardKickoffText(
          payload.kickoffLabel.trim() || SCHEDULED_POSTCARD_TBC,
        )}
      </div>

      <div
        style={stackStyle({
          alignItems: "center",
          marginTop: 8,
        })}
      >
        <div
          style={{
            fontSize: 30,
            color: MUTED,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Venue
        </div>
        <div
          style={centredStyle({
            fontSize: 34,
            fontWeight: 700,
            color: INK,
            marginBottom: payload.venueAddress ? 8 : 0,
            maxWidth: 984,
          })}
        >
          {scheduledPostcardVenueLabel(payload.venueName)}
        </div>
        {payload.venueAddress ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 29,
                color: MUTED,
                width: 900,
                lineHeight: 1.35,
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {`📍 ${payload.venueAddress}`}
            </div>
          </div>
        ) : null}
      </div>

      <PostcardSquadAndForm
        squadLines={payload.squadLines}
        form={payload.form}
        marginTop={28}
      />
    </div>
  );
}

export function MatchPostcardImage({
  payload,
  crestSrc,
}: {
  payload: MatchPostcardPayload;
  crestSrc: string | null;
}) {
  return (
    <div
      style={{
        width: POSTCARD_WIDTH,
        height: POSTCARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: BACKGROUND,
        color: INK,
        fontFamily: "sans-serif",
      }}
    >
      <ClubMasthead payload={payload} crestSrc={crestSrc} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: "34px 48px 42px",
          flex: 1,
          backgroundColor: BACKGROUND,
        }}
      >
        <PitchLines />
        {payload.kind === "scheduled" ? (
          <ScheduledPostcardBody payload={payload} />
        ) : (
          <PlayedPostcardBody payload={payload} />
        )}
      </div>
    </div>
  );
}
