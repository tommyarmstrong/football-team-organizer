import { describe, expect, it } from "vitest";
import { getVisiblePageNumbers } from "@/components/shared/filterable-paginated-list";

describe("getVisiblePageNumbers", () => {
  it("lists every page when there are few pages", () => {
    expect(getVisiblePageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps a window around the current page with ellipses", () => {
    expect(getVisiblePageNumbers(6, 12)).toEqual([
      1,
      "ellipsis",
      5,
      6,
      7,
      "ellipsis",
      12,
    ]);
  });

  it("expands early pages without a leading ellipsis", () => {
    expect(getVisiblePageNumbers(2, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
  });

  it("expands late pages without a trailing ellipsis", () => {
    expect(getVisiblePageNumbers(11, 12)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      12,
    ]);
  });
});
