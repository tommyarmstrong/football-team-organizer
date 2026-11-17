/**
 * Scroll-driven collapse for the phone header.
 *
 * The header is `position: fixed` on phones with an in-flow spacer of the
 * expanded height, so collapsing never changes the page's scroll height (the
 * classic cause of collapse/expand jitter). The collapsed flag is written
 * straight to `data-collapsed` on the header element, so scrolling never
 * triggers a React re-render; CSS does the rest.
 */

/** Scroll offset (px) past which the header collapses. */
export const HEADER_COLLAPSE_AT = 64;

/** Scroll offset (px) at or below which the header expands again. */
export const HEADER_EXPAND_AT = 16;

/** Matches Tailwind's `md` breakpoint: the header only collapses below it. */
export const MOBILE_HEADER_QUERY = "(max-width: 767.98px)";

/**
 * Hysteresis between {@link HEADER_EXPAND_AT} and {@link HEADER_COLLAPSE_AT}
 * keeps the header still while the finger rests or iOS rubber-bands near the
 * threshold. Negative offsets (overscroll at the top) always expand.
 */
export function nextHeaderCollapsed(
  collapsed: boolean,
  scrollY: number,
): boolean {
  if (scrollY <= HEADER_EXPAND_AT) return false;
  if (scrollY >= HEADER_COLLAPSE_AT) return true;
  return collapsed;
}

type MediaQueryLike = {
  matches: boolean;
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
};

/** The slice of `window` the binder needs (so it can run under test). */
export type HeaderCollapseWindow = {
  scrollY: number;
  matchMedia: (query: string) => MediaQueryLike;
  requestAnimationFrame: (callback: () => void) => number;
  cancelAnimationFrame: (handle: number) => void;
  addEventListener: (
    type: "scroll",
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (type: "scroll", listener: () => void) => void;
};

/**
 * Keep `element.dataset.collapsed` in sync with the scroll position while the
 * viewport is phone-sized. Scroll events are coalesced to one check per frame
 * and the listener is passive. Returns a cleanup function.
 */
export function bindHeaderCollapse(
  element: { dataset: DOMStringMap },
  win: HeaderCollapseWindow,
): () => void {
  const media = win.matchMedia(MOBILE_HEADER_QUERY);
  let collapsed = element.dataset.collapsed === "true";
  let frame: number | null = null;

  function sync() {
    frame = null;
    const next = media.matches
      ? nextHeaderCollapsed(collapsed, win.scrollY)
      : false;
    if (next === collapsed) return;
    collapsed = next;
    element.dataset.collapsed = String(next);
  }

  function schedule() {
    if (frame !== null) return;
    frame = win.requestAnimationFrame(sync);
  }

  win.addEventListener("scroll", schedule, { passive: true });
  // Rotating the phone or resizing across the breakpoint re-evaluates.
  media.addEventListener("change", schedule);
  // A reload can restore a scrolled position before any scroll event fires.
  sync();

  return () => {
    win.removeEventListener("scroll", schedule);
    media.removeEventListener("change", schedule);
    if (frame !== null) win.cancelAnimationFrame(frame);
  };
}
