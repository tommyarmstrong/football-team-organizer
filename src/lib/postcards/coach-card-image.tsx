import {
  cardArtboard,
  CARD_HEIGHT,
  CARD_WIDTH,
} from "@/lib/postcards/card-artboard";
import type { CoachCardView } from "@/lib/postcards/types";

export const COACH_CARD_WIDTH = CARD_WIDTH;
export const COACH_CARD_HEIGHT = CARD_HEIGHT;

export function CoachCardImage({
  payload,
  crestSrc,
  photoSrc = null,
  fontFamily = "sans-serif",
}: {
  payload: CoachCardView;
  crestSrc: string | null;
  /** Photo-area artwork; the plain silhouette is used when null. */
  photoSrc?: string | null;
  /** Satori only has its built-in font; in a browser pass the page's font. */
  fontFamily?: string;
}) {
  return cardArtboard({
    clubColour: payload.clubColour,
    crestSrc,
    photoSrc,
    fontFamily,
    pill: payload.ageGroup,
    topName: payload.lastName ? payload.firstName : null,
    mainName: payload.lastName ?? payload.firstName,
    subtitle: payload.roleLabel,
    stats: [
      { label: "Played", value: payload.stats.played },
      { label: "Wins", value: payload.stats.wins },
      { label: "Draws", value: payload.stats.draws },
      { label: "Losses", value: payload.stats.losses },
    ],
    clubName: payload.clubName,
    teamLine: `${payload.teamName} · ${payload.seasonLabel}`,
    extraLine: `Goals for ${payload.stats.goalsFor} · Goals against ${payload.stats.goalsAgainst}`,
  });
}
