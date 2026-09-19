import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

describe("objectListClassName", () => {
  it("is a paper list shell with a ring instead of a heavy border", () => {
    expect(objectListClassName).toContain("rounded-2xl");
    expect(objectListClassName).toContain("ring-1");
    expect(objectListClassName).toContain("divide-y");
    expect(objectListClassName).not.toMatch(/(^|\s)border(\s|$)/);
  });
});

describe("objectListRowClassName", () => {
  it("includes the base row classes and optional extras", () => {
    expect(objectListRowClassName()).toContain("min-h-11");
    expect(objectListRowClassName("text-red-500")).toContain("text-red-500");
  });
});

describe("FilterablePaginatedList pagination chrome", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "filterable-paginated-list.tsx"),
    "utf8",
  );

  it("hides page-size and previous/next when there is only one page", () => {
    expect(source).toContain("totalPages > 1");
    expect(source).toContain("showPagination");
    expect(source).toContain("Rows per page");
  });
});
