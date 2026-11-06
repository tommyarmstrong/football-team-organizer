import { sortSquad } from "@/lib/report/summary";
import type { CoachCardView, PlayerCardView } from "@/lib/postcards/types";
import type { ReportData } from "@/lib/report/types";

/** One card in the Player Gallery. */
export type GalleryEntry =
  | { kind: "coach"; id: string; label: string; card: CoachCardView }
  | { kind: "player"; id: string; label: string; card: PlayerCardView };

/**
 * Every card in gallery order: the coaching staff first (head coach, then the
 * other coaches), then the players by shirt number. A player with no league
 * or cup match has no card.
 */
export function galleryEntries(
  data: Pick<ReportData, "coaches" | "players">,
): GalleryEntry[] {
  return [
    ...data.coaches.map((c): GalleryEntry => ({
      kind: "coach",
      id: `coach-${c.id}`,
      label: c.role ? `${c.name}, ${c.role}` : c.name,
      card: c.card,
    })),
    ...sortSquad(data.players)
      .filter((p) => p.appearances > 0)
      .map((p): GalleryEntry => ({
        kind: "player",
        id: `player-${p.id}`,
        label: p.name,
        card: p.card,
      })),
  ];
}
