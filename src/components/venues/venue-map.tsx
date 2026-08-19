import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import {
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
  venueMapsQuery,
} from "@/lib/maps";
import type { Venue } from "@/lib/supabase/database.types";

export function VenueMap({ venue }: { venue: Venue }) {
  const query = venueMapsQuery(venue);
  if (!query) return null;

  const mapsUrl = googleMapsSearchUrl(query);
  const embedSrc = googleMapsEmbedUrl(query);

  return (
    <Section
      title="Location"
      description="Map for this venue from Google Maps."
    >
      <div className="space-y-4">
        <div className="border-border aspect-video overflow-hidden rounded-lg border">
          <iframe
            title={`Map of ${venue.name}`}
            src={embedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Open in Google Maps
        </a>
      </div>
    </Section>
  );
}
