"use client"

import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

type FinanceTablePaginationProps = Readonly<{
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  /** Plural noun for the "Showing X-Y of Z {itemLabel}" line, e.g. "invoices". */
  itemLabel: string
  className?: string
}>

/** Matches the Previous/Next footer style already used across Finance tables. */
export function FinanceTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemLabel,
  className,
}: FinanceTablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-stroke-default px-6 py-4",
        className,
      )}
    >
      <p className="text-xs leading-[18px] text-content-quaternary">
        Showing {from}–{to} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg bg-[#fafafa] text-[12px] text-content-quaternary disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg bg-[#fafafa] text-[12px] text-content-quaternary disabled:opacity-50"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
