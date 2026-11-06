import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  REPORT_CONTENT_ROOT,
  REPORT_SLOT_FILES,
  reportSlotPath,
} from "@/lib/report/slug";
import type { ReportContent, ReportContentSlot } from "@/lib/report/types";

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

/**
 * Read the hand-written markdown sections for a report. A missing file is not
 * an error: that slot renders a placeholder.
 */
export async function readReportContent(slug: string): Promise<ReportContent> {
  const [coachNotes, lookingAhead] = await Promise.all([
    readSlot(slug, "coachNotes"),
    readSlot(slug, "lookingAhead"),
  ]);
  return { coachNotes, lookingAhead };
}
