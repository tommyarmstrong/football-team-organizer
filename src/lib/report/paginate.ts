/** Split `items` into consecutive groups of at most `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error("chunk size must be at least 1");
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

/**
 * Like `chunk`, but an empty list still yields one (empty) page so the page's
 * heading and empty state render.
 */
export function chunkAtLeastOne<T>(items: readonly T[], size: number): T[][] {
  const pages = chunk(items, size);
  return pages.length > 0 ? pages : [[]];
}

/** How many blank "Notes" pages bring `count` up to an even number. */
export function fillerPagesForEven(count: number): number {
  return count % 2 === 0 ? 0 : 1;
}

/**
 * How many blank "Notes" pages go between the last section and the blank
 * inside back cover: always at least one, plus one more when needed so that
 * the whole book, back cover included, has an even number of pages for
 * double-sided printing.
 *
 * `bodyPages` is the number of pages before the Notes pages.
 */
export function notesPageCount(bodyPages: number): number {
  // One Notes page, the blank inside back cover, then the back cover.
  return 1 + fillerPagesForEven(bodyPages + 3);
}

/** Marker line that starts a new page inside a markdown slot. */
export const PAGE_BREAK_MARKER = "<!-- page -->";

/**
 * Split a markdown slot into pages on lines that contain only
 * `<!-- page -->`. Empty pages are dropped.
 */
export function splitMarkdownPages(markdown: string): string[] {
  return markdown
    .split(/^[ \t]*<!--\s*page\s*-->[ \t]*$/m)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
