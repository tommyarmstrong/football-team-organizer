import { PlayerCardImage } from "@/lib/postcards/player-card-image";
import { PLAYER_PHOTO_PLACEHOLDER_PATH } from "@/lib/postcards/player-photo";
import type { PlayerCardView } from "@/lib/postcards/types";

/**
 * A player card drawn straight into the page, with no image request.
 *
 * It is the same component the share route renders to a PNG, laid out at its
 * native 1080x1350 and scaled down to whatever width the parent gives it (see
 * `.report-card-*` in report.css). Fill a `relative` parent of ratio 4:5.
 */
export function ReportPlayerCard({
  card,
  crestSrc,
}: {
  card: PlayerCardView;
  crestSrc: string | null;
}) {
  return (
    <div className="report-card-frame" data-report-card={card.playerId}>
      <div className="report-card-art">
        <PlayerCardImage
          payload={card}
          crestSrc={crestSrc}
          photoSrc={PLAYER_PHOTO_PLACEHOLDER_PATH}
          fontFamily="inherit"
        />
      </div>
    </div>
  );
}
