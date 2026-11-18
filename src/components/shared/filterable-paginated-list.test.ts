import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
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

  it("leaves rows out of the total when countInTotal says so", () => {
    type Row = { id: string; name: string; active: boolean };
    const List = FilterablePaginatedList<Row>;
    const html = renderToStaticMarkup(
      createElement(List, {
        items: [
          { id: "1", name: "Ada Ace", active: true },
          { id: "2", name: "Bea Best", active: false },
          { id: "3", name: "Cleo Cross", active: true },
        ],
        getItemKey: (item) => item.id,
        getSearchText: (item) => item.name,
        singularLabel: "player",
        pluralLabel: "players",
        totalCountPhrase: "in this squad",
        countInTotal: (item) => item.active,
        renderItem: (item) => item.name,
      }),
    );
    expect(html).toContain("Ada Ace");
    expect(html).toContain("Bea Best");
    expect(html).toContain("2 players in this squad");
    expect(html).not.toContain("3 players in this squad");
  });
});
