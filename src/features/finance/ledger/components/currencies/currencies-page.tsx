"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"

import { ChartTableToggle } from "../../../components/shared/chart-table-toggle"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatRate } from "../../../lib/utils/money"
import { useRefreshRates } from "../../lib/mutations/ledger"
import { useCurrencies } from "../../lib/queries/ledger"
import type { CurrencyList, CurrencyRow, LedgerTranslator } from "../../lib/types/ledger"

function buildCurrencyColumns(t: LedgerTranslator): FinanceColumn<CurrencyRow>[] {
  return [
    { id: "code", header: t("code"), cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    {
      id: "name",
      header: t("currency"),
      cell: (row) => (
        <span className="flex items-center gap-2">
          {row.name}
          {row.is_base ? <StatusPill status="prepared" label={t("base")} /> : null}
        </span>
      ),
    },
    { id: "symbol", header: t("symbol"), cell: (row) => row.symbol },
    { id: "rate", header: t("rateToEgp"), align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.rate_to_base)}</span> },
    { id: "decimals", header: t("decimals"), align: "end", cell: (row) => row.decimals },
  ]
}

type Fixing = CurrencyList["fixings"][number]

function buildFixingColumns(t: LedgerTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Fixing>[] {
  return [
    { id: "date", header: t("date"), cell: (row) => formatDate(row.date) },
    { id: "rate", header: "USD / EGP", align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.rate)}</span> },
  ]
}

const chartConfig = { rate: { label: "USD / EGP", color: "var(--series-1)" } } satisfies ChartConfig

const dayMonth = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: "2-digit", month: "short", timeZone: "UTC" })

/** A single series over eight fixings: thin line, crosshair tooltip, table view. */
function FixingsChart({ fixings }: { fixings: Fixing[] }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
  const locale = useIntlLocale()
  const fixingColumns = React.useMemo(() => buildFixingColumns(t, formatDate), [t, formatDate])
  const first = fixings[0]
  const last = fixings[fixings.length - 1]
  return (
    <ChartTableToggle
      description={
        first && last
          ? t("fixingsSummary", {
              from: formatRate(first.rate),
              fromDate: formatDate(first.date),
              to: formatRate(last.rate),
              toDate: formatDate(last.date),
            })
          : undefined
      }
      chart={
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <LineChart data={fixings} margin={{ top: 12, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => dayMonth(value, locale)} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickFormatter={(value: number) => value.toFixed(2)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--stroke-input)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(String(value))}
                  formatter={(value) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-content-tertiary">USD / EGP</span>
                      <span className="text-content-primary font-medium tabular-nums">{formatRate(Number(value))}</span>
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface-white)" }}
            />
          </LineChart>
        </ChartContainer>
      }
      table={<FinanceTable caption={t("recentFixingsCaption")} columns={fixingColumns} rows={fixings} getRowId={(row) => row.date} />}
    />
  )
}

/** 05.12 · Currencies — the rates every foreign amount is restated at. */
function CurrenciesPage() {
  const t = useTranslations("FinanceLedger")
  const { formatDateTime } = useFinanceDateFormat()
  const currencyColumns = React.useMemo(() => buildCurrencyColumns(t), [t])
  const { data, isError, refetch } = useCurrencies()
  const refresh = useRefreshRates()
  const [confirming, setConfirming] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("currenciesAndFx")}
        figure={data ? <HeaderFigure label={t("activeCurrencies")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="secondary" disabled={refresh.isPending} onClick={() => setConfirming(true)}>
            <RefreshCw aria-hidden />
            {t("refreshRates")}
          </Button>
        }
      />
      <FinancePageBody>
        <FinanceAlert tone="info">
          {t("currenciesInfo")}
          {data ? ` ${t("lastRead", { date: formatDateTime(data.refreshed_at, " · ") })}` : null}
        </FinanceAlert>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <FinanceTable caption={t("currencies")} columns={currencyColumns} rows={data?.items ?? []} loading={!data} getRowId={(row) => row.code} />
            {data ? (
              <FinanceSection title={t("recentFixingsTitle")}>
                <FixingsChart fixings={data.fixings} />
              </FinanceSection>
            ) : null}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("refreshRatesTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("refreshRatesDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                refresh.mutate(undefined, {
                  onSuccess: () => toast.success(t("toastRatesRefreshed")),
                  onError: (error) => toast.error(errorMessage(error, t("errorRefreshRates"))),
                })
              }
            >
              {t("refreshRates")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { CurrenciesPage }
