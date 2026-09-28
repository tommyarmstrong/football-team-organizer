import { createElement } from "react";
import { ImageResponse } from "next/og";
import { describe, expect, it } from "vitest";
import {
  bannerNameFontSize,
  mixColour,
  PLAYER_CARD_HEIGHT,
  PLAYER_CARD_WIDTH,
  PlayerCardImage,
} from "@/lib/postcards/player-card-image";
import type { PlayerCardPayload } from "@/lib/postcards/types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const basePayload: PlayerCardPayload = {
  playerId: "player-1",
  teamId: "team-1",
  clubName: "Mill Green Athletic",
  clubColour: "#1B4D8E",
  clubIconUrl: null,
  teamName: "U11 Girls",
  ageGroup: "U11",
  seasonLabel: "2025/26",
  firstName: "Maya",
  lastName: null,
  shirtNumber: 7,
  positionLabel: "Forward",
  stats: {
    appearances: 14,
    wins: 8,
    draws: 3,
    losses: 3,
    goals: 9,
    assists: 4,
    potm: 2,
  },
  caption: "Maya 7",
  fileName: "maya-u11-girls-2025-26-player-card.png",
};

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Renders through Satori for real: a bad layout only fails loudly here, since
 * the route streams the body.
 */
async function renderCard(
  payload: PlayerCardPayload,
  crestSrc: string | null = null,
) {
  const response = new ImageResponse(
    createElement(PlayerCardImage, { payload, crestSrc }),
    { width: PLAYER_CARD_WIDTH, height: PLAYER_CARD_HEIGHT },
  );
  return Buffer.from(await response.arrayBuffer());
}

describe("player card artboard", () => {
  it("is portrait 4:5 for WhatsApp and Instagram", () => {
    expect(PLAYER_CARD_WIDTH / PLAYER_CARD_HEIGHT).toBeCloseTo(4 / 5);
  });
});

describe("mixColour", () => {
  it("blends towards the target", () => {
    expect(mixColour("#FF0000", "#000000", 0)).toBe("#ff0000");
    expect(mixColour("#FF0000", "#000000", 1)).toBe("#000000");
    expect(mixColour("#FF0000", "#000000", 0.5)).toBe("#800000");
    expect(mixColour("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe("bannerNameFontSize", () => {
  it("shrinks long names so they stay on one line", () => {
    expect(bannerNameFontSize("Maya")).toBe(112);
    expect(bannerNameFontSize("Alexandra")).toBe(94);
    expect(bannerNameFontSize("Christopher")).toBe(94);
    expect(bannerNameFontSize("Hall-Thompson")).toBe(76);
    expect(bannerNameFontSize("Bartholomew-James")).toBe(60);
  });
});

describe("PlayerCardImage", () => {
  const cases: Array<[string, PlayerCardPayload]> = [
    ["a youth player", basePayload],
    [
      "an adult player with a surname",
      {
        ...basePayload,
        firstName: "Jonathan",
        lastName: "Hall-Thompson",
        teamName: "England Women",
        ageGroup: "Adults",
        shirtNumber: 10,
        positionLabel: "Midfielder",
      },
    ],
    [
      "no club colour, shirt number, or position",
      {
        ...basePayload,
        clubColour: null,
        shirtNumber: null,
        positionLabel: null,
        stats: {
          appearances: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          potm: 0,
        },
      },
    ],
    ["a three digit shirt number", { ...basePayload, shirtNumber: 100 }],
    [
      "very long names",
      {
        ...basePayload,
        clubName:
          "The Very Long Named Village Athletic and Social Football Club",
        teamName: "Under Eleven Girls Development Squad Section A",
        firstName: "Bartholomew-James-Alexander",
      },
    ],
    ["a pale club colour", { ...basePayload, clubColour: "#FFD100" }],
    ["a dark club colour", { ...basePayload, clubColour: "#000000" }],
    [
      "large stats",
      {
        ...basePayload,
        stats: {
          appearances: 120,
          wins: 80,
          draws: 20,
          losses: 20,
          goals: 87,
          assists: 45,
          potm: 12,
        },
      },
    ],
  ];

  it.each(cases)("renders a PNG for %s", async (_label, payload) => {
    const png = await renderCard(payload);
    expect(png.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });

  it("renders with a crest image", async () => {
    const png = await renderCard(basePayload, tinyPng);
    expect(png.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });
});
