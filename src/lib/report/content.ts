import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  emptySeasonAwards,
  parseSeasonAwards,
} from "@/lib/report/season-awards";
import {
  REPORT_AWARDS_FILE,
  REPORT_CONTENT_ROOT,
  REPORT_SLOT_FILES,
  reportAwardsPath,
  reportSlotPath,
} from "@/lib/report/slug";
import type {
  ReportContent,
  ReportContentSlot,
  ReportSeasonAwards,
} from "@/lib/report/types";

async function readSlot(
  slug: string,
  slot: keyof typeof REPORT_SLOT_FILES,
): Promise<ReportContentSlot> {
  const expectedPath = reportSlotPath(slug, slot);
  try {
    const markdown = await readFile(
      // The content folder is shipped via `outputFileTracingIncludes` in
      // next.config.ts, so keep Turbopack from tracing the whole project.
      path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        REPORT_CONTENT_ROOT,
        slug,
        REPORT_SLOT_FILES[slot],
      ),
      "utf8",
    );
    return { expectedPath, markdown: markdown.trim() || null };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { expectedPath, markdown: null };
    }
    throw error;
  }
}

async function readSeasonAwards(slug: string): Promise<ReportSeasonAwards> {
  const expectedPath = reportAwardsPath(slug);
  try {
    const raw = await readFile(
      path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        REPORT_CONTENT_ROOT,
        slug,
        REPORT_AWARDS_FILE,
      ),
      "utf8",
    );
    return parseSeasonAwards(raw, expectedPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptySeasonAwards(expectedPath);
    }
    throw error;
  }
}

/**
 * Read the hand-written sections for a report: the markdown pages and the
 * season award winners. A missing file is not an error: markdown slots render
 * a placeholder and the award boxes print blank.
 */
export async function readReportContent(slug: string): Promise<ReportContent> {
  const [coachNotes, lookingAhead, seasonAwards] = await Promise.all([
    readSlot(slug, "coachNotes"),
    readSlot(slug, "lookingAhead"),
    readSeasonAwards(slug),
  ]);
  return { coachNotes, lookingAhead, seasonAwards };
}
