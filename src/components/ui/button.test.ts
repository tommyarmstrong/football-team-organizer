import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

describe("buttonVariants", () => {
  it("sizes to the label so a column flex parent does not stretch it", () => {
    const tokens = buttonVariants().split(/\s+/);
    expect(tokens).toContain("w-fit");
    expect(tokens).toContain("max-w-full");
    expect(tokens).not.toContain("w-full");
  });

  it("keeps icon buttons square", () => {
    const tokens = cn(buttonVariants({ size: "icon" })).split(/\s+/);
    expect(tokens).toContain("size-8");
    expect(tokens).not.toContain("w-fit");
  });

  it("still fills a content-sized grid cell when a caller passes w-full", () => {
    const tokens = cn(buttonVariants(), "w-full").split(/\s+/);
    expect(tokens).toContain("w-full");
    expect(tokens).not.toContain("w-fit");
  });
});
