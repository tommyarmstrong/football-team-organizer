import { CoachCardImage } from "@/lib/postcards/coach-card-image";
import { PlayerCardImage } from "@/lib/postcards/player-card-image";
import { PLAYER_PHOTO_PLACEHOLDER_PATH } from "@/lib/postcards/player-photo";
import type { GalleryEntry } from "@/lib/report/gallery";

/**
 * A player or coach card drawn straight into the page, with no image request.
 *
 * It is the same component the share routes render to a PNG, laid out at its
 * native 1080x1350 and scaled down to whatever width the parent gives it (see
 * `.report-card-*` in report.css). Fill a `relative` parent of ratio 4:5.
 */
export function ReportGalleryCard({
  entry,
  crestSrc,
}: {
  entry: GalleryEntry;
  crestSrc: string | null;
}) {
  return (
    <div className="report-card-frame" data-report-card={entry.id}>
      <div className="report-card-art">
        {entry.kind === "coach" ? (
          <CoachCardImage
            payload={entry.card}
            crestSrc={crestSrc}
            photoSrc={PLAYER_PHOTO_PLACEHOLDER_PATH}
            fontFamily="inherit"
          />
        ) : (
          <PlayerCardImage
            payload={entry.card}
            crestSrc={crestSrc}
            photoSrc={PLAYER_PHOTO_PLACEHOLDER_PATH}
            fontFamily="inherit"
          />
        )}
      </div>
    </div>
  );
}
