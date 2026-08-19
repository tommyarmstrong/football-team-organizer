"use client";

import { useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { objectListClassName } from "@/components/shared/object-list";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

export type ListPageSize = (typeof PAGE_SIZE_OPTIONS)[number] | "all";

export function FilterablePaginatedList<T>({
  items,
  getSearchText,
  renderItem,
  filterPlaceholder = "Filter by name…",
  emptyFilterTitle = "No matches",
  emptyFilterDescription = "Try a different name.",
  listClassName = objectListClassName,
  getItemKey,
  defaultPageSize = 20,
  singularLabel,
  pluralLabel,
  totalCountPhrase = "in total",
}: {
  items: T[];
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  filterPlaceholder?: string;
  emptyFilterTitle?: string;
  emptyFilterDescription?: string;
  listClassName?: string;
  getItemKey: (item: T) => string;
  defaultPageSize?: ListPageSize;
  singularLabel: string;
  pluralLabel: string;
  /** Phrase after the count, e.g. "in this squad" instead of "in total". */
  totalCountPhrase?: string;
}) {
  const idPrefix = useId();
  const filterId = `${idPrefix}-filter`;
  const pageSizeId = `${idPrefix}-page-size`;
  const [filter, setFilter] = useState("");
  const [pageSize, setPageSize] = useState<ListPageSize>(defaultPageSize);
  const [page, setPage] = useState(1);

  const normalizedFilter = filter.trim().toLowerCase();
  const filtered = normalizedFilter
    ? items.filter((item) =>
        getSearchText(item).toLowerCase().includes(normalizedFilter),
      )
    : items;

  const total = filtered.length;
  const size = pageSize === "all" ? Math.max(total, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * size;
  const pageItems = filtered.slice(startIndex, startIndex + size);
  const showPagination = pageSize !== "all" && totalPages > 1;
  const totalNoun = total === 1 ? singularLabel : pluralLabel;

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(value === "all" ? "all" : (Number(value) as ListPageSize));
    setPage(1);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={filterId} className="sr-only">
          {filterPlaceholder}
        </Label>
        <Input
          id={filterId}
          type="search"
          value={filter}
          onChange={(event) => handleFilterChange(event.target.value)}
          placeholder={filterPlaceholder}
          autoComplete="off"
        />
      </div>

      {total === 0 ? (
        <EmptyState
          title={emptyFilterTitle}
          description={emptyFilterDescription}
        />
      ) : (
        <>
          <ul className={listClassName}>
            {pageItems.map((item) => (
              <li key={getItemKey(item)}>{renderItem(item)}</li>
            ))}
          </ul>

          <div className="text-muted-foreground flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {total} {totalNoun} {totalCountPhrase}
                {normalizedFilter ? ` (filtered from ${items.length})` : ""}
              </p>
              <div className="flex items-center gap-2 sm:justify-end">
                <Label
                  htmlFor={pageSizeId}
                  className="text-muted-foreground shrink-0 font-normal"
                >
                  Rows per page
                </Label>
                <NativeSelect
                  id={pageSizeId}
                  className="w-auto min-w-20"
                  value={pageSize === "all" ? "all" : String(pageSize)}
                  onChange={(event) => handlePageSizeChange(event.target.value)}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="all">All</option>
                </NativeSelect>
              </div>
            </div>

            {showPagination ? (
              <nav
                className="flex items-center justify-between gap-3 sm:justify-end"
                aria-label="Pagination"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${idPrefix}-page`} className="sr-only">
                    Page
                  </Label>
                  <NativeSelect
                    id={`${idPrefix}-page`}
                    className="w-auto min-w-16"
                    value={String(currentPage)}
                    onChange={(event) => setPage(Number(event.target.value))}
                    aria-label="Page"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <option key={pageNumber} value={pageNumber}>
                          {pageNumber}
                        </option>
                      ),
                    )}
                  </NativeSelect>
                  <span className="tabular-nums">of {totalPages}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
