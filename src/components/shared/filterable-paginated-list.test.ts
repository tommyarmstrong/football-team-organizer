import { describe, expect, it } from "vitest";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

describe("objectListClassName", () => {
  it("is a bordered list shell without card chrome", () => {
    expect(objectListClassName).toContain("rounded-2xl");
    expect(objectListClassName).toContain("border");
    expect(objectListClassName).toContain("divide-y");
  });
});

describe("objectListRowClassName", () => {
  it("includes the base row classes and optional extras", () => {
    expect(objectListRowClassName()).toContain("min-h-12");
    expect(objectListRowClassName("text-red-500")).toContain("text-red-500");
  });
});
