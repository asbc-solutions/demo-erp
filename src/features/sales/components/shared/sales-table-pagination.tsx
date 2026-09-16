"use client"

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/src/shared/components/ui/pagination"
import { cn } from "@/src/shared/lib/utils/utils"

type SalesTablePaginationProps = Readonly<{
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  /** Plural noun for the "Showing X-Y of Z {itemLabel}" line, e.g. "customers". */
  itemLabel: string
  className?: string
}>

/** Builds the page tokens to render, collapsing long ranges with ellipses. */
function pageTokens(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const tokens: (number | "ellipsis")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) tokens.push("ellipsis")
  for (let p = start; p <= end; p++) tokens.push(p)
  if (end < total - 1) tokens.push("ellipsis")
  tokens.push(total)
  return tokens
}

export function SalesTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemLabel,
  className,
}: SalesTablePaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className,
      )}
    >
      <p className="text-sm text-content-tertiary">
        Showing <span className="font-medium text-content-primary">{from}</span>–
        <span className="font-medium text-content-primary">{to}</span> of{" "}
        <span className="font-medium text-content-primary">{total}</span> {itemLabel}
      </p>

      {pageCount > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              />
            </PaginationItem>

            {pageTokens(page, pageCount).map((token, index) =>
              token === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={token}>
                  <PaginationButton
                    isActive={token === page}
                    onClick={() => onPageChange(token)}
                  >
                    {token}
                  </PaginationButton>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                disabled={page >= pageCount}
                onClick={() => onPageChange(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
