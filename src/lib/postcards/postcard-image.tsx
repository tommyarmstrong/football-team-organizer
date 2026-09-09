import type { CSSProperties, ReactNode } from "react";
import type { MatchPostcardPayload } from "@/lib/postcards/types";

export const POSTCARD_WIDTH = 1080;
export const POSTCARD_HEIGHT = 1350;

const PITCH_DEEP = "#143328";
const BACKGROUND = "#F6FAF4";
const INK = "#183B2B";
const MUTED = "#537261";
const PITCH_LINE = "#146C4A";
const PAPER = "#F4FBF5";
const WIN_BG = "#1B7A4A";
const WIN_FG = "#F4FFF8";
const DRAW_BG = "#E8C44A";
const DRAW_FG = "#3D2E0A";
const LOSS_BG = "#C4452B";
const LOSS_FG = "#FFF5F3";

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
        opacity: 0.08,
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

function GoalRows({ payload }: { payload: MatchPostcardPayload }): ReactNode {
  const list = payload.goalList;
  if (list.kind === "none") return null;

  if (list.kind === "summary") {
    return (
      <div style={stackStyle({ marginBottom: 32 })}>
        <div style={{ fontSize: 34, color: INK, lineHeight: 1.35 }}>
          {`⚽ ${list.text}`}
        </div>
        {list.extra ? (
          <div style={{ fontSize: 30, color: MUTED, marginTop: 6 }}>
            {list.extra}
          </div>
        ) : null}
      </div>
    );
  }

  const fontSize = list.kind === "full" ? 36 : 31;
  const rows = list.rows.map((row, index) => (
    <div
      key={`${row.label}-${index}`}
      style={{
        display: "flex",
        alignItems: "center",
        fontSize,
        color: INK,
        marginBottom: list.kind === "full" ? 12 : 7,
      }}
    >
      <div style={{ marginRight: 12 }}>⚽</div>
      <div style={ellipsisStyle({ maxWidth: 500, fontWeight: 700 })}>
        {`${row.label}${row.isPenalty ? " (P)" : ""}`}
      </div>
      {row.assistLabel ? (
        <>
          <div style={{ marginLeft: 18, marginRight: 12 }}>🤝</div>
          <div style={ellipsisStyle({ maxWidth: 360 })}>{row.assistLabel}</div>
        </>
      ) : null}
    </div>
  ));

  return <div style={stackStyle({ marginBottom: 32 })}>{rows}</div>;
}

export function MatchPostcardImage({
  payload,
  crestSrc,
}: {
  payload: MatchPostcardPayload;
  crestSrc: string | null;
}) {
  const masthead = payload.clubColour ?? PITCH_DEEP;
  const mastheadInk = contrastingInk(masthead);
  const scoreColors = resultColors(payload.result);
  const hasPotm = Boolean(payload.coachPotmLabel || payload.playersPotmLabel);
  const clubInitial = (payload.clubName.trim()[0] ?? "F").toUpperCase();

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 10,
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
            <div style={ellipsisStyle({ fontSize: 40, fontWeight: 700 })}>
              {payload.homeName}
            </div>
          </div>
          <div
            style={{
              backgroundColor: scoreColors.bg,
              color: scoreColors.fg,
              fontSize: 82,
              fontWeight: 700,
              padding: "12px 22px",
              borderRadius: 18,
              letterSpacing: -2,
            }}
          >
            {payload.scoreLabel}
          </div>
          <div style={{ flex: 1, display: "flex", paddingLeft: 20 }}>
            <div style={ellipsisStyle({ fontSize: 40, fontWeight: 700 })}>
              {payload.awayName}
            </div>
          </div>
        </div>
        <div
          style={centredStyle({
            fontSize: 29,
            color: MUTED,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 2,
          })}
        >
          {payload.homeAwayLabel}
        </div>
        {payload.competitionLabel ? (
          <div
            style={centredStyle({
              fontSize: 32,
              color: INK,
              fontWeight: 700,
              marginBottom: 7,
            })}
          >
            {payload.competitionLabel}
          </div>
        ) : null}
        <div
          style={centredStyle({
            fontSize: 29,
            color: MUTED,
            marginBottom: 28,
          })}
        >
          {payload.dateLabel}
        </div>

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
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 32,
                  marginBottom: 13,
                }}
              >
                <div style={{ color: INK, fontWeight: 700 }}>
                  {"🏆 Coach's Player of the Match"}
                </div>
                <div style={ellipsisStyle({ maxWidth: 380 })}>
                  {payload.coachPotmLabel}
                </div>
              </div>
            ) : null}
            {payload.playersPotmLabel ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 32,
                }}
              >
                <div style={{ color: INK, fontWeight: 700 }}>
                  {"🏆 Players' Player of the Match"}
                </div>
                <div style={ellipsisStyle({ maxWidth: 380 })}>
                  {payload.playersPotmLabel}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {payload.form.length > 0 ? (
          <div
            style={stackStyle({
              marginTop: 28,
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
              {payload.form.map((letter, index) => (
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
    </div>
  );
}
