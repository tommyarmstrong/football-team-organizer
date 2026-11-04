/**
 * URL of the player card image for one player on one team: the same
 * `GET /people/[id]/player-card` route that powers "Share player card".
 * `[id]` is the person; `player` and `team` pick the record and the stats.
 */
export function playerCardPath(input: {
  personId: string;
  playerId: string;
  teamId: string;
}): string {
  const query = new URLSearchParams({
    player: input.playerId,
    team: input.teamId,
  });
  return `/people/${encodeURIComponent(input.personId)}/player-card?${query.toString()}`;
}

/** Player cards are portrait 4:5. */
export const PLAYER_CARD_ASPECT = { width: 4, height: 5 } as const;

/** Cards per row and per page in the Player Gallery. */
export const GALLERY_COLUMNS = 4;
export const GALLERY_ROWS_PER_PAGE = 4;
export const GALLERY_CARDS_PER_PAGE = GALLERY_COLUMNS * GALLERY_ROWS_PER_PAGE;
