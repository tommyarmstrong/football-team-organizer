import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SquadPlayerIdentity } from "@/components/shared/squad-player-identity";

const source = readFileSync(
  path.join(import.meta.dirname, "squad-player-identity.tsx"),
  "utf8",
);

describe("SquadPlayerIdentity", () => {
  it("shows a kit badge then the full name, without initials", () => {
    expect(source).not.toContain("InitialsAvatar");
    expect(source).toContain("font-display");
    expect(source).toContain("bg-primary/10");
    expect(source).toContain('shirtNumber ?? "—"');
    expect(source).toContain("truncate font-medium");
    expect(source).not.toContain("w-[2ch]");
  });

  it("places a trailing chip after the name", () => {
    const html = renderToStaticMarkup(
      createElement(SquadPlayerIdentity, {
        name: "Ada Ace",
        shirtNumber: 7,
        trailing: "Inactive",
      }),
    );
    expect(html.indexOf("Ada Ace")).toBeLessThan(html.indexOf("Inactive"));
    expect(html).toContain(">7<");
  });
});
