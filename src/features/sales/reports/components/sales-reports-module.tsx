"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

import { useIntlLocale } from "@/src/i18n/intl-locale"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, useToastMutationError } from "../../components/shared/sales-error-state"
import { SalesSectionSpinner } from "../../components/shared/sales-loading"
import { formatCurrency } from "../../lib/utils/currency"
import { computeDateRange, type DateRangePreset } from "../../lib/utils/date-range"
import { useExportReport } from "../../lib/mutations/reports"
import { useCustomers } from "../../lib/queries/customers"
import { useSalesDashboard } from "../../lib/queries/dashboard"
import {
  useSalesByCustomerReport,
  useSalesBySalespersonReport,
  useTotalSalesReport,
} from "../../lib/queries/reports"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import type { InvoiceStatus, ReportType, TotalSalesReportParams } from "../../lib/types"

const COLOR_PALETTE = ["#8555ed", "#fb923c", "#3b82f6", "#ec4899", "#14b8a6", "#9ca3af"]

/** Chart series config; `label` is the translated series name shown in tooltips. */
function revenueConfig(key: string, label: string): ChartConfig {
  return { [key]: { label, color: "#4f46e5" } }
}

const DATE_RANGE_OPTIONS = [
  { value: "30d", labelKey: "last30Days" },
  { value: "90d", labelKey: "last90Days" },
  { value: "year", labelKey: "thisYear" },
  { value: "all", labelKey: "allTime" },
] as const satisfies readonly { value: DateRangePreset; labelKey: string }[]

/** Labels come from `Common.all` and the `SalesShared.invoiceStatus` enum map. */
const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus | "all" }[] = [
  { value: "all" },
  { value: "draft" },
  { value: "posted" },
  { value: "sent" },
  { value: "closed" },
  { value: "cancelled" },
]

function formatCompact(value: number) {
  if (value === 0) return "0"
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatShortDate(iso: string, locale: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" })
}

function niceTicks(max: number) {
  const roundedMax = Math.max(max, 1)
  return [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax]
}

function ReportCardHeader({
  title,
  onExport,
  isExporting,
}: Readonly<{ title: string; onExport?: () => void; isExporting?: boolean }>) {
  const tCommon = useTranslations("Common")

  return (
    <div className="border-stroke-light flex min-h-[74px] w-full items-center justify-between border-b px-5 py-4 sm:px-6">
      <h2 className="text-[14px] leading-[22px] font-semibold text-content-primary">{title}</h2>
      {onExport ? (
        <Button type="button" variant="ghost" size="sm" onClick={onExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download aria-hidden />}
          {tCommon("export")}
        </Button>
      ) : null}
    </div>
  )
}

function ReportCard({
  title,
  className,
  onExport,
  isExporting,
  children,
}: Readonly<{
  title: string
  className?: string
  onExport?: () => void
  isExporting?: boolean
  children: React.ReactNode
}>) {
  return (
    <Card variant="elevated" className={cn("min-w-0 overflow-hidden rounded-2xl", className)}>
      <ReportCardHeader title={title} onExport={onExport} isExporting={isExporting} />
      {children}
    </Card>
  )
}

function useReportExport() {
  const t = useTranslations("SalesReports")
  const toastMutationError = useToastMutationError()
  const exportReport = useExportReport()
  return (type: ReportType, params: TotalSalesReportParams) =>
    exportReport.mutate(
      { type, params },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, t("exportFailed")),
      },
    )
}

function RevenueTrendCard({ params }: Readonly<{ params: TotalSalesReportParams }>) {
  const t = useTranslations("SalesReports")
  const intlLocale = useIntlLocale()
  const trendConfig = revenueConfig("amount", t("revenue"))
  const { data, isLoading, isError, refetch } = useTotalSalesReport(params)
  const exportReport = useExportReport()
  const triggerExport = useReportExport()

  return (
    <ReportCard
      title={t("totalSalesTitle")}
      className="lg:col-span-2"
      onExport={() => triggerExport("total-sales", params)}
      isExporting={exportReport.isPending}
    >
      {isLoading ? (
        <SalesSectionSpinner />
      ) : isError || !data ? (
        <SalesErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
      ) : (
        <div className="px-3 pt-5 pb-4 sm:px-5">
          <p className="mb-3 px-2 text-xs text-content-tertiary">
            {t.rich("totalAcross", {
              amount: formatCurrency(data.total_amount),
              count: data.invoice_count,
              b: (chunks) => <span className="font-semibold text-content-primary">{chunks}</span>,
            })}
          </p>
          <ChartContainer config={trendConfig} className="aspect-auto h-[290px] w-full" initialDimension={{ width: 900, height: 290 }}>
            <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sales-report-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.7} />
              <XAxis
                dataKey="date"
                tickFormatter={(iso: string) => formatShortDate(iso, intlLocale)}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <ChartTooltip
                cursor={{ stroke: "#a5b4fc", strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono font-medium text-content-primary">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#sales-report-revenue)"
                dot={false}
                activeDot={{ r: 4, fill: "#4f46e5", stroke: "#ffffff" }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </ReportCard>
  )
}

function SalesByCustomerCard({ params }: Readonly<{ params: TotalSalesReportParams }>) {
  const t = useTranslations("SalesReports")
  const barConfig = revenueConfig("value", t("revenue"))
  const { data, isLoading, isError, refetch } = useSalesByCustomerReport(params)
  const exportReport = useExportReport()
  const triggerExport = useReportExport()
  const rows = (data ?? []).slice(0, 8).map((row, index) => ({
    name: row.customer_name,
    value: row.total_amount,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }))
  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <ReportCard
      title={t("byCustomerTitle")}
      onExport={() => triggerExport("sales-by-customer", params)}
      isExporting={exportReport.isPending}
    >
      {isLoading ? (
        <SalesSectionSpinner />
      ) : isError ? (
        <SalesErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-content-tertiary">{t("noDataForFilter")}</p>
      ) : (
        <div className="overflow-x-auto px-3 pt-4 pb-5 sm:px-5">
          <ChartContainer config={barConfig} className="aspect-auto h-[310px] w-full min-w-[520px]" initialDimension={{ width: 560, height: 310 }}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={niceTicks(max)}
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={154} tick={{ fontSize: 10.5, fill: "#374151" }} />
              <ChartTooltip
                cursor={{ fill: "rgba(79, 70, 229, 0.04)" }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex min-w-40 items-center justify-between gap-3">
                        <span className="text-content-tertiary">{String(item.payload.name)}</span>
                        <span className="font-mono font-medium text-content-primary">{formatCurrency(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={27}>
                {rows.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ReportCard>
  )
}

function SalesBySalespersonCard({ params }: Readonly<{ params: TotalSalesReportParams }>) {
  const t = useTranslations("SalesReports")
  const barConfig = revenueConfig("value", t("revenue"))
  const { data, isLoading, isError, refetch } = useSalesBySalespersonReport(params)
  const exportReport = useExportReport()
  const triggerExport = useReportExport()
  const rows = (data ?? []).slice(0, 8).map((row, index) => ({
    name: row.salesperson_name,
    value: row.total_amount,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }))
  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <ReportCard
      title={t("bySalespersonTitle")}
      onExport={() => triggerExport("sales-by-salesperson", params)}
      isExporting={exportReport.isPending}
    >
      {isLoading ? (
        <SalesSectionSpinner />
      ) : isError ? (
        <SalesErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-content-tertiary">{t("noDataForFilter")}</p>
      ) : (
        <div className="overflow-x-auto px-3 pt-4 pb-5 sm:px-5">
          <ChartContainer config={barConfig} className="aspect-auto h-[310px] w-full min-w-[520px]" initialDimension={{ width: 560, height: 310 }}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={niceTicks(max)}
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={154} tick={{ fontSize: 10.5, fill: "#374151" }} />
              <ChartTooltip
                cursor={{ fill: "rgba(79, 70, 229, 0.04)" }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex min-w-40 items-center justify-between gap-3">
                        <span className="text-content-tertiary">{String(item.payload.name)}</span>
                        <span className="font-mono font-medium text-content-primary">{formatCurrency(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={27}>
                {rows.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ReportCard>
  )
}

function TopCustomersProductsCard() {
  const t = useTranslations("SalesReports")
  const pieConfig = revenueConfig("value", t("revenue"))
  const { data, isLoading, isError, refetch } = useSalesDashboard()

  const topCustomers = (data?.top_customers ?? []).map((c, index) => ({
    name: c.customer_name,
    value: c.total_amount,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }))
  const topProducts = data?.top_products ?? []

  return (
    <ReportCard title={t("topTitle")} className="lg:col-span-2">
      {isLoading ? (
        <SalesSectionSpinner />
      ) : isError || !data ? (
        <SalesErrorState message={t("loadDashboardFailed")} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-2 lg:gap-7">
          <div className="min-w-0">
            <h3 className="mb-3 text-xs font-medium text-content-secondary">{t("topCustomers")}</h3>
            {topCustomers.length === 0 ? (
              <p className="text-xs text-content-tertiary">{t("noData")}</p>
            ) : (
              <div className="flex min-h-[218px] flex-col items-center sm:flex-row">
                <ChartContainer config={pieConfig} className="aspect-square h-[210px] w-full max-w-[380px]" initialDimension={{ width: 340, height: 210 }}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={topCustomers}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={88}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={1.5}
                      stroke="none"
                    >
                      {topCustomers.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex w-full max-w-[150px] flex-col gap-1.5">
                  {topCustomers.map((customer) => (
                    <div key={customer.name} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: customer.color }} />
                      <span className="truncate text-[11px] text-content-secondary">{customer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="mb-3 text-xs font-medium text-content-secondary">{t("topProducts")}</h3>
            {topProducts.length === 0 ? (
              <p className="text-xs text-content-tertiary">{t("noData")}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {topProducts.map((product, index) => (
                  <li key={product.product_id} className="flex min-h-8 items-center gap-3 rounded-lg px-1 py-0.5">
                    <span className="bg-surface-hover flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-content-secondary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-content-secondary">
                      {product.product_name}
                    </span>
                    <span className="shrink-0 font-mono text-[13px] font-medium text-content-primary">
                      {formatCurrency(product.total_amount)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </ReportCard>
  )
}

export function SalesReportsModule() {
  const t = useTranslations("SalesReports")
  const tShared = useTranslations("SalesShared")
  const tCommon = useTranslations("Common")
  const [dateRange, setDateRange] = React.useState<DateRangePreset>("90d")
  const [customerId, setCustomerId] = React.useState("all")
  const [salespersonId, setSalespersonId] = React.useState("all")
  const [invoiceStatus, setInvoiceStatus] = React.useState<InvoiceStatus | "all">("all")

  const { data: customersPage } = useCustomers({ tab: "active", per_page: 100 })
  const { data: salespeople = [] } = useActiveSalespeople()
  const customers = customersPage?.data ?? []

  const params: TotalSalesReportParams = React.useMemo(
    () => ({
      ...computeDateRange(dateRange),
      customer_id: customerId === "all" ? undefined : customerId,
      salesperson_id: salespersonId === "all" ? undefined : salespersonId,
      invoice_status: invoiceStatus === "all" ? undefined : invoiceStatus,
    }),
    [dateRange, customerId, salespersonId, invoiceStatus],
  )

  return (
    <div className="bg-surface-page flex flex-1 flex-col gap-5 p-4 sm:p-6">
      <section aria-label={t("filtersLabel")} className="flex flex-wrap items-center gap-2.5 xl:justify-between">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangePreset)}>
          <SelectTrigger aria-label={t("dateRange")} className="h-10 w-auto min-w-[180px] gap-1 rounded-[10px] px-3 text-[13px] shadow-xs">
            <span className="text-content-tertiary">{t("dateRangePrefix")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger aria-label={t("customer")} className="h-10 w-auto min-w-[160px] gap-1 rounded-[10px] px-3 text-[13px] shadow-xs">
            <span className="text-content-tertiary">{t("customerPrefix")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={salespersonId} onValueChange={setSalespersonId}>
          <SelectTrigger aria-label={t("salesperson")} className="h-10 w-auto min-w-[160px] gap-1 rounded-[10px] px-3 text-[13px] shadow-xs">
            <span className="text-content-tertiary">{t("salespersonPrefix")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            {salespeople.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={invoiceStatus} onValueChange={(v) => setInvoiceStatus(v as InvoiceStatus | "all")}>
          <SelectTrigger aria-label={t("invoiceStatus")} className="h-10 w-auto min-w-[160px] gap-1 rounded-[10px] px-3 text-[13px] shadow-xs">
            <span className="text-content-tertiary">{t("invoiceStatusPrefix")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVOICE_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.value === "all" ? tCommon("all") : tShared(`invoiceStatus.${option.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueTrendCard params={params} />
        <SalesByCustomerCard params={params} />
        <SalesBySalespersonCard params={params} />
        <TopCustomersProductsCard />
      </section>
    </div>
  )
}
