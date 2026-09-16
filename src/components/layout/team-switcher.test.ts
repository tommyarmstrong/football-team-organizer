import { describe, expect, it } from "vitest";
import {
  TEAM_PICKER_DASHBOARD_HREF,
  teamPickerSelection,
} from "@/components/layout/team-switcher";

describe("teamPickerSelection", () => {
  it("ignores clicks while a switch is already in flight", () => {
    expect(teamPickerSelection("team-b", "team-a", true)).toBe("ignore");
  });

  it("dismisses the menu when the current team is chosen again", () => {
    expect(teamPickerSelection("team-a", "team-a")).toBe("dismiss");
  });

  it("switches to the dashboard when a different team is chosen", () => {
    expect(teamPickerSelection("team-b", "team-a")).toBe("switch-to-dashboard");
    expect(TEAM_PICKER_DASHBOARD_HREF).toBe("/dashboard");
  });
});
