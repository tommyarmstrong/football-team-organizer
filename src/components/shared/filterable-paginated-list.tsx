"use client";

import { useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type PageSize = (typeof PAGE_SIZE_OPTIONS)[number] | "all";

export function FilterablePaginatedList<T>({
  items,
  getSearchText,
  renderItem,
  filterPlaceholder = "Filter by name…",
  filterLabel = "Filter",
  emptyFilterTitle = "No matches",
  emptyFilterDescription = "Try a different name.",
  listClassName = "divide-border border-border divide-y rounded-xl border",
  getItemKey,
}: {
  items: T[];
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  filterPlaceholder?: string;
  filterLabel?: string;
  emptyFilterTitle?: string;
  emptyFilterDescription?: string;
  listClassName?: string;
  getItemKey: (item: T) => string;
}) {
  const idPrefix = useId();
  const filterId = `${idPrefix}-filter`;
  const pageSizeId = `${idPrefix}-page-size`;
  const [filter, setFilter] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>(20);
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
  const endIndex = Math.min(startIndex + size, total);
  const pageItems = filtered.slice(startIndex, endIndex);

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(value === "all" ? "all" : (Number(value) as PageSize));
    setPage(1);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={filterId}>{filterLabel}</Label>
          <Input
            id={filterId}
            type="search"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            placeholder={filterPlaceholder}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2 sm:w-36">
          <Label htmlFor={pageSizeId}>Page size</Label>
          <NativeSelect
            id={pageSizeId}
            value={pageSize === "all" ? "all" : String(pageSize)}
            onChange={(event) => handlePageSizeChange(event.target.value)}
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

          <div className="text-muted-foreground flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              {startIndex + 1}–{endIndex} of {total}
              {normalizedFilter ? ` (filtered from ${items.length})` : ""}
            </p>
            {pageSize !== "all" && totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
