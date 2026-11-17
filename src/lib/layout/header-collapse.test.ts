import { describe, expect, it, vi } from "vitest";
import {
  HEADER_COLLAPSE_AT,
  HEADER_EXPAND_AT,
  MOBILE_HEADER_QUERY,
  bindHeaderCollapse,
  nextHeaderCollapsed,
  type HeaderCollapseWindow,
} from "@/lib/layout/header-collapse";

describe("nextHeaderCollapsed", () => {
  it("is expanded at the top of the page", () => {
    expect(nextHeaderCollapsed(false, 0)).toBe(false);
    expect(nextHeaderCollapsed(true, 0)).toBe(false);
  });

  it("collapses once scrolled past the collapse threshold", () => {
    expect(nextHeaderCollapsed(false, HEADER_COLLAPSE_AT - 1)).toBe(false);
    expect(nextHeaderCollapsed(false, HEADER_COLLAPSE_AT)).toBe(true);
    expect(nextHeaderCollapsed(false, 800)).toBe(true);
  });

  it("only expands again when back near the top", () => {
    expect(nextHeaderCollapsed(true, HEADER_EXPAND_AT + 1)).toBe(true);
    expect(nextHeaderCollapsed(true, HEADER_EXPAND_AT)).toBe(false);
  });

  it("holds its state between the thresholds so it cannot flicker", () => {
    expect(HEADER_EXPAND_AT).toBeLessThan(HEADER_COLLAPSE_AT);
    for (let y = HEADER_EXPAND_AT + 1; y < HEADER_COLLAPSE_AT; y += 1) {
      expect(nextHeaderCollapsed(true, y)).toBe(true);
      expect(nextHeaderCollapsed(false, y)).toBe(false);
    }
  });

  it("expands during iOS rubber-band overscroll (negative offsets)", () => {
    expect(nextHeaderCollapsed(true, -40)).toBe(false);
  });
});

function setup({ mobile = true, scrollY = 0 } = {}) {
  const listeners = new Map<string, () => void>();
  const mediaListeners: Array<() => void> = [];
  const frames: Array<() => void> = [];
  const media = {
    matches: mobile,
    addEventListener: vi.fn((_type: "change", listener: () => void) => {
      mediaListeners.push(listener);
    }),
    removeEventListener: vi.fn(),
  };
  const win: HeaderCollapseWindow = {
    scrollY,
    matchMedia: vi.fn(() => media),
    requestAnimationFrame: vi.fn((callback: () => void) => {
      frames.push(callback);
      return frames.length;
    }),
    cancelAnimationFrame: vi.fn(),
    addEventListener: vi.fn((type: "scroll", listener: () => void) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  };
  const element = { dataset: { collapsed: "false" } as DOMStringMap };

  function scrollTo(y: number) {
    win.scrollY = y;
    listeners.get("scroll")?.();
    frames.splice(0).forEach((frame) => frame());
  }

  return { win, media, mediaListeners, element, scrollTo, frames, listeners };
}

describe("bindHeaderCollapse", () => {
  it("watches the phone breakpoint with a passive scroll listener", () => {
    const { win, element } = setup();
    bindHeaderCollapse(element, win);
    expect(win.matchMedia).toHaveBeenCalledWith(MOBILE_HEADER_QUERY);
    expect(win.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true },
    );
  });

  it("stays expanded at the top, compacts after scrolling, and restores at the top", () => {
    const { win, element, scrollTo } = setup();
    bindHeaderCollapse(element, win);
    expect(element.dataset.collapsed).toBe("false");

    scrollTo(HEADER_COLLAPSE_AT + 10);
    expect(element.dataset.collapsed).toBe("true");

    // Settling between the thresholds does not toggle it.
    scrollTo(40);
    expect(element.dataset.collapsed).toBe("true");

    scrollTo(0);
    expect(element.dataset.collapsed).toBe("false");
  });

  it("coalesces a burst of scroll events into one check per frame", () => {
    const { win, element, listeners, frames } = setup();
    bindHeaderCollapse(element, win);
    const onScroll = listeners.get("scroll");
    win.scrollY = 200;
    onScroll?.();
    onScroll?.();
    onScroll?.();
    expect(win.requestAnimationFrame).toHaveBeenCalledTimes(1);
    frames.splice(0).forEach((frame) => frame());
    expect(element.dataset.collapsed).toBe("true");
  });

  it("only touches the DOM when the state actually changes", () => {
    const { win, element, scrollTo } = setup();
    const writes: string[] = [];
    const dataset = { collapsed: "false" } as DOMStringMap;
    Object.defineProperty(dataset, "collapsed", {
      get: () => "false",
      set: (value: string) => {
        writes.push(value);
      },
      configurable: true,
    });
    bindHeaderCollapse({ dataset }, win);
    scrollTo(100);
    scrollTo(150);
    scrollTo(300);
    expect(writes).toEqual(["true"]);
    expect(element.dataset.collapsed).toBe("false");
  });

  it("syncs immediately when a reload restores a scrolled position", () => {
    const { win, element } = setup({ scrollY: 500 });
    bindHeaderCollapse(element, win);
    expect(element.dataset.collapsed).toBe("true");
  });

  it("never collapses on desktop widths", () => {
    const { win, element, scrollTo } = setup({ mobile: false });
    bindHeaderCollapse(element, win);
    scrollTo(900);
    expect(element.dataset.collapsed).toBe("false");
  });

  it("re-expands if the viewport grows past the breakpoint while collapsed", () => {
    const { win, media, mediaListeners, element, scrollTo, frames } = setup();
    bindHeaderCollapse(element, win);
    scrollTo(300);
    expect(element.dataset.collapsed).toBe("true");

    media.matches = false;
    mediaListeners.forEach((listener) => listener());
    frames.splice(0).forEach((frame) => frame());
    expect(element.dataset.collapsed).toBe("false");
  });

  it("removes its listeners and pending frame on cleanup", () => {
    const { win, media, element, listeners } = setup();
    const cleanup = bindHeaderCollapse(element, win);
    win.scrollY = 200;
    listeners.get("scroll")?.();
    cleanup();
    expect(win.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
    expect(media.removeEventListener).toHaveBeenCalled();
    expect(win.cancelAnimationFrame).toHaveBeenCalled();
  });
});
