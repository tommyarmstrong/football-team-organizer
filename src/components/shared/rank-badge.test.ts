import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RankBadge } from "@/components/shared/rank-badge";

describe("RankBadge", () => {
  it("paints first, second, and third as gold, silver, and bronze", () => {
    const html = [1, 2, 3]
      .map((rank) => renderToStaticMarkup(createElement(RankBadge, { rank })))
      .join("\n");

    expect(html).toContain("bg-[#F5C518]");
    expect(html).toContain("text-[#3F2E00]");
    expect(html).toContain("bg-[#C0C6CE]");
    expect(html).toContain("text-[#1F252B]");
    expect(html).toContain("bg-[#CD7F32]");
    expect(html).toContain("text-[#2A1606]");
    expect(html).not.toContain("bg-draw");
    expect(html).not.toContain("bg-muted");
    expect(html).not.toContain("/20");
  });
});
