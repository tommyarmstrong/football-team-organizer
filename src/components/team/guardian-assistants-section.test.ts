import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "guardian-assistants-section.tsx"),
  "utf8",
);

describe("GuardianAssistantsSection", () => {
  it("does not tell a manager to assign a guardian for goals", () => {
    expect(source).not.toContain(
      "Assign a guardian with a linked login so they can record goals during matches.",
    );
    expect(source).toContain(
      "Guardian assistants for this team will appear here.",
    );
  });
});
