"use client";

import { SharePostcardButton } from "@/components/postcards/share-postcard-button";

export function MatchCardShare({
  matchId,
  kind,
}: {
  matchId: string;
  kind: "scheduled" | "played";
}) {
  const scheduled = kind === "scheduled";
  return (
    <SharePostcardButton
      imageUrl={`/matches/${matchId}/postcard`}
      metaUrl={`/matches/${matchId}/postcard/meta`}
      title={scheduled ? "Fixture postcard" : "Match postcard"}
      description={
        scheduled
          ? "Share this upcoming fixture, including the venue address."
          : "Share a recap of this result. Player names follow the team’s privacy rules."
      }
      previewAlt={scheduled ? "Fixture postcard" : "Match postcard"}
    />
  );
}
