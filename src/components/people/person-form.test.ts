import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("person form labels", () => {
  const person = readFileSync(
    path.join(import.meta.dirname, "person-form.tsx"),
    "utf8",
  );
  const player = readFileSync(
    path.join(import.meta.dirname, "../players/player-form.tsx"),
    "utf8",
  );
  const personPage = readFileSync(
    path.join(import.meta.dirname, "../../app/(app)/people/[id]/page.tsx"),
    "utf8",
  );

  it("calls the player field playing position", () => {
    expect(person).toContain("Playing position <OptionalHint />");
    expect(player).toContain("Playing position <OptionalHint />");
    expect(person).not.toContain("Position <OptionalHint />");
  });

  it("titles the coach assignment section Coach teams", () => {
    expect(personPage).toContain(
      'title="Coach teams" description="This coach\'s teams"',
    );
  });
});
