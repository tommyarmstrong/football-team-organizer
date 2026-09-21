import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("match detail page", () => {
  it("opens match edit in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("EditMatchDialog");
    expect(source).not.toContain("href={`/matches/${match.id}/edit`}");
    expect(source).toContain("meetupTime={match.meetup_time}");
  });
});
