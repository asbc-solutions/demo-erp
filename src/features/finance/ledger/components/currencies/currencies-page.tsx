"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
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
import { formatDate, formatDateTime } from "../../../lib/utils/date"
import { formatRate } from "../../../lib/utils/money"
import { useRefreshRates } from "../../lib/mutations/ledger"
import { useCurrencies } from "../../lib/queries/ledger"
import type { CurrencyList, CurrencyRow } from "../../lib/types/ledger"

const CURRENCY_COLUMNS: FinanceColumn<CurrencyRow>[] = [
  { id: "code", header: "Code", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
  {
    id: "name",
    header: "Currency",
    cell: (row) => (
      <span className="flex items-center gap-2">
        {row.name}
        {row.is_base ? <StatusPill status="prepared" label="Base" /> : null}
      </span>
    ),
  },
  { id: "symbol", header: "Symbol", cell: (row) => row.symbol },
  { id: "rate", header: "Rate to EGP", align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.rate_to_base)}</span> },
  { id: "decimals", header: "Decimals", align: "end", cell: (row) => row.decimals },
]

type Fixing = CurrencyList["fixings"][number]

const FIXING_COLUMNS: FinanceColumn<Fixing>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "rate", header: "USD / EGP", align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.rate)}</span> },
]

const chartConfig = { rate: { label: "USD / EGP", color: "var(--series-1)" } } satisfies ChartConfig

const dayMonth = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })

/** A single series over eight fixings: thin line, crosshair tooltip, table view. */
function FixingsChart({ fixings }: { fixings: Fixing[] }) {
  const first = fixings[0]
  const last = fixings[fixings.length - 1]
  return (
    <ChartTableToggle
      description={
        first && last
          ? `USD / EGP moved from ${formatRate(first.rate)} on ${formatDate(first.date)} to ${formatRate(last.rate)} on ${formatDate(last.date)}.`
          : undefined
      }
      chart={
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <LineChart data={fixings} margin={{ top: 12, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={dayMonth} />
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
      table={<FinanceTable caption="USD / EGP recent fixings" columns={FIXING_COLUMNS} rows={fixings} getRowId={(row) => row.date} />}
    />
  )
}

/** 05.12 · Currencies — the rates every foreign amount is restated at. */
function CurrenciesPage() {
  const { data, isError, refetch } = useCurrencies()
  const refresh = useRefreshRates()
  const [confirming, setConfirming] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Currencies & FX"
        figure={data ? <HeaderFigure label="Active currencies">{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="secondary" disabled={refresh.isPending} onClick={() => setConfirming(true)}>
            <RefreshCw aria-hidden />
            Refresh rates
          </Button>
        }
      />
      <FinancePageBody>
        <FinanceAlert tone="info">
          Rates are quoted against the Egyptian Pound and sourced from the central bank feed. Foreign-currency balances
          revalue at period end; the gain or loss books to the FX revaluation account.
          {data ? ` Last read ${formatDateTime(data.refreshed_at, " · ")}.` : null}
        </FinanceAlert>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <FinanceTable caption="Currencies" columns={CURRENCY_COLUMNS} rows={data?.items ?? []} loading={!data} getRowId={(row) => row.code} />
            {data ? (
              <FinanceSection title="USD / EGP · recent fixings">
                <FixingsChart fixings={data.fixings} />
              </FinanceSection>
            ) : null}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh FX rates?</AlertDialogTitle>
            <AlertDialogDescription>
              Rates are re-read from the central bank feed for the reporting date. Balances are revalued only when you
              post a revaluation — refreshing the rates on its own changes no posted figure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                refresh.mutate(undefined, {
                  onSuccess: () => toast.success("Rates re-read from the feed. They match the rates already in use."),
                  onError: (error) => toast.error(errorMessage(error, "The rates could not be refreshed. Try again.")),
                })
              }
            >
              Refresh rates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { CurrenciesPage }
