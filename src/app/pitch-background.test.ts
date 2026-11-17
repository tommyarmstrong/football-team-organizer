import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** The previous etching was a 160×160 square with a centre circle only. */
const PREVIOUS_TILE_PX = 160;

type Shape = {
  tag: string;
  attrs: Record<string, string>;
};

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function attr(source: string, name: string): string | undefined {
  return source.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function shapes(svg: string): Shape[] {
  return [...svg.matchAll(/<(rect|line|circle|path)\b([^>]*?)\/?>/g)].map(
    (match) => {
      const attrs: Record<string, string> = {};
      for (const found of match[2].matchAll(/\b([a-zA-Z0-9:-]+)="([^"]*)"/g)) {
        attrs[found[1]] = found[2];
      }
      return { tag: match[1], attrs };
    },
  );
}

function numberAttr(shape: Shape, name: string): number {
  return Number(shape.attrs[name]);
}

function tileSize(svg: string): { width: number; height: number } {
  const root = svg.match(/<svg\b([^>]*)>/)?.[1] ?? "";
  return {
    width: Number(attr(root, "width")),
    height: Number(attr(root, "height")),
  };
}

function geometry(
  svg: string,
): Array<{ tag: string; attrs: Record<string, string> }> {
  const kept = [
    "x",
    "y",
    "width",
    "height",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "d",
  ];
  return shapes(svg).map((shape) => ({
    tag: shape.tag,
    attrs: Object.fromEntries(
      kept
        .filter((name) => shape.attrs[name] != null)
        .map((name) => [name, shape.attrs[name]]),
    ),
  }));
}

describe("pitch background etching", () => {
  const appPattern = read("public/pitch-pattern.svg");
  const reportPattern = read("public/report-pitch-pattern.svg");
  const globals = read("src/app/globals.css");
  const reportCss = read("src/app/(report)/report.css");
  const authShell = read("src/components/brand/auth-shell.tsx");

  it("paints the scrolling background and sign-in shell from the larger pitch tile", () => {
    const block =
      globals.match(/body::before,\s*\.pitch-pattern\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(block).toContain('url("/pitch-pattern.svg")');
    expect(block).not.toContain("report-pitch-pattern");
    expect(block).toMatch(/background-repeat:\s*repeat/);
    expect(block).toMatch(/background-size:\s*540px 330px/);

    const fixed = globals.match(/body::before\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(fixed).toMatch(/position:\s*fixed/);
    expect(fixed).not.toMatch(/background-image/);

    expect(authShell).toContain("pitch-pattern");
    expect(authShell).not.toContain("report-pitch-pattern");

    const tile = tileSize(appPattern);
    expect(tile).toEqual({ width: 540, height: 330 });
    expect(tile.width).toBeGreaterThan(PREVIOUS_TILE_PX);
    expect(tile.height).toBeGreaterThan(PREVIOUS_TILE_PX);
    expect(tile.width * tile.height).toBeGreaterThan(
      PREVIOUS_TILE_PX * PREVIOUS_TILE_PX,
    );
  });

  it("repeats the report etching at the same larger tile", () => {
    expect(reportCss).toContain('url("/report-pitch-pattern.svg")');
    expect(reportCss).toMatch(
      /-webkit-mask:\s*url\("\/report-pitch-pattern\.svg"\)\s*0 0 \/ 540px 330px repeat/,
    );
    expect(reportCss).toMatch(
      /(?<!-webkit-)mask:\s*url\("\/report-pitch-pattern\.svg"\)\s*0 0 \/ 540px 330px repeat/,
    );
    expect(reportCss).not.toContain("160px 160px");
    expect(tileSize(reportPattern)).toEqual({ width: 540, height: 330 });
  });

  it("draws both penalty areas, six-yard boxes, and penalty arcs", () => {
    expect(geometry(appPattern)).toEqual(geometry(reportPattern));

    for (const svg of [appPattern, reportPattern]) {
      const drawn = shapes(svg);
      const root = svg.match(/<svg\b([^>]*)>/)?.[1] ?? "";
      expect(attr(root, "fill")).toBe("none");
      expect(attr(root, "viewBox")).toBe("0 0 360 220");

      const rects = drawn.filter((shape) => shape.tag === "rect");
      const boundary = rects.find(
        (shape) =>
          numberAttr(shape, "width") === 336 &&
          numberAttr(shape, "height") === 196,
      );
      const penalties = rects.filter(
        (shape) =>
          numberAttr(shape, "width") === 52 &&
          numberAttr(shape, "height") === 104,
      );
      const sixYard = rects.filter(
        (shape) =>
          numberAttr(shape, "width") === 22 &&
          numberAttr(shape, "height") === 56,
      );
      expect(boundary).toBeTruthy();
      expect(penalties).toHaveLength(2);
      expect(sixYard).toHaveLength(2);

      for (const box of [...penalties, ...sixYard]) {
        const left = numberAttr(box, "x");
        const right = left + numberAttr(box, "width");
        const top = numberAttr(box, "y");
        const bottom = top + numberAttr(box, "height");
        expect(left).toBeGreaterThanOrEqual(numberAttr(boundary!, "x"));
        expect(right).toBeLessThanOrEqual(
          numberAttr(boundary!, "x") + numberAttr(boundary!, "width"),
        );
        expect(top).toBeGreaterThanOrEqual(numberAttr(boundary!, "y"));
        expect(bottom).toBeLessThanOrEqual(
          numberAttr(boundary!, "y") + numberAttr(boundary!, "height"),
        );
      }

      for (const [index, box] of sixYard.entries()) {
        const area = penalties[index];
        expect(numberAttr(box, "width")).toBeLessThan(
          numberAttr(area, "width"),
        );
        expect(numberAttr(box, "height")).toBeLessThan(
          numberAttr(area, "height"),
        );
        expect(numberAttr(box, "x")).toBeGreaterThanOrEqual(
          numberAttr(area, "x"),
        );
        expect(
          numberAttr(box, "x") + numberAttr(box, "width"),
        ).toBeLessThanOrEqual(
          numberAttr(area, "x") + numberAttr(area, "width"),
        );
      }

      const halfway = drawn.find((shape) => shape.tag === "line");
      expect(halfway?.attrs).toMatchObject({
        x1: "180",
        x2: "180",
        y1: "12",
        y2: "208",
      });

      const centre = drawn.find(
        (shape) => shape.tag === "circle" && shape.attrs.r === "32",
      );
      expect(centre?.attrs).toMatchObject({ cx: "180", cy: "110" });

      const arcs = drawn.filter(
        (shape) => shape.tag === "path" && shape.attrs.d?.includes("a36 36"),
      );
      expect(arcs.map((shape) => shape.attrs.d)).toEqual([
        "M64 86a36 36 0 0 1 0 48",
        "M296 86a36 36 0 0 0 0 48",
      ]);
      expect(arcs[0].attrs.d?.startsWith("M64 ")).toBe(true);
      expect(
        numberAttr(penalties[0], "x") + numberAttr(penalties[0], "width"),
      ).toBe(64);
      expect(arcs[1].attrs.d?.startsWith("M296 ")).toBe(true);
      expect(numberAttr(penalties[1], "x")).toBe(296);
    }
  });

  it("keeps a stroke etching rather than a filled pitch", () => {
    expect(appPattern).toContain('stroke="#A9B5B2"');
    expect(appPattern).toContain('stroke-opacity="0.16"');
    expect(appPattern).not.toMatch(/<rect\b[^>]*\bfill="/);
    expect(reportPattern).toContain('stroke="#000"');
    expect(reportPattern).not.toContain("#A9B5B2");
    expect(reportPattern).not.toMatch(/<rect\b[^>]*\bfill="/);
  });
});
