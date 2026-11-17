import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () =>
  (await import("@/components/matches/match-card-test-utils")).nextLinkMock(),
);

import {
  dateRowHtml,
  renderCard,
} from "@/components/matches/match-card-test-utils";
import {
  MatchCardMeta,
  matchCardMetaClassName,
  matchDateRowParts,
} from "@/components/matches/match-card-meta";

const meta = {
  competition: "Premier League",
  venue: "Wembley",
  dateTime: "Sun 15 Mar",
  meetup: "Meet up: 09:30",
  kickoff: "Kick off: 10:00",
};

describe("matchDateRowParts", () => {
  it("keeps date, meet up, kick off in order", () => {
    expect(matchDateRowParts(meta)).toEqual([
      "Sun 15 Mar",
      "Meet up: 09:30",
      "Kick off: 10:00",
    ]);
  });

  it("drops missing parts", () => {
    expect(
      matchDateRowParts({ ...meta, meetup: null, kickoff: "Kick off: 10:00" }),
    ).toEqual(["Sun 15 Mar", "Kick off: 10:00"]);
    expect(matchDateRowParts({ ...meta, meetup: null, kickoff: null })).toEqual(
      ["Sun 15 Mar"],
    );
  });
});

describe("MatchCardMeta", () => {
  it("is centred, muted and one font size", () => {
    const className = matchCardMetaClassName();
    expect(className).toContain("text-center");
    expect(className).toContain("text-muted-foreground");
    expect(className).toContain("text-xs");
    expect(className).toContain("sm:text-sm");
  });

  it("separates the date row with aria-hidden dots only between parts", () => {
    const html = renderCard(createElement(MatchCardMeta, { meta }));
    expect(dateRowHtml(html).match(/aria-hidden="true">·</g)?.length).toBe(2);
  });

  it("links the venue only when given a href", () => {
    expect(renderCard(createElement(MatchCardMeta, { meta }))).not.toContain(
      "<a",
    );
    const linked = renderCard(
      createElement(MatchCardMeta, { meta, venueHref: "/venues/v1" }),
    );
    expect(linked).toContain('<a href="/venues/v1"');
    expect(linked).toContain("max-sm:py-2");
  });
});
