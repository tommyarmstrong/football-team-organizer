import type { CSSProperties } from "react";
import {
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
} from "@/lib/postcards/postcard-image";
import type { PlayerCardPayload } from "@/lib/postcards/types";

/** Portrait 4:5: fits a WhatsApp chat and an Instagram feed post uncropped. */
export const PLAYER_CARD_WIDTH = POSTCARD_WIDTH;
export const PLAYER_CARD_HEIGHT = POSTCARD_HEIGHT;

const DEFAULT_CLUB_COLOUR = "#146C4A";
const CREAM = "#FAF6E6";
const GOLD = "#F2C94C";
const INK = "#183B2B";
const MUTED = "#5E6F64";
const WHITE = "#FFFFFF";

const FRAME_INSET = 36;
const FRAME_BORDER = 10;
const FRAME_INNER_WIDTH =
  PLAYER_CARD_WIDTH - FRAME_INSET * 2 - FRAME_BORDER * 2;
const PHOTO_HEIGHT = 690;
const BANNER_HEIGHT = 216;

function channel(hex: string, index: number): number {
  return Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

/** Blend `hex` towards `target` by `amount` (0 = hex, 1 = target). */
export function mixColour(hex: string, target: string, amount: number): string {
  const parts = [0, 1, 2].map((index) => {
    const from = channel(hex, index);
    const to = channel(target, index);
    return Math.round(from + (to - from) * amount)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${parts.join("")}`;
}

/** Name size that keeps a single line inside the banner. */
export function bannerNameFontSize(name: string): number {
  const length = name.length;
  if (length <= 8) return 112;
  if (length <= 11) return 94;
  if (length <= 14) return 76;
  return 60;
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
 * Placeholder for the player photo until uploads exist: a shadowed
 * head-and-shoulders silhouette.
 */
function Silhouette() {
  const width = 620;
  const height = 640;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 620 640"
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 0,
        left: (FRAME_INNER_WIDTH - width) / 2,
      }}
    >
      <g fill="#0F1A15" fillOpacity={0.34}>
        <ellipse cx="310" cy="215" rx="128" ry="150" />
        <rect x="262" y="330" width="96" height="110" />
        <path d="M30 640C30 500 130 430 245 408L375 408C490 430 590 500 590 640Z" />
      </g>
    </svg>
  );
}

function Crest({
  crestSrc,
  clubName,
  colour,
}: {
  crestSrc: string | null;
  clubName: string;
  colour: string;
}) {
  const initial = (clubName.trim()[0] ?? "F").toUpperCase();
  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 32,
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: WHITE,
        border: `6px solid ${CREAM}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {crestSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={crestSrc}
          width={96}
          height={96}
          alt=""
          style={{ width: 96, height: 96, objectFit: "contain" }}
        />
      ) : (
        <div style={{ fontSize: 64, fontWeight: 700, color: colour }}>
          {initial}
        </div>
      )}
    </div>
  );
}

function ShirtBadge({ number, colour }: { number: number; colour: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        right: 32,
        width: 132,
        height: 132,
        borderRadius: 30,
        backgroundColor: colour,
        border: `6px solid ${CREAM}`,
        color: WHITE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: number > 99 ? 60 : 84,
        fontWeight: 700,
      }}
    >
      {String(number)}
    </div>
  );
}

function Banner({
  payload,
  colour,
}: {
  payload: PlayerCardPayload;
  colour: string;
}) {
  const mainName = payload.lastName ?? payload.firstName;
  return (
    <div
      style={{
        height: BANNER_HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colour,
        borderTop: `8px solid ${GOLD}`,
        borderBottom: `8px solid ${GOLD}`,
        color: WHITE,
        padding: "0 32px",
      }}
    >
      {payload.lastName ? (
        <div
          style={ellipsisStyle({
            fontSize: 38,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: CREAM,
            maxWidth: 900,
            marginBottom: 2,
          })}
        >
          {payload.firstName}
        </div>
      ) : null}
      <div
        style={ellipsisStyle({
          fontSize: bannerNameFontSize(mainName),
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          maxWidth: 900,
        })}
      >
        {mainName}
      </div>
      {payload.positionLabel ? (
        <div
          style={ellipsisStyle({
            fontSize: 34,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: GOLD,
            marginTop: 4,
            maxWidth: 900,
          })}
        >
          {payload.positionLabel}
        </div>
      ) : null}
    </div>
  );
}

function StatBox({
  value,
  label,
  colour,
  last,
}: {
  value: number;
  label: string;
  colour: string;
  last: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        height: 150,
        marginRight: last ? 0 : 14,
        borderRadius: 22,
        backgroundColor: WHITE,
        border: `5px solid ${colour}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{ fontSize: 76, fontWeight: 700, color: colour, lineHeight: 1 }}
      >
        {String(value)}
      </div>
      <div
        style={{
          fontSize: 26,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: MUTED,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function PlayerCardImage({
  payload,
  crestSrc,
}: {
  payload: PlayerCardPayload;
  crestSrc: string | null;
}) {
  const base = payload.clubColour ?? DEFAULT_CLUB_COLOUR;
  const deep = mixColour(base, "#000000", 0.45);
  const light = mixColour(base, "#FFFFFF", 0.38);
  const stats = [
    { label: "Apps", value: payload.stats.appearances },
    { label: "Goals", value: payload.stats.goals },
    { label: "Assists", value: payload.stats.assists },
    { label: "POTM", value: payload.stats.potm },
  ];

  return (
    <div
      style={{
        width: PLAYER_CARD_WIDTH,
        height: PLAYER_CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        padding: FRAME_INSET,
        backgroundImage: `linear-gradient(150deg, ${base}, ${deep})`,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: 48,
          border: `${FRAME_BORDER}px solid ${CREAM}`,
          overflow: "hidden",
          backgroundColor: CREAM,
        }}
      >
        <div
          style={{
            height: PHOTO_HEIGHT,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            backgroundImage: `linear-gradient(180deg, ${light}, ${base})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -220,
              left: 90,
              width: 220,
              height: 1200,
              backgroundColor: WHITE,
              opacity: 0.12,
              transform: "rotate(24deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -220,
              left: 480,
              width: 120,
              height: 1200,
              backgroundColor: WHITE,
              opacity: 0.12,
              transform: "rotate(24deg)",
            }}
          />
          <Silhouette />
          <Crest
            crestSrc={crestSrc}
            clubName={payload.clubName}
            colour={deep}
          />
          {payload.shirtNumber != null ? (
            <ShirtBadge number={payload.shirtNumber} colour={deep} />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 32,
              bottom: 28,
              display: "flex",
              padding: "8px 26px",
              borderRadius: 999,
              backgroundColor: CREAM,
              color: deep,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {payload.ageGroup}
          </div>
        </div>

        <Banner payload={payload} colour={deep} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "28px 32px 30px",
            backgroundColor: CREAM,
          }}
        >
          <div style={{ display: "flex", marginBottom: 26 }}>
            {stats.map((stat, index) => (
              <StatBox
                key={stat.label}
                value={stat.value}
                label={stat.label}
                colour={deep}
                last={index === stats.length - 1}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={ellipsisStyle({
                fontSize: 40,
                fontWeight: 700,
                color: INK,
                maxWidth: 920,
              })}
            >
              {payload.clubName}
            </div>
            <div
              style={ellipsisStyle({
                fontSize: 30,
                color: MUTED,
                marginTop: 6,
                maxWidth: 920,
              })}
            >
              {`${payload.teamName} · ${payload.seasonLabel}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
