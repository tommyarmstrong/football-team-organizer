import type { Venue } from "@/lib/supabase/database.types";
import { formatVenueAddress } from "@/lib/format";

type VenueLocation = Pick<
  Venue,
  "name" | "address_line1" | "address_line2" | "town_city" | "postcode"
>;

/** Search query for Google Maps, built from the venue name and address. */
export function venueMapsQuery(venue: VenueLocation): string | null {
  const address = formatVenueAddress(venue);
  if (!address) return null;

  const name = venue.name.trim();
  if (!name) return address;

  // Avoid duplicating the name when it is already the first address line.
  if (address.toLowerCase().startsWith(name.toLowerCase())) {
    return address;
  }

  return `${name}, ${address}`;
}

/** Opens Google Maps search for the venue location. */
export function googleMapsSearchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Embeddable Google Maps view for the venue location.
 * Uses the Maps Embed API when `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` is set;
 * otherwise falls back to the maps query embed.
 */
export function googleMapsEmbedUrl(query: string): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  if (apiKey) {
    const params = new URLSearchParams({ key: apiKey, q: query });
    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  const params = new URLSearchParams({ q: query, output: "embed" });
  return `https://www.google.com/maps?${params.toString()}`;
}
