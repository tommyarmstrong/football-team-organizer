import {
  cardArtboard,
  type CardVariant,
  CARD_HEIGHT,
  CARD_WIDTH,
} from "@/lib/postcards/card-artboard";
import type { PlayerCardView } from "@/lib/postcards/types";

export {
  bannerNameFontSize,
  clubMarkColour,
  Crest,
  mixColour,
} from "@/lib/postcards/card-artboard";

/** Portrait 4:5: fits a WhatsApp chat and an Instagram feed post uncropped. */
export const PLAYER_CARD_WIDTH = CARD_WIDTH;
export const PLAYER_CARD_HEIGHT = CARD_HEIGHT;

export function PlayerCardImage({
  payload,
  crestSrc,
  photoSrc = null,
  fontFamily = "sans-serif",
  variant = "share",
}: {
  payload: PlayerCardView;
  crestSrc: string | null;
  /** Photo-area artwork; the plain silhouette is used when null. */
  photoSrc?: string | null;
  /** Satori only has its built-in font; in a browser pass the page's font. */
  fontFamily?: string;
  /** `report` is the larger-footer card printed in the season report. */
  variant?: CardVariant;
}) {
  return cardArtboard({
    clubColour: payload.clubColour,
    crestSrc,
    photoSrc,
    fontFamily,
    variant,
    badgeNumber: payload.shirtNumber,
    pill: payload.ageGroup,
    topName: payload.lastName ? payload.firstName : null,
    mainName: payload.lastName ?? payload.firstName,
    subtitle: payload.positionLabel,
    stats: [
      { label: "Apps", value: payload.stats.appearances },
      { label: "Wins", value: payload.stats.wins },
      { label: "Draws", value: payload.stats.draws },
      { label: "Losses", value: payload.stats.losses },
    ],
    clubName: payload.clubName,
    teamLine: `${payload.teamName} · ${payload.seasonLabel}`,
    extraLine: `Goals ${payload.stats.goals} · Assists ${payload.stats.assists} · POTM ${payload.stats.potm}`,
  });
}
