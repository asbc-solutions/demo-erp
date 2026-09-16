"use client"

import * as React from "react"
import { Copy, Download, ListFilter, Loader2, MoreHorizontal, Search } from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, toastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { SalesTablePagination } from "../../components/shared/sales-table-pagination"
import { formatCurrency } from "../../lib/utils/currency"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useExportInvoices } from "../../lib/mutations/invoices"
import { useInvoices } from "../../lib/queries/invoices"
import type { InvoiceListItem, InvoiceStatus, InvoiceTab } from "../../lib/types"
import { InvoiceNumber, invoiceLabel } from "./invoice-number"

const INVOICE_TABS: { value: InvoiceTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
  { value: "sent", label: "Sent" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
]

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "bg-surface-hover text-content-secondary",
  posted: "bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300",
  sent: "bg-violet-400/15 text-violet-500 dark:bg-violet-400/20 dark:text-violet-300",
  closed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-950/45 dark:text-red-300",
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function StatusPill({ status, label }: Readonly<{ status: InvoiceStatus; label: string }>) {
  return (
    <Badge
      variant="neutral"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_STYLE[status])}
    >
      {label}
    </Badge>
  )
}

function PaymentStatusPill({ label, status }: Readonly<{ label: string; status: string }>) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium",
        status === "paid" && "text-emerald-600",
        status === "partial" && "text-amber-600",
        status === "unpaid" && "text-content-tertiary",
      )}
    >
      {label}
    </span>
  )
}

export function InvoicesListView({
  onSelectInvoice,
}: Readonly<{ onSelectInvoice: (id: string) => void }>) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [activeTab, setActiveTab] = React.useState<InvoiceTab>("all")
  const [page, setPage] = React.useState(1)

  const handleTabChange = (tab: InvoiceTab) => {
    setActiveTab(tab)
    setPage(1)
  }
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const { data, isLoading, isError, refetch } = useInvoices({
    tab: activeTab,
    q: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })
  const exportInvoices = useExportInvoices()
  const { can } = usePermissions()

  const invoices = data?.data ?? []
  const meta = data?.meta

  const copyToClipboard = (value: string) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(value).catch(() => {})
  }

  const handleExport = () => {
    exportInvoices.mutate(
      {
        format: "csv",
        scope: "filtered",
        filters: { tab: activeTab, q: debouncedSearch || undefined },
      },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, "Failed to export invoices"),
      },
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 bg-surface-page p-4 sm:p-6">
      <section aria-label="Invoice controls" className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search invoices</span>
          <Search
            aria-hidden
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by invoice # or customer…"
            className="h-10 rounded-lg border-stroke-input pl-10 text-[13px] shadow-none"
          />
        </label>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10 flex-1 gap-2 px-3.5 text-[13px] sm:flex-none">
                <ListFilter className="size-4" strokeWidth={1.75} />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Invoice status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={activeTab} onValueChange={(v) => handleTabChange(v as InvoiceTab)}>
                {INVOICE_TABS.map((tab) => (
                  <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                    {tab.label}
                    <span className="ml-auto text-xs text-content-quaternary">{meta?.tabs[tab.value] ?? 0}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {can.write(SALES_RESOURCES.export) ? (
            <Button
              variant="secondary"
              className="h-10 flex-1 gap-2 px-3.5 text-[13px] sm:flex-none"
              onClick={handleExport}
              disabled={exportInvoices.isPending}
            >
              {exportInvoices.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" strokeWidth={1.75} />
              )}
              Export
            </Button>
          ) : null}
        </div>
      </section>

      <nav
        aria-label="Filter invoices by status"
        className="thin-scrollbar -mt-1 flex min-w-0 overflow-x-auto border-b border-stroke-default"
      >
        {INVOICE_TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative flex h-10 shrink-0 items-center gap-2 px-3 text-[13px] font-medium transition-colors first:pl-2",
                isActive ? "text-brand-primary" : "text-content-tertiary hover:text-content-primary",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-4 font-semibold",
                  isActive ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-hover text-content-tertiary",
                )}
              >
                {meta?.tabs[tab.value] ?? 0}
              </span>
              {isActive ? (
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-primary" />
              ) : null}
            </button>
          )
        })}
      </nav>

      {isLoading ? (
        <SalesPageSpinner />
      ) : isError ? (
        <SalesErrorState message="Failed to load invoices." onRetry={() => void refetch()} />
      ) : (
        <>
          <section
            aria-label="Invoices"
            className="overflow-hidden rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <Table className="min-w-[1180px]">
              <TableHeader className="bg-surface-white">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px] pl-5">Invoice #</TableHead>
                  <TableHead className="min-w-[190px]">Customer</TableHead>
                  <TableHead className="w-[130px]">Invoice Date</TableHead>
                  <TableHead className="w-[130px]">Due Date</TableHead>
                  <TableHead className="w-[140px] text-center">Total Due</TableHead>
                  <TableHead className="w-[130px]">Payment</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[92px] pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length ? (
                  invoices.map((invoice: InvoiceListItem) => (
                    <TableRow key={invoice.id} className="h-16 cursor-pointer" onClick={() => onSelectInvoice(invoice.id)}>
                      <TableCell className="py-4 pl-5 font-mono text-[12px] font-medium text-content-primary">
                        <InvoiceNumber value={invoice.number} status={invoice.status} />
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-medium text-content-primary">
                        {invoice.customer_name}
                      </TableCell>
                      <TableCell className="py-4 text-[12px] text-content-secondary">{invoice.invoice_date}</TableCell>
                      <TableCell className="py-4 text-[12px] text-content-secondary">{invoice.due_date}</TableCell>
                      <TableCell className="py-4 text-center text-[13px] font-bold text-content-primary tabular-nums">
                        {formatCurrency(invoice.total_due)}
                      </TableCell>
                      <TableCell className="py-4">
                        <PaymentStatusPill status={invoice.payment_status} label={invoice.payment_status_label} />
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusPill status={invoice.status} label={invoice.status_label} />
                      </TableCell>
                      <TableCell className="py-3 pr-5 text-right" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${invoiceLabel(invoice.number, invoice.customer_name)}`}
                              className="size-8 text-content-tertiary"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onSelectInvoice(invoice.id)}>Open</DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!invoice.number}
                              onSelect={() => invoice.number && copyToClipboard(invoice.number)}
                            >
                              <Copy aria-hidden />
                              Copy invoice number
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-content-tertiary">
                      No invoices match this view.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
          {meta ? (
            <SalesTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="invoices"
            />
          ) : null}
        </>
      )}

      <p className="-mt-1 text-center text-[11px] leading-4 text-content-quaternary">
        Invoices are generated from confirmed sales orders only.
      </p>
    </div>
  )
}
