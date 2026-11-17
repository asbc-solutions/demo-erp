"use client"

import { useTranslations } from "next-intl"

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

type ComplianceTablePaginationProps = Readonly<{
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  /** What is being paged, for the "Showing X–Y of Z …" line. */
  itemKind: "members" | "events" | "policies"
  className?: string
}>

const SHOWING_KEY = {
  members: "showingMembers",
  events: "showingEvents",
  policies: "showingPolicies",
} as const

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

export function ComplianceTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemKind,
  className,
}: ComplianceTablePaginationProps) {
  const t = useTranslations("Compliance")

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
        {t.rich(SHOWING_KEY[itemKind], {
          from: String(from),
          to: String(to),
          total: String(total),
          b: (chunks) => <span className="font-medium text-content-primary">{chunks}</span>,
        })}
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
