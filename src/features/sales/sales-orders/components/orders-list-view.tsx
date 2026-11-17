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
import { useExportOrders } from "../../lib/mutations/orders"
import { useOrders } from "../../lib/queries/orders"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import type { OrderListItem, OrderStatus, OrderTab } from "../../lib/types"
import { DeliveryDate } from "./delivery-date"

/** Labels come from `Common.all` and the `SalesShared.orderStatus` enum map. */
const ORDER_TABS: { value: OrderTab }[] = [
  { value: "all" },
  { value: "draft" },
  { value: "pending_confirmation" },
  { value: "confirmed" },
  { value: "invoiced" },
  { value: "closed" },
  { value: "cancelled" },
]

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const STATUS_STYLE: Record<OrderStatus, string> = {
  draft: "bg-surface-hover text-content-secondary",
  pending_confirmation: "bg-amber-100 text-amber-600 dark:bg-amber-950/45 dark:text-amber-300",
  confirmed: "bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300",
  invoiced: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
  closed: "bg-stroke-default text-content-tertiary",
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

function StatusPill({ status }: Readonly<{ status: OrderStatus }>) {
  const tShared = useTranslations("SalesShared")

  return (
    <Badge
      variant="neutral"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_STYLE[status])}
    >
      {tShared(`orderStatus.${status}`)}
    </Badge>
  )
}

export function OrdersListView({
  onSelectOrder,
}: Readonly<{ onSelectOrder: (id: string) => void }>) {
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("SalesShared")
  const toastMutationError = useToastMutationError()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [activeTab, setActiveTab] = React.useState<OrderTab>("all")
  const [salespersonFilter, setSalespersonFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab)
    setPage(1)
  }
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleSalespersonChange = (value: string) => {
    setSalespersonFilter(value)
    setPage(1)
  }

  const { data, isLoading, isError, refetch } = useOrders({
    tab: activeTab,
    salesperson_id: salespersonFilter === "all" ? undefined : salespersonFilter,
    q: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })
  const { data: salespeople = [] } = useActiveSalespeople()
  const exportOrders = useExportOrders()
  const { can } = usePermissions()

  const orders = data?.data ?? []
  const meta = data?.meta

  const copyToClipboard = (value: string) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(value).catch(() => {})
  }

  const handleExport = () => {
    exportOrders.mutate(
      {
        format: "csv",
        scope: "filtered",
        filters: {
          tab: activeTab,
          salesperson_id: salespersonFilter === "all" ? undefined : salespersonFilter,
          q: debouncedSearch || undefined,
        },
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
              <DropdownMenuLabel>{t("salesperson")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={salespersonFilter} onValueChange={handleSalespersonChange}>
                <DropdownMenuRadioItem value="all">{t("allSalespeople")}</DropdownMenuRadioItem>
                {salespeople.map((person) => (
                  <DropdownMenuRadioItem key={person.id} value={person.id}>
                    {person.name}
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
              disabled={exportOrders.isPending}
            >
              {exportOrders.isPending ? (
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
        {ORDER_TABS.map((tab) => {
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
              {tab.value === "all" ? tCommon("all") : tShared(`orderStatus.${tab.value}`)}
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
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-surface-white">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px] ps-5">{t("orderNumber")}</TableHead>
                  <TableHead className="min-w-[230px]">{t("customer")}</TableHead>
                  <TableHead className="w-[150px]">{t("deliveryDate")}</TableHead>
                  <TableHead className="w-[150px] text-center">{tCommon("total")}</TableHead>
                  <TableHead className="w-[190px]">{tCommon("status")}</TableHead>
                  <TableHead className="w-[190px]">{t("salesperson")}</TableHead>
                  <TableHead className="w-[92px] pe-5 text-end">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length ? (
                  orders.map((order: OrderListItem) => (
                    <TableRow key={order.id} className="h-16 cursor-pointer" onClick={() => onSelectOrder(order.id)}>
                      <TableCell className="py-4 ps-5 font-mono text-[12px] font-medium text-content-primary">
                        {order.number}
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-medium text-content-primary">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="py-4 text-[12px] text-content-secondary">
                        <DeliveryDate value={order.delivery_date} />
                      </TableCell>
                      <TableCell className="py-4 text-center text-[13px] font-bold text-content-primary tabular-nums">
                        {formatCurrency(order.grand_total)}
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusPill status={order.status} />
                      </TableCell>
                      <TableCell className="py-4 text-[12px] text-content-secondary">
                        {order.salesperson_name}
                      </TableCell>
                      <TableCell className="py-3 pe-5 text-end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("actionsFor", { number: order.number })}
                              className="size-8 text-content-tertiary"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onSelectOrder(order.id)}>{t("open")}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => copyToClipboard(order.number)}>
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
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-content-tertiary">
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
              itemLabel="orders"
            />
          ) : null}
        </>
      )}
    </div>
  )
}
