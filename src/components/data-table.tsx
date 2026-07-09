"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

type SortDirection = "asc" | "desc";

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize: initialPageSize = 10,
  pageSizeOptions,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = useCallback((columnKey: string) => {
    setSort((prev) => {
      if (prev.column === columnKey) {
        return { column: columnKey, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column: columnKey, direction: "asc" };
    });
    setCurrentPage(1);
  }, []);

  const sortedData = useMemo(() => {
    if (!sort.column) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.column!];
      const bVal = b[sort.column!];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sort.direction === "asc" ? -1 : 1;
      if (bVal == null) return sort.direction === "asc" ? 1 : -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border bg-background", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-foreground">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-foreground",
                    col.sortable && "cursor-pointer select-none hover:bg-muted/80 transition-colors"
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sort.column === col.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col" aria-hidden="true">
                        <ChevronUp
                          className={cn(
                            "size-3 -mb-0.5",
                            sort.column === col.key && sort.direction === "asc"
                              ? "text-primary"
                              : "text-muted-foreground/40"
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "size-3 -mt-0.5",
                            sort.column === col.key && sort.direction === "desc"
                              ? "text-primary"
                              : "text-muted-foreground/40"
                          )}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border last:border-b-0 transition-colors hover:bg-muted/30",
                    rowIndex % 2 === 0 ? "bg-background" : "bg-muted/50"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {sortedData.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-3 text-sm text-foreground">
            {safeCurrentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
