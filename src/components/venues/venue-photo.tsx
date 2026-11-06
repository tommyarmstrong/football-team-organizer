import type { Venue } from "@/lib/supabase/database.types";

/**
 * Venue photo shown above the Location section. Always cropped to 16:9
 * (`object-cover`), the same shape as the map below it.
 */
export function VenuePhoto({
  venue,
}: {
  venue: Pick<Venue, "name" | "photo_url">;
}) {
  if (!venue.photo_url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={venue.photo_url}
      alt={`Photo of ${venue.name}`}
      className="venue-photo ring-foreground/10 aspect-video w-full rounded-xl object-cover ring-1"
    />
  );
}
