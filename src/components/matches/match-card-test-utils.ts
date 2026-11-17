import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect } from "vitest";

/**
 * Shared by the match card tests (hero and dashboard summary) so the
 * layout contract is asserted in one vocabulary rather than re-implemented.
 *
 * Use as: vi.mock("next/link", async () => (await import("...")).nextLinkMock());
 */
export function nextLinkMock() {
  return {
    default: ({
      children,
      href,
      className,
      ...rest
    }: {
      children?: unknown;
      href: string;
      className?: string;
      "aria-label"?: string;
    }) => createElement("a", { href, className, ...rest }, children as never),
  };
}

export function renderCard(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

/** Visible text only, tags replaced by a single space. */
export function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Asserts that each part appears after the previous one. */
export function expectInOrder(html: string, parts: string[]) {
  let from = 0;
  for (const part of parts) {
    const index = html.indexOf(part, from);
    expect(index, `"${part}" after offset ${from}`).toBeGreaterThan(-1);
    from = index + part.length;
  }
}

/** The meta block under the score (competition, venue, date row). */
export function metaStackHtml(html: string): string {
  const start = html.indexOf('data-slot="match-card-stack"');
  expect(start, "match-card-stack present").toBeGreaterThan(-1);
  return html.slice(start);
}

/** The date row's parts and separators, as rendered. */
export function dateRowHtml(html: string): string {
  const match = html.match(
    /<p[^>]*data-slot="match-card-date-row"[^>]*>(.*?)<\/p>/,
  );
  expect(match, "date row present").not.toBeNull();
  return match?.[1] ?? "";
}

/**
 * The layout contract for the match card (dashboard and match page).
 */
export function expectSharedCardLayout(
  html: string,
  {
    homeName,
    awayName,
    live = false,
  }: { homeName: string; awayName: string; live?: boolean },
) {
  // Names flank the score on one row; there are no HOME/AWAY labels.
  expect(html).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
  expect(visibleText(html)).not.toMatch(/\b(Home|Away)\b/i);
  expect(html.indexOf(homeName)).toBeGreaterThan(-1);
  expect(html.indexOf(awayName)).toBeGreaterThan(html.indexOf(homeName));

  // LIVE sits directly above the score, before the names/score row.
  if (live) {
    expect(html.indexOf(">LIVE<")).toBeGreaterThan(-1);
    expect(html.indexOf(">LIVE<")).toBeLessThan(html.indexOf(homeName));
  } else {
    expect(html).not.toContain(">LIVE<");
  }

  // The meta block sits below the score, centred.
  const stack = metaStackHtml(html);
  expect(html.indexOf('data-slot="match-card-stack"')).toBeGreaterThan(
    html.indexOf(awayName),
  );
  expect(stack).toContain("text-center");
}
