/** Player cards are portrait 4:5. */
export const PLAYER_CARD_ASPECT = { width: 4, height: 5 } as const;

/** Cards per row and per page in the Player Gallery. */
export const GALLERY_COLUMNS = 3;
export const GALLERY_ROWS_PER_PAGE = 3;
export const GALLERY_CARDS_PER_PAGE = GALLERY_COLUMNS * GALLERY_ROWS_PER_PAGE;
