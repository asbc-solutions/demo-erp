"use client"

import * as React from "react"
import { Copy, Download, ListFilter, Loader2, MoreHorizontal, Search } from "lucide-react"
import { useTranslations } from "next-intl"

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

import { SalesErrorState, useToastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { SalesTablePagination } from "../../components/shared/sales-table-pagination"
import { formatCurrency } from "../../lib/utils/currency"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useExportInvoices } from "../../lib/mutations/invoices"
import { useInvoices } from "../../lib/queries/invoices"
import type {
  InvoiceListItem,
  InvoicePaymentStatus,
  InvoiceStatus,
  InvoiceTab,
} from "../../lib/types"
import { InvoiceNumber, invoiceLabel } from "./invoice-number"

/** Labels come from `Common.all` and the `SalesShared.invoiceStatus` enum map. */
const INVOICE_TABS: { value: InvoiceTab }[] = [
  { value: "all" },
  { value: "draft" },
  { value: "posted" },
  { value: "sent" },
  { value: "closed" },
  { value: "cancelled" },
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

function StatusPill({ status }: Readonly<{ status: InvoiceStatus }>) {
  const tShared = useTranslations("SalesShared")

  return (
    <Badge
      variant="neutral"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_STYLE[status])}
    >
      {tShared(`invoiceStatus.${status}`)}
    </Badge>
  )
}

function PaymentStatusPill({ status }: Readonly<{ status: InvoicePaymentStatus }>) {
  const tShared = useTranslations("SalesShared")

  return (
    <span
      className={cn(
        "text-[11px] font-medium",
        status === "paid" && "text-emerald-600",
        status === "partial" && "text-amber-600",
        status === "unpaid" && "text-content-tertiary",
      )}
    >
      {tShared(`paymentStatus.${status}`)}
    </span>
  )
}

export function InvoicesListView({
  onSelectInvoice,
}: Readonly<{ onSelectInvoice: (id: string) => void }>) {
  const t = useTranslations("SalesInvoices")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("SalesShared")
  const toastMutationError = useToastMutationError()
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
        onError: (err) => toastMutationError(err, t("exportFailed")),
      },
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 bg-surface-page p-4 sm:p-6">
      <section aria-label={t("controlsLabel")} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search
            aria-hidden
            className="absolute top-1/2 inset-s-3.5 size-4 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-lg border-stroke-input ps-10 text-[13px] shadow-none"
          />
        </label>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10 flex-1 gap-2 px-3.5 text-[13px] sm:flex-none">
                <ListFilter className="size-4" strokeWidth={1.75} />
                {tCommon("filter")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("invoiceStatus")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={activeTab} onValueChange={(v) => handleTabChange(v as InvoiceTab)}>
                {INVOICE_TABS.map((tab) => (
                  <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                    {tab.value === "all" ? tCommon("all") : tShared(`invoiceStatus.${tab.value}`)}
                    <span className="ms-auto text-xs text-content-quaternary">{meta?.tabs[tab.value] ?? 0}</span>
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
              {tCommon("export")}
            </Button>
          ) : null}
        </div>
      </section>

      <nav
        aria-label={t("statusTabsLabel")}
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
                "relative flex h-10 shrink-0 items-center gap-2 px-3 text-[13px] font-medium transition-colors first:ps-2",
                isActive ? "text-brand-primary" : "text-content-tertiary hover:text-content-primary",
              )}
            >
              {tab.value === "all" ? tCommon("all") : tShared(`invoiceStatus.${tab.value}`)}
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
        <SalesErrorState message={t("loadListFailed")} onRetry={() => void refetch()} />
      ) : (
        <>
          <section
            aria-label={t("tableLabel")}
            className="overflow-hidden rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <Table className="min-w-[1180px]">
              <TableHeader className="bg-surface-white">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px] ps-5">{t("invoiceNumber")}</TableHead>
                  <TableHead className="min-w-[190px]">{t("customer")}</TableHead>
                  <TableHead className="w-[130px]">{t("invoiceDate")}</TableHead>
                  <TableHead className="w-[130px]">{t("dueDate")}</TableHead>
                  <TableHead className="w-[140px] text-center">{t("totalDue")}</TableHead>
                  <TableHead className="w-[130px]">{t("payment")}</TableHead>
                  <TableHead className="w-[150px]">{tCommon("status")}</TableHead>
                  <TableHead className="w-[92px] pe-5 text-end">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length ? (
                  invoices.map((invoice: InvoiceListItem) => (
                    <TableRow key={invoice.id} className="h-16 cursor-pointer" onClick={() => onSelectInvoice(invoice.id)}>
                      <TableCell className="py-4 ps-5 font-mono text-[12px] font-medium text-content-primary">
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
                        <PaymentStatusPill status={invoice.payment_status} />
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusPill status={invoice.status} />
                      </TableCell>
                      <TableCell className="py-3 pe-5 text-end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("actionsFor", {
                                label: invoiceLabel(invoice.number, invoice.customer_name, t),
                              })}
                              className="size-8 text-content-tertiary"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onSelectInvoice(invoice.id)}>{t("open")}</DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!invoice.number}
                              onSelect={() => invoice.number && copyToClipboard(invoice.number)}
                            >
                              <Copy aria-hidden />
                              {t("copyNumber")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-content-tertiary">
                      {t("noMatches")}
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
        {t("generatedFromOrdersHint")}
      </p>
    </div>
  )
}
