"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { PointsTrend } from "@/components/report/report-charts";
import { cumulativePoints, pointsTooltip } from "@/lib/report/summary";
import type { TrendMatch } from "@/lib/report/summary";
import {
  clampTooltipCentre,
  nextTooltipIndex,
} from "@/lib/stats/chart-tooltip";

/** Fixed width, so the tooltip can be kept inside the chart without measuring. */
const TOOLTIP_WIDTH = 224;
/** Below this many px from the top there is no room above a point. */
const FLIP_BELOW_PX = 72;

type Open = {
  index: number;
  /** Centre of the point, px from the chart's left. */
  x: number;
  /** Top and height of the point's hit area, px from the chart's top. */
  top: number;
  height: number;
  width: number;
};

/**
 * The report's points trend with a tooltip that works on touch: tap a point to
 * see the match, tap it again or anywhere else to close it. With a mouse the
 * tooltip follows the pointer over a point, as hover does.
 */
export function PointsTrendWithTooltip({
  matches,
}: {
  matches: readonly TrendMatch[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const totals = useMemo(() => cumulativePoints(matches), [matches]);

  function pointAt(target: EventTarget | null): Open | null {
    const wrap = wrapRef.current;
    if (!wrap || !(target instanceof Element)) return null;
    const el = target.closest("[data-point]");
    if (!el || !wrap.contains(el)) return null;
    const index = Number(el.getAttribute("data-point"));
    if (!Number.isInteger(index) || index < 0 || index >= matches.length) {
      return null;
    }
    const box = el.getBoundingClientRect();
    const frame = wrap.getBoundingClientRect();
    return {
      index,
      x: box.left + box.width / 2 - frame.left,
      top: box.top - frame.top,
      height: box.height,
      width: frame.width,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const point = pointAt(event.target);
    setOpen((current) =>
      point && current?.index === point.index && current.x === point.x
        ? current
        : point,
    );
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    // Touch and pen: a tap toggles. A mouse is handled by hover above.
    if (event.pointerType === "mouse") return;
    const point = pointAt(event.target);
    setOpen((current) =>
      nextTooltipIndex(current?.index ?? null, point?.index ?? null) === null
        ? null
        : point,
    );
  }

  // A tap outside the chart closes the tooltip.
  useEffect(() => {
    if (!open) return;
    const close = (event: globalThis.PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const match = open ? matches[open.index] : undefined;
  const below = open ? open.top < FLIP_BELOW_PX : false;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerMove={onPointerMove}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpen(null);
      }}
      onPointerUp={onPointerUp}
    >
      <PointsTrend matches={matches} nativeTooltips={false} />
      {open && match ? (
        <div
          aria-hidden="true"
          data-testid="points-tooltip"
          className="bg-popover text-popover-foreground border-border pointer-events-none absolute z-10 rounded-md border px-2.5 py-1.5 text-xs leading-snug shadow-md"
          style={{
            width: TOOLTIP_WIDTH,
            left: clampTooltipCentre(open.x, open.width, TOOLTIP_WIDTH),
            top: below ? open.top + open.height + 4 : open.top - 4,
            transform: below ? "translateX(-50%)" : "translate(-50%, -100%)",
          }}
        >
          {pointsTooltip(match, totals[open.index]!)}
        </div>
      ) : null}
    </div>
  );
}
