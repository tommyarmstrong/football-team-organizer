import { createElement } from "react";
import { ImageResponse } from "next/og";
import { describe, expect, it } from "vitest";
import {
  COACH_CARD_HEIGHT,
  COACH_CARD_WIDTH,
  CoachCardImage,
} from "@/lib/postcards/coach-card-image";
import type { CoachCardPayload } from "@/lib/postcards/types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const basePayload: CoachCardPayload = {
  coachId: "coach-1",
  teamId: "team-1",
  clubName: "Mill Green Athletic",
  clubColour: "#1B4D8E",
  clubIconUrl: null,
  teamName: "U11 Girls",
  ageGroup: "U11",
  seasonLabel: "2025/26",
  firstName: "Grace",
  lastName: "Hopper",
  roleLabel: "Head Coach",
  stats: {
    played: 14,
    wins: 8,
    draws: 3,
    losses: 3,
    goalsFor: 31,
    goalsAgainst: 17,
  },
  caption: "Grace Hopper · Head Coach",
  fileName: "grace-hopper-u11-girls-2025-26-coach-card.png",
};

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Renders through Satori for real: a bad layout only fails loudly here. */
async function renderCard(
  payload: CoachCardPayload,
  crestSrc: string | null = null,
  photoSrc: string | null = null,
) {
  const response = new ImageResponse(
    createElement(CoachCardImage, { payload, crestSrc, photoSrc }),
    { width: COACH_CARD_WIDTH, height: COACH_CARD_HEIGHT },
  );
  return Buffer.from(await response.arrayBuffer());
}

describe("coach card artboard", () => {
  it("is portrait 4:5 for WhatsApp and Instagram", () => {
    expect(COACH_CARD_WIDTH / COACH_CARD_HEIGHT).toBeCloseTo(4 / 5);
  });
});

/** Every string in the element tree, expanding function components. */
function textOf(node: unknown): string[] {
  const out: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (typeof value === "string") out.push(value);
    if (!value || typeof value !== "object") return;
    const element = value as {
      type?: unknown;
      props?: { children?: unknown };
    };
    if (typeof element.type === "function") {
      walk((element.type as (props: unknown) => unknown)(element.props));
      return;
    }
    walk(element.props?.children);
  };
  walk(node);
  return out;
}

describe("CoachCardImage content", () => {
  it("shows the full name, role, record labels, and goals", () => {
    const text = textOf(
      CoachCardImage({ payload: basePayload, crestSrc: null }),
    );
    expect(text).toEqual(
      expect.arrayContaining([
        "Grace",
        "Hopper",
        "Head Coach",
        "Played",
        "Wins",
        "Draws",
        "Losses",
        "Goals for 31 · Goals against 17",
        "U11",
      ]),
    );
  });

  it("has no shirt number badge", () => {
    const names: string[] = [];
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      const element = node as {
        type?: unknown;
        props?: { children?: unknown };
      };
      if (typeof element.type === "function") names.push(element.type.name);
      walk(element.props?.children);
    };
    walk(CoachCardImage({ payload: basePayload, crestSrc: null }));
    expect(names).not.toContain("ShirtBadge");
    expect(names).toContain("Banner");
  });

  it("drops the first name line when there is no surname", () => {
    const text = textOf(
      CoachCardImage({
        payload: { ...basePayload, lastName: null },
        crestSrc: null,
      }),
    );
    expect(text.filter((part) => part === "Grace")).toHaveLength(1);
  });
});

// The first Satori render loads fonts and WASM, which can exceed the default
// 5s timeout when the whole suite runs in parallel.
describe("CoachCardImage", { timeout: 30_000 }, () => {
  const cases: Array<[string, CoachCardPayload]> = [
    ["a coach with a surname", basePayload],
    ["a coach without a surname", { ...basePayload, lastName: null }],
    ["no club colour", { ...basePayload, clubColour: null }],
    [
      "very long names",
      {
        ...basePayload,
        clubName:
          "The Very Long Named Village Athletic and Social Football Club",
        teamName: "Under Eleven Girls Development Squad Section A",
        firstName: "Bartholomew-James-Alexander",
        lastName: "Featherstonehaugh-Cholmondeley",
        roleLabel: "Goalkeeping and Fitness Development Coach",
      },
    ],
    ["a pale club colour", { ...basePayload, clubColour: "#FFD100" }],
    [
      "a record of zeros",
      {
        ...basePayload,
        stats: {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        },
      },
    ],
  ];

  it.each(cases)("renders a PNG for %s", async (_label, payload) => {
    const png = await renderCard(payload);
    expect(png.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });

  it("renders with a crest image and photo-area artwork", async () => {
    const png = await renderCard(basePayload, tinyPng, tinyPng);
    expect(png.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });
});
