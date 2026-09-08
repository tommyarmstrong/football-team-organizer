import type { CSSProperties, ReactNode } from "react";
import type { MatchPostcardPayload } from "@/lib/postcards/types";

export const POSTCARD_WIDTH = 1080;
export const POSTCARD_HEIGHT = 1350;

const PITCH_DEEP = "#143328";
const PAPER = "#F4FBF5";
const MUTED = "#D7E8DA";
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
        width: 48,
        height: 48,
        marginRight: 8,
        borderRadius: 10,
        backgroundColor: colors.bg,
        color: colors.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      {letter}
    </div>
  );
}

function GoalRows({ payload }: { payload: MatchPostcardPayload }): ReactNode {
  const list = payload.goalList;
  if (list.kind === "none") return null;

  const heading = (
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: MUTED,
        marginBottom: 12,
      }}
    >
      Goals
    </div>
  );

  if (list.kind === "summary") {
    return (
      <div style={{ marginBottom: 28 }}>
        {heading}
        <div style={{ fontSize: 24, color: PAPER, lineHeight: 1.35 }}>
          {list.text}
        </div>
        {list.extra ? (
          <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>
            {list.extra}
          </div>
        ) : null}
      </div>
    );
  }

  const rows =
    list.kind === "full"
      ? list.rows.map((row, index) => (
          <div key={`${row.label}-${index}`} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 24,
                color: PAPER,
              }}
            >
              <div style={ellipsisStyle({ maxWidth: 640, marginRight: 16 })}>
                {row.label}
              </div>
              {row.detail ? (
                <div style={{ color: MUTED, flexShrink: 0 }}>{row.detail}</div>
              ) : null}
            </div>
            {row.assistLabel ? (
              <div
                style={{
                  fontSize: 24,
                  color: MUTED,
                  marginLeft: 24,
                  marginTop: 2,
                }}
              >
                {row.assistLabel}
              </div>
            ) : null}
          </div>
        ))
      : list.rows.map((row, index) => (
          <div key={`${row.label}-${index}`} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 24,
                color: PAPER,
              }}
            >
              <div style={ellipsisStyle({ maxWidth: 640, marginRight: 16 })}>
                {row.label}
              </div>
              {row.detail ? (
                <div style={{ color: MUTED, flexShrink: 0 }}>{row.detail}</div>
              ) : null}
            </div>
          </div>
        ));

  return (
    <div style={{ marginBottom: 28 }}>
      {heading}
      {rows}
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
  const masthead = payload.clubColour ?? PITCH_DEEP;
  const mastheadInk = contrastingInk(masthead);
  const scoreColors = resultColors(payload.result);
  const context = [payload.competitionLabel, payload.dateLabel]
    .filter(Boolean)
    .join(" · ");
  const hasPotm = Boolean(payload.coachPotmLabel || payload.playersPotmLabel);
  const clubInitial = (payload.clubName.trim()[0] ?? "F").toUpperCase();

  return (
    <div
      style={{
        width: POSTCARD_WIDTH,
        height: POSTCARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: PITCH_DEEP,
        color: PAPER,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: masthead,
          color: mastheadInk,
          padding: "40px 48px",
        }}
      >
        {crestSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={crestSrc}
            width={72}
            height={72}
            alt=""
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              objectFit: "cover",
              marginRight: 20,
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: mastheadInk,
              color: masthead,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
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
              fontSize: 28,
              fontWeight: 700,
              maxWidth: 860,
            })}
          >
            {payload.clubName}
          </div>
          <div
            style={ellipsisStyle({
              fontSize: 24,
              marginTop: 4,
              maxWidth: 860,
              opacity: 0.9,
            })}
          >
            {payload.teamName} · {payload.seasonLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "40px 48px 48px",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={ellipsisStyle({
              flex: 1,
              textAlign: "right",
              fontSize: 32,
              fontWeight: 700,
              paddingRight: 20,
            })}
          >
            {payload.homeName}
          </div>
          <div
            style={{
              backgroundColor: scoreColors.bg,
              color: scoreColors.fg,
              fontSize: 72,
              fontWeight: 700,
              padding: "12px 22px",
              borderRadius: 18,
              letterSpacing: -2,
            }}
          >
            {payload.scoreLabel}
          </div>
          <div
            style={ellipsisStyle({
              flex: 1,
              fontSize: 32,
              fontWeight: 700,
              paddingLeft: 20,
            })}
          >
            {payload.awayName}
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: MUTED,
            textAlign: "center",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {payload.homeAwayLabel}
        </div>
        {context ? (
          <div
            style={{
              fontSize: 24,
              color: MUTED,
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            {context}
          </div>
        ) : (
          <div style={{ height: 28 }} />
        )}

        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 32,
            lineHeight: 1.25,
          }}
        >
          {payload.story}
        </div>

        <GoalRows payload={payload} />

        {hasPotm ? (
          <div style={{ marginBottom: 28 }}>
            {payload.coachPotmLabel ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 24,
                  marginBottom: 8,
                }}
              >
                <div style={{ color: MUTED }}>{"Coach's POTM"}</div>
                <div style={ellipsisStyle({ maxWidth: 560 })}>
                  {payload.coachPotmLabel}
                </div>
              </div>
            ) : null}
            {payload.playersPotmLabel ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 24,
                }}
              >
                <div style={{ color: MUTED }}>{"Players' POTM"}</div>
                <div style={ellipsisStyle({ maxWidth: 560 })}>
                  {payload.playersPotmLabel}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 36,
            justifyContent: "center",
          }}
        >
          {payload.form.map((letter, index) => (
            <FormBox
              key={`${letter}-${index}`}
              letter={letter}
              colors={resultColors(letter)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
