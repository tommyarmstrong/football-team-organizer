import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function luminance(hex: string): number {
  const channels = [0, 2, 4].map((index) =>
    parseInt(hex.slice(index + 1, index + 3), 16),
  );
  const [red, green, blue] = channels;
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function cssBlock(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  return match?.[1] ?? "";
}

describe("dark colour scheme", () => {
  const globals = readFileSync(
    resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const reportCss = readFileSync(
    resolve(process.cwd(), "src/app/(report)/report.css"),
    "utf8",
  );
  const reportLayout = readFileSync(
    resolve(process.cwd(), "src/app/(report)/layout.tsx"),
    "utf8",
  );
  const root = cssBlock(globals, ":root");
  const reportTheme = cssBlock(globals, ".report-theme");

  it("paints the app with the dark palette", () => {
    expect(root).toContain("color-scheme: dark");
    expect(root).toContain("--background: #181c1d");
    expect(root).toContain("--card: #232a2b");
    expect(root).toContain("--popover: #232a2b");
    expect(root).toContain("--border: #343b3b");
    expect(luminance("#232a2b")).toBeGreaterThan(luminance("#181c1d"));
    expect(root).toContain("--foreground: #f5f7f6");
    expect(root).toContain("--muted-foreground: #a9b5b2");
    expect(root).toContain("--win: #36dd52");
    expect(root).toContain("--draw: #ffd12b");
    expect(root).toContain("--loss: #ff5555");
  });

  it("keeps the season report on the light palette", () => {
    expect(reportTheme).toContain("color-scheme: light");
    expect(reportTheme).toContain("--background: oklch(0.975 0.018 145)");
    expect(reportTheme).toContain("--foreground: oklch(0.22 0.04 155)");
    expect(reportTheme).toContain("--win: oklch(0.5 0.14 155)");
    expect(reportTheme).not.toContain("#181c1d");
    expect(reportTheme).not.toContain("#36dd52");

    expect(reportCss).toContain("color: #14201a");
    expect(reportCss).toContain("background: #fff");
    expect(reportCss).not.toContain("#181c1d");
    expect(reportCss).not.toContain("#101414");

    expect(reportLayout).toContain("report-theme");
    expect(reportLayout).toContain("bg-neutral-300");
    expect(reportLayout).toContain("print:bg-white");
  });
});
