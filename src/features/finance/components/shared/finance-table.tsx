"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { Checkbox } from "@/src/shared/components/ui/checkbox"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

export type FinanceColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: "start" | "end" | "center"
  /** Width class for the column, e.g. `w-40`. */
  width?: string
  className?: string
  /** Content of this column's cell in the totals row. */
  footer?: React.ReactNode
  /** Name shown in the column chooser; defaults to `header` when it is a string. */
  label?: string
  /** Whether the column chooser may hide this column. */
  hideable?: boolean
}

export type FinanceTableGroup<T> = {
  id: string
  label: React.ReactNode
  rows: T[]
  /** Subtotal cells keyed by column id, shown on the group row. */
  summary?: Partial<Record<string, React.ReactNode>>
}

type FinanceTableProps<T> = {
  columns: FinanceColumn<T>[]
  /** Flat rows. Ignored when `groups` is given. */
  rows?: T[]
  groups?: FinanceTableGroup<T>[]
  getRowId: (row: T) => string
  hiddenColumnIds?: string[]
  selectable?: boolean
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  /** Content revealed under a row by its chevron. */
  renderExpanded?: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  loading?: boolean
  loadingRows?: number
  /** Rendered across the table when there are no rows. */
  empty?: React.ReactNode
  /** Accessible name for the table. */
  caption: string
  className?: string
}

const ALIGN_CLASS = {
  start: "text-left",
  end: "text-right",
  center: "text-center",
} as const

export function columnLabel<T>(column: FinanceColumn<T>): string {
  return column.label ?? (typeof column.header === "string" ? column.header : column.id)
}

/**
 * The finance list table: compact density, optional selection, expandable rows,
 * group rows with subtotals and a totals footer — all driven by column
 * definitions so ~40 list screens share one implementation.
 */
function FinanceTable<T>({
  columns,
  rows = [],
  groups,
  getRowId,
  hiddenColumnIds = [],
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  renderExpanded,
  onRowClick,
  loading = false,
  loadingRows = 6,
  empty,
  caption,
  className,
}: FinanceTableProps<T>) {
  const [expandedIds, setExpandedIds] = React.useState<string[]>([])
  const visibleColumns = columns.filter((column) => !hiddenColumnIds.includes(column.id))
  const allRows = groups ? groups.flatMap((group) => group.rows) : rows
  const allIds = allRows.map(getRowId)
  const selectedCount = allIds.filter((id) => selectedIds.includes(id)).length
  const hasFooter = visibleColumns.some((column) => column.footer !== undefined)
  const leadColumns = (selectable ? 1 : 0) + (renderExpanded ? 1 : 0)
  const colSpan = visibleColumns.length + leadColumns

  const toggleRow = (id: string, checked: boolean) =>
    onSelectedIdsChange?.(checked ? [...selectedIds, id] : selectedIds.filter((s) => s !== id))

  const toggleAll = (checked: boolean) =>
    onSelectedIdsChange?.(
      checked
        ? Array.from(new Set([...selectedIds, ...allIds]))
        : selectedIds.filter((id) => !allIds.includes(id)),
    )

  const toggleExpanded = (id: string) =>
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((e) => e !== id) : [...current, id],
    )

  const renderRow = (row: T) => {
    const id = getRowId(row)
    const isSelected = selectedIds.includes(id)
    const isExpanded = expandedIds.includes(id)
    return (
      <React.Fragment key={id}>
        <TableRow
          data-state={isSelected ? "selected" : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={
            onRowClick
              ? (event) => {
                  if (event.key === "Enter") onRowClick(row)
                }
              : undefined
          }
          className={cn(onRowClick && "cursor-pointer")}
        >
          {selectable ? (
            <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                aria-label="Select row"
                onCheckedChange={(checked) => toggleRow(id, checked === true)}
              />
            </TableCell>
          ) : null}
          {renderExpanded ? (
            <TableCell className="w-8 pr-0" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                aria-expanded={isExpanded}
                onClick={() => toggleExpanded(id)}
                className="text-content-tertiary hover:text-content-primary flex size-5 items-center justify-center rounded"
              >
                <ChevronRight
                  aria-hidden
                  className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")}
                />
              </button>
            </TableCell>
          ) : null}
          {visibleColumns.map((column) => (
            <TableCell
              key={column.id}
              className={cn(ALIGN_CLASS[column.align ?? "start"], column.width, column.className)}
            >
              {column.cell(row)}
            </TableCell>
          ))}
        </TableRow>
        {renderExpanded && isExpanded ? (
          <TableRow className="bg-surface-page hover:bg-surface-page">
            <TableCell colSpan={colSpan} className="whitespace-normal">
              {renderExpanded(row)}
            </TableCell>
          </TableRow>
        ) : null}
      </React.Fragment>
    )
  }

  return (
    <div
      data-slot="finance-table"
      className={cn(
        "border-stroke-default bg-surface-white overflow-hidden rounded-lg border",
        className,
      )}
    >
      <Table density="compact">
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all rows"
                  checked={
                    selectedCount === 0
                      ? false
                      : selectedCount === allIds.length
                        ? true
                        : "indeterminate"
                  }
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                />
              </TableHead>
            ) : null}
            {renderExpanded ? <TableHead className="w-8 pr-0" aria-label="Expand" /> : null}
            {visibleColumns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(ALIGN_CLASS[column.align ?? "start"], column.width)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: loadingRows }, (_, index) => (
              <TableRow key={`loading-${index}`} className="hover:bg-transparent">
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : allRows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="whitespace-normal">
                {empty ?? (
                  <p className="text-content-tertiary py-8 text-center text-sm">Nothing to show.</p>
                )}
              </TableCell>
            </TableRow>
          ) : groups ? (
            groups.map((group) => (
              <React.Fragment key={group.id}>
                <TableRow className="bg-surface-hover hover:bg-surface-hover">
                  {leadColumns > 0 ? <TableCell colSpan={leadColumns} /> : null}
                  {visibleColumns.map((column, index) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "text-content-primary font-semibold",
                        ALIGN_CLASS[column.align ?? "start"],
                      )}
                    >
                      {index === 0 ? group.label : group.summary?.[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
                {group.rows.map(renderRow)}
              </React.Fragment>
            ))
          ) : (
            rows.map(renderRow)
          )}
        </TableBody>

        {hasFooter && !loading && allRows.length > 0 ? (
          <TableFooter className="border-stroke-input bg-surface-hover border-t-2">
            <TableRow className="hover:bg-transparent">
              {leadColumns > 0 ? <TableCell colSpan={leadColumns} /> : null}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    "text-content-primary font-semibold",
                    ALIGN_CLASS[column.align ?? "start"],
                  )}
                >
                  {column.footer}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  )
}

export { FinanceTable }
