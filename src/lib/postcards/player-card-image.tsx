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
const GOLD = "#FFC107";
const WHITE = "#FFFFFF";
const FOOTBALL_EMOJI = "⚽";
/** Large banner type and stat figures need this contrast on their fills. */
const READABLE_CONTRAST = 4.5;

const FRAME_INSET = 36;
const FRAME_BORDER = 10;
const FRAME_INNER_WIDTH =
  PLAYER_CARD_WIDTH - FRAME_INSET * 2 - FRAME_BORDER * 2;
const PHOTO_HEIGHT = 570;
const BANNER_HEIGHT = 310;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function colourHsl(hex: string): { h: number; s: number; l: number } {
  const rn = channel(hex, 0) / 255;
  const gn = channel(hex, 1) / 255;
  const bn = channel(hex, 2) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const match = l - c / 2;
  const parts = [r, g, b].map((part) =>
    Math.round(clamp(part + match, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${parts.join("")}`;
}

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [0, 1, 2].map((index) => {
      const value = channel(hex, index) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export type PlayerCardColours = {
  /** Club colour, with a small saturation lift when it is chromatic. */
  base: string;
  /** Dark shade for the banner and shirt badge. White text stays readable. */
  deep: string;
  /** Brighter shade for gradients. Lightness moves; saturation does not drop. */
  light: string;
  /** Inner card, frame, and pills — the same hue as the club, kept light. */
  field: string;
  /** Club name. */
  ink: string;
  /** Secondary lines, still the club hue rather than a grey-green. */
  muted: string;
  /** Stat tiles. White figures stay readable, including on pale club colours. */
  accent: string;
  /** Position line. Gold when it clears the banner, otherwise white. */
  position: string;
};

/**
 * One club hue across the card. Mixing toward white or black in RGB is what
 * was greying the photo wash, the banner, and the footer out of step with
 * each other.
 */
export function playerCardColours(clubColour: string): PlayerCardColours {
  const { h, s, l } = colourHsl(clubColour);
  const chromatic = s >= 0.12;
  const vividS = chromatic ? Math.min(1, s + (1 - s) * 0.28) : 0;
  const base = hslToHex(h, vividS, l);

  let deepL = clamp(Math.min(l * 0.7, 0.32), 0, l);
  let deep = hslToHex(h, vividS, deepL);
  while (contrastRatio(WHITE, deep) < READABLE_CONTRAST && deepL > 0.08) {
    deepL -= 0.02;
    deep = hslToHex(h, vividS, deepL);
  }

  // Pale clubs get a slightly deeper light stop so the gradient does not
  // fade toward white. Darker clubs get a brighter stop at the same hue.
  const lightL = l >= 0.5 ? Math.max(0.42, l - 0.06) : Math.min(0.5, l + 0.14);
  const light = hslToHex(h, vividS, lightL);

  const field = hslToHex(
    h,
    chromatic ? Math.min(0.72, Math.max(vividS, 0.55)) : 0,
    0.76,
  );

  let mutedL = 0.3;
  const mutedS = chromatic ? Math.max(vividS, 0.55) : 0;
  let muted = hslToHex(h, mutedS, mutedL);
  while (contrastRatio(muted, field) < READABLE_CONTRAST && mutedL > 0.16) {
    mutedL -= 0.02;
    muted = hslToHex(h, mutedS, mutedL);
  }

  const accent = contrastRatio(WHITE, base) >= READABLE_CONTRAST ? base : deep;
  const position =
    contrastRatio(GOLD, deep) >= READABLE_CONTRAST ? GOLD : WHITE;

  return {
    base,
    deep,
    light,
    field,
    ink: deep,
    muted,
    accent,
    position,
  };
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
 * Fallback for the player photo when the placeholder artwork cannot be
 * loaded: a shadowed head-and-shoulders silhouette.
 */
function Silhouette() {
  const width = 540;
  const height = 558;
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

/** Full-bleed placeholder artwork filling the photo area. */
function PhotoArt({ photoSrc }: { photoSrc: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSrc}
      width={FRAME_INNER_WIDTH}
      height={PHOTO_HEIGHT}
      alt=""
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: FRAME_INNER_WIDTH,
        height: PHOTO_HEIGHT,
        objectFit: "cover",
      }}
    />
  );
}

/** The club crest, or a football emoji when the club has no usable logo. */
export function Crest({
  crestSrc,
  field,
}: {
  crestSrc: string | null;
  field: string;
}) {
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
        border: `6px solid ${field}`,
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
        <div style={{ fontSize: 72 }}>{FOOTBALL_EMOJI}</div>
      )}
    </div>
  );
}

function ShirtBadge({
  number,
  colour,
  field,
}: {
  number: number;
  colour: string;
  field: string;
}) {
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
        border: `6px solid ${field}`,
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
  colours,
}: {
  payload: PlayerCardPayload;
  colours: PlayerCardColours;
}) {
  const mainName = payload.lastName ?? payload.firstName;
  return (
    <div
      style={{
        height: BANNER_HEIGHT,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colours.deep,
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
            color: WHITE,
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
            color: colours.position,
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
  colours,
  last,
}: {
  value: number;
  label: string;
  colours: PlayerCardColours;
  last: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        height: 150,
        marginRight: last ? 0 : 14,
        borderRadius: 22,
        backgroundColor: colours.accent,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          color: WHITE,
          lineHeight: 1,
        }}
      >
        {String(value)}
      </div>
      <div
        style={{
          fontSize: 26,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: WHITE,
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
  photoSrc = null,
}: {
  payload: PlayerCardPayload;
  crestSrc: string | null;
  /** Photo-area artwork; the plain silhouette is used when null. */
  photoSrc?: string | null;
}) {
  const colours = playerCardColours(payload.clubColour ?? DEFAULT_CLUB_COLOUR);
  const stats = [
    { label: "Apps", value: payload.stats.appearances },
    { label: "Wins", value: payload.stats.wins },
    { label: "Draws", value: payload.stats.draws },
    { label: "Losses", value: payload.stats.losses },
  ];
  const contributions = `Goals ${payload.stats.goals} · Assists ${payload.stats.assists} · POTM ${payload.stats.potm}`;

  return (
    <div
      style={{
        width: PLAYER_CARD_WIDTH,
        height: PLAYER_CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        padding: FRAME_INSET,
        backgroundImage: `linear-gradient(150deg, ${colours.light}, ${colours.base} 46%, ${colours.deep})`,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: 48,
          border: `${FRAME_BORDER}px solid ${colours.field}`,
          overflow: "hidden",
          backgroundColor: colours.field,
        }}
      >
        <div
          style={{
            height: PHOTO_HEIGHT,
            flexShrink: 0,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            backgroundImage: `linear-gradient(180deg, ${colours.light}, ${colours.base})`,
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
              opacity: 0.1,
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
              opacity: 0.1,
              transform: "rotate(24deg)",
            }}
          />
          {photoSrc ? <PhotoArt photoSrc={photoSrc} /> : <Silhouette />}
          <Crest crestSrc={crestSrc} field={colours.field} />
          {payload.shirtNumber != null ? (
            <ShirtBadge
              number={payload.shirtNumber}
              colour={colours.deep}
              field={colours.field}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 32,
              bottom: 28,
              display: "flex",
              padding: "8px 26px",
              borderRadius: 999,
              backgroundColor: colours.field,
              color: colours.accent,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {payload.ageGroup}
          </div>
        </div>

        <Banner payload={payload} colours={colours} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px 32px 26px",
            backgroundColor: colours.field,
          }}
        >
          <div style={{ display: "flex", marginBottom: 22 }}>
            {stats.map((stat, index) => (
              <StatBox
                key={stat.label}
                value={stat.value}
                label={stat.label}
                colours={colours}
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
                color: colours.ink,
                maxWidth: 920,
              })}
            >
              {payload.clubName}
            </div>
            <div
              style={ellipsisStyle({
                fontSize: 30,
                color: colours.muted,
                marginTop: 6,
                maxWidth: 920,
              })}
            >
              {`${payload.teamName} · ${payload.seasonLabel}`}
            </div>
            <div
              style={ellipsisStyle({
                fontSize: 30,
                color: colours.muted,
                marginTop: 6,
                maxWidth: 920,
              })}
            >
              {contributions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
