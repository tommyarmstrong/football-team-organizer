import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { missingEmergencyContact } from "@/components/people/people-directory-list";

const source = readFileSync(
  path.join(import.meta.dirname, "people-directory-list.tsx"),
  "utf8",
);

describe("PeopleDirectoryList", () => {
  it("renders initials from the name and never a shirt number", () => {
    expect(source).toContain("InitialsAvatar");
    expect(source).toContain('className="size-10"');
    expect(source).not.toMatch(/shirt/i);
  });

  it("keeps the name as the row accessible label", () => {
    expect(source).toContain("aria-label={name}");
    expect(source).toContain("aria-hidden");
  });

  it("shows a warning chip when a player has no emergency contact", () => {
    expect(source).toContain("No emergency contact");
    expect(source).toContain("TriangleAlertIcon");
    expect(source).toContain("text-destructive");
    expect(
      missingEmergencyContact({
        roles: {
          player: true,
          guardian: false,
          coach: false,
          manager: false,
        },
        emergency_contact: null,
      }),
    ).toBe(true);
    expect(
      missingEmergencyContact({
        roles: {
          player: true,
          guardian: false,
          coach: false,
          manager: false,
        },
        emergency_contact: {
          first_name: "Sam",
          last_name: "Lee",
          phone: "01234",
        },
      }),
    ).toBe(false);
  });
});
