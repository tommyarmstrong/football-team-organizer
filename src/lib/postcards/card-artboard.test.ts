import { createElement, type CSSProperties } from "react";
import { ImageResponse } from "next/og";
import { describe, expect, it } from "vitest";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardArtboard,
  REPORT_EXTRA_LINE_FONT_SIZE,
  REPORT_TEAM_LINE_FONT_SIZE,
  reportTeamLineFontSize,
  type CardArtboardProps,
} from "@/lib/postcards/card-artboard";
import { CoachCardImage } from "@/lib/postcards/coach-card-image";
import { PlayerCardImage } from "@/lib/postcards/player-card-image";
import type {
  CoachCardPayload,
  PlayerCardPayload,
} from "@/lib/postcards/types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const props: CardArtboardProps = {
  clubColour: "#1B4D8E",
  crestSrc: null,
  pill: "U11",
  topName: "Maya",
  mainName: "Jones",
  subtitle: "Forward",
  stats: [{ label: "Apps", value: 14 }],
  clubName: "Mill Green Athletic",
  teamLine: "U11 Girls · 2025/26",
  extraLine: "Goals 9 · Assists 4 · POTM 2",
};

type Node = { type?: unknown; props?: { children?: unknown; style?: unknown } };

/** The style of the element whose only child is exactly `text`, or null. */
function styleOfText(tree: unknown, text: string): CSSProperties | null {
  let found: CSSProperties | null = null;
  const walk = (node: unknown) => {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const { props: nodeProps } = node as Node;
    if (nodeProps?.children === text) {
      found = (nodeProps.style as CSSProperties) ?? {};
      return;
    }
    walk(nodeProps?.children);
  };
  walk(tree);
  return found;
}

describe("share card footer", () => {
  const tree = cardArtboard(props);

  it("still shows the club name above the team line", () => {
    expect(styleOfText(tree, "Mill Green Athletic")).toMatchObject({
      fontSize: 40,
      fontWeight: 700,
    });
  });

  it("keeps the team and extra lines at their original size", () => {
    const team = styleOfText(tree, "U11 Girls · 2025/26");
    expect(team).toMatchObject({ fontSize: 30 });
    expect(team?.fontWeight).toBeUndefined();
    expect(styleOfText(tree, "Goals 9 · Assists 4 · POTM 2")).toMatchObject({
      fontSize: 30,
    });
  });
});

describe("report card footer", () => {
  const tree = cardArtboard({ ...props, variant: "report" });

  it("leaves out the club name", () => {
    expect(styleOfText(tree, "Mill Green Athletic")).toBeNull();
    expect(JSON.stringify(tree)).not.toContain("Mill Green Athletic");
  });

  it("makes the team name and year bold and bigger than the share card", () => {
    const team = styleOfText(tree, "U11 Girls · 2025/26");
    expect(team).toMatchObject({
      fontSize: REPORT_TEAM_LINE_FONT_SIZE,
      fontWeight: 700,
    });
    expect(REPORT_TEAM_LINE_FONT_SIZE).toBeGreaterThan(30);
  });

  it("makes the goals, assists and POTM line bigger than the share card", () => {
    const extra = styleOfText(tree, "Goals 9 · Assists 4 · POTM 2");
    expect(extra).toMatchObject({ fontSize: REPORT_EXTRA_LINE_FONT_SIZE });
    expect(REPORT_EXTRA_LINE_FONT_SIZE).toBeGreaterThan(30);
  });

  it("keeps the rest of the card the same", () => {
    expect(styleOfText(tree, "U11")).toMatchObject({ fontSize: 40 });
  });
});

describe("reportTeamLineFontSize", () => {
  it("uses the full size for a normal team line", () => {
    expect(reportTeamLineFontSize("U11 Girls · 2025/26")).toBe(
      REPORT_TEAM_LINE_FONT_SIZE,
    );
  });

  it("steps down for long team names so they stay on one line", () => {
    const medium = reportTeamLineFontSize("Rangers U10 Lions · 2025/26");
    const long = reportTeamLineFontSize(
      "Under Eleven Girls Development · 2025/26",
    );
    expect(medium).toBeLessThan(REPORT_TEAM_LINE_FONT_SIZE);
    expect(long).toBeLessThan(medium);
  });
});

const player: PlayerCardPayload = {
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
  fileName: "maya.png",
};

const coach: CoachCardPayload = {
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
    played: 20,
    wins: 12,
    draws: 4,
    losses: 4,
    goalsFor: 31,
    goalsAgainst: 17,
  },
  caption: "Grace",
  fileName: "grace.png",
};

describe("report variant on player and coach cards", () => {
  it("drops the club name from both", () => {
    for (const tree of [
      PlayerCardImage({ payload: player, crestSrc: null, variant: "report" }),
      CoachCardImage({ payload: coach, crestSrc: null, variant: "report" }),
    ]) {
      expect(JSON.stringify(tree)).not.toContain("Mill Green Athletic");
      expect(styleOfText(tree, "U11 Girls · 2025/26")).toMatchObject({
        fontWeight: 700,
        fontSize: REPORT_TEAM_LINE_FONT_SIZE,
      });
    }
  });

  it("defaults to the share card, club name included", () => {
    for (const tree of [
      PlayerCardImage({ payload: player, crestSrc: null }),
      CoachCardImage({ payload: coach, crestSrc: null }),
    ]) {
      expect(JSON.stringify(tree)).toContain("Mill Green Athletic");
    }
  });

  // The first Satori render loads fonts and WASM, which can be slow.
  it("still renders to a PNG", async () => {
    for (const element of [
      createElement(PlayerCardImage, {
        payload: player,
        crestSrc: null,
        variant: "report",
      }),
      createElement(CoachCardImage, {
        payload: coach,
        crestSrc: null,
        variant: "report",
      }),
    ]) {
      const response = new ImageResponse(element, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      });
      const png = Buffer.from(await response.arrayBuffer());
      expect(png.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
    }
  }, 30_000);
});
