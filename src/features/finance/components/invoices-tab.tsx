"use client"

import * as React from "react"
import { Plus, Search, SlidersHorizontal } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { cn } from "@/src/shared/lib/utils/utils"

import { INVOICE_STATUS_FILTERS, type InvoiceStatusFilter } from "../data/finance-mock"
import { useDebouncedValue } from "../hooks/use-debounced-value"
import { FINANCE_RESOURCES } from "../lib/constants/permissions"
import { useFinanceInvoices } from "../lib/queries/invoices"
import type { FinanceInvoiceListItem } from "../lib/types"
import { formatCurrency } from "../lib/utils/currency"
import { formatDate } from "../lib/utils/date"
import { CancelInvoiceDialog } from "./invoices/cancel-invoice-dialog"
import { InvoiceActions } from "./invoices/invoice-actions"
import { InvoiceDetailDialog } from "./invoices/invoice-detail-dialog"
import { InvoiceStatusBadge } from "./invoices/invoice-status-badge"
import { MarkInvoicePaidDialog } from "./invoices/mark-invoice-paid-dialog"
import { SendInvoiceDialog } from "./invoices/send-invoice-dialog"
import { FinanceErrorState } from "./shared/finance-error-state"
import { FinancePageSpinner } from "./shared/finance-loading"
import { FinanceTablePagination } from "./shared/finance-table-pagination"
import { FinanceSummaryCard } from "./finance-summary-card"

const PAGE_SIZE = 10

export function InvoicesTab({
  onNewInvoice,
}: {
  onNewInvoice?: () => void
}) {
  const [activeFilter, setActiveFilter] =
    React.useState<InvoiceStatusFilter>("All")
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [page, setPage] = React.useState(1)
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})

  const [viewInvoiceId, setViewInvoiceId] = React.useState<string | null>(null)
  const [sendTarget, setSendTarget] = React.useState<FinanceInvoiceListItem | null>(null)
  const [markPaidTarget, setMarkPaidTarget] = React.useState<FinanceInvoiceListItem | null>(null)
  const [cancelTarget, setCancelTarget] = React.useState<FinanceInvoiceListItem | null>(null)

  const { can } = usePermissions()
  const canManage = can.write(FINANCE_RESOURCES.invoices)

  const { data, isLoading, isError, refetch } = useFinanceInvoices({
    status: activeFilter === "All" ? undefined : activeFilter.toLowerCase(),
    search: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })

  const invoices = data?.data ?? []
  const meta = data?.meta

  const handleFilterChange = (filter: InvoiceStatusFilter) => {
    setActiveFilter(filter)
    setPage(1)
  }
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const allOnPageSelected =
    invoices.length > 0 && invoices.every((row) => selected[row.id])

  const toggleAllOnPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev }
      for (const row of invoices) next[row.id] = checked
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <FinancePageSpinner />
      ) : isError ? (
        <FinanceErrorState message="Failed to load invoices." onRetry={() => void refetch()} />
      ) : (
        <>
          {meta ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FinanceSummaryCard
                label="Total Revenue"
                value={formatCurrency(meta.summary.total_revenue)}
                accent="emerald"
                icon="dollar"
              />
              <FinanceSummaryCard
                label="Pending"
                value={formatCurrency(meta.summary.pending_amount)}
                accent="amber"
                icon="clock"
              />
              <FinanceSummaryCard
                label="Overdue"
                value={formatCurrency(meta.summary.overdue_amount)}
                accent="red"
                icon="alert"
              />
              <FinanceSummaryCard
                label="Draft"
                value={meta.summary.draft_count}
                accent="violet"
                icon="file"
              />
            </div>
          ) : null}

          <Card
            variant="elevated"
            className="overflow-hidden rounded-2xl border-stroke-default p-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke-default px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {canManage ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-lg"
                    onClick={onNewInvoice}
                  >
                    <Plus className="size-4" />
                    New Invoice
                  </Button>
                ) : null}
                <div className="flex flex-wrap items-center gap-1">
                  {INVOICE_STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterChange(filter)}
                      className={cn(
                        "h-8 rounded-lg px-3 text-[11px] font-medium capitalize transition-colors",
                        activeFilter === filter
                          ? "bg-[#f4f4f5] text-content-primary"
                          : "text-content-tertiary hover:bg-surface-hover",
                      )}
                    >
                      {filter.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="text-content-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    type="search"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="bg-[#fafafa] h-9 w-48 rounded-lg pl-9 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-lg bg-[#fafafa]"
                  aria-label="Filter invoices"
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1080px]">
                <TableHeader className="bg-transparent">
                  <TableRow className="border-stroke-default hover:bg-transparent">
                    <TableHead className="w-12 px-3">
                      <Checkbox
                        aria-label="Select all rows"
                        checked={allOnPageSelected}
                        onCheckedChange={(value) => toggleAllOnPage(value === true)}
                      />
                    </TableHead>
                    <TableHead className="w-40 px-2">Invoice #</TableHead>
                    <TableHead className="w-64 px-2">Client</TableHead>
                    <TableHead className="w-40 px-2">Issue Date</TableHead>
                    <TableHead className="w-40 px-2">Due Date</TableHead>
                    <TableHead className="w-36 px-2 text-right">Amount</TableHead>
                    <TableHead className="px-2">Status</TableHead>
                    <TableHead className="w-12 px-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv, index) => (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        "border-stroke-default",
                        index % 2 === 1 && "bg-[#f4f4f5]/30",
                      )}
                    >
                      <TableCell className="w-12 px-3 py-3">
                        <Checkbox
                          aria-label={`Select invoice ${inv.invoice_number}`}
                          checked={Boolean(selected[inv.id])}
                          onCheckedChange={(value) =>
                            setSelected((prev) => ({
                              ...prev,
                              [inv.id]: value === true,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 py-3 font-mono text-xs text-content-primary">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell className="px-2 py-3 text-xs text-content-primary">
                        {inv.client_name}
                      </TableCell>
                      <TableCell className="px-2 py-3 text-xs text-content-tertiary">
                        {formatDate(inv.issue_date)}
                      </TableCell>
                      <TableCell className="px-2 py-3 text-xs text-content-tertiary">
                        {formatDate(inv.due_date)}
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right font-mono text-xs text-content-primary">
                        {formatCurrency(inv.total_amount, inv.currency_code)}
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right">
                        <InvoiceActions
                          invoice={inv}
                          canManage={canManage}
                          onView={() => setViewInvoiceId(inv.id)}
                          onSend={() => setSendTarget(inv)}
                          onMarkPaid={() => setMarkPaidTarget(inv)}
                          onCancel={() => setCancelTarget(inv)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-content-tertiary py-10 text-center text-xs"
                      >
                        No invoices match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {meta ? (
              <FinanceTablePagination
                page={meta.current_page}
                pageCount={meta.last_page}
                total={meta.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="invoices"
              />
            ) : null}
          </Card>
        </>
      )}

      <InvoiceDetailDialog
        invoiceId={viewInvoiceId}
        onOpenChange={(open) => {
          if (!open) setViewInvoiceId(null)
        }}
      />
      <SendInvoiceDialog
        invoice={sendTarget}
        onOpenChange={(open) => {
          if (!open) setSendTarget(null)
        }}
      />
      <MarkInvoicePaidDialog
        invoice={markPaidTarget}
        onOpenChange={(open) => {
          if (!open) setMarkPaidTarget(null)
        }}
      />
      <CancelInvoiceDialog
        invoice={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
      />
    </div>
  )
}
