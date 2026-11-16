"use client"

import * as React from "react"
import { Download, Printer } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FilterBar, ResultCount } from "../../../components/shared/filter-bar"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { downloadCsv } from "../../../lib/utils/csv"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useTrialBalance } from "../../lib/queries/reports"
import type { TrialBalanceRow } from "../../lib/types/reports"

type View = "balances" | "nets" | "full"

const VIEWS: { value: View; label: string }[] = [
  { value: "balances", label: "Balances" },
  { value: "nets", label: "Nets" },
  { value: "full", label: "Full" },
]

const LEVELS = [
  { value: "1", label: "1 · Class" },
  { value: "2", label: "2 · Group" },
  { value: "3", label: "3 · Sub-group" },
  { value: "4", label: "4 · Account" },
]

/**
 * Rows at the chosen depth: an account or group shows when it is within the
 * level and nothing beneath it is. Those rows always add to the full totals.
 */
function rowsToLevel(rows: TrialBalanceRow[], level: number): TrialBalanceRow[] {
  const visible = rows.filter((row) => row.level <= level)
  const hasVisibleChild = new Set(visible.map((row) => row.parent_code).filter(Boolean))
  return visible.filter((row) => !hasVisibleChild.has(row.code))
}

const code: FinanceColumn<TrialBalanceRow> = {
  id: "code",
  header: "Account",
  cell: (row) => <span className={cn("font-mono text-xs", row.is_group && "font-semibold")}>{row.code}</span>,
  footer: "Total",
}
const name: FinanceColumn<TrialBalanceRow> = {
  id: "name",
  header: "Name",
  cell: (row) => <span className={cn("text-content-primary", row.is_group && "font-medium")}>{row.name}</span>,
}

/** Debit and credit sides, with zero sides muted as in the design. */
const side = (key: "debit" | "credit", label: string, total: number): FinanceColumn<TrialBalanceRow> => ({
  id: key,
  header: `${label} (EGP)`,
  align: "end",
  cell: (row) => <Amount value={row[key]} emphasis={row[key] === 0 ? "muted" : "default"} />,
  footer: <Amount value={total} emphasis="strong" />,
})

function columnsFor(view: View, debit: number, credit: number): FinanceColumn<TrialBalanceRow>[] {
  if (view === "nets") {
    return [code, name, { id: "net", header: "Nets (EGP)", align: "end", cell: (row) => <Amount value={row.net} />, footer: <Amount value={debit - credit} emphasis="strong" /> }]
  }
  const base = [code, name, side("debit", "Debit", debit), side("credit", "Credit", credit)]
  if (view === "balances") return base
  return [
    ...base,
    { id: "opening", header: "Opening balances (EGP)", align: "end", cell: (row) => <Amount value={row.opening} emphasis={row.opening === 0 ? "muted" : "default"} /> },
    { id: "changed", header: "Changed (EGP)", align: "end", cell: (row) => <Amount value={row.changed} /> },
  ]
}

/** 10.06 · Trial balance — every account's closing balance, proving debits equal credits. */
function TrialBalancePage() {
  const { data, isError, refetch } = useTrialBalance()
  const [view, setView] = React.useState<View>("balances")
  const [level, setLevel] = React.useState("4")

  const rows = data ? rowsToLevel(data.rows, Number(level)) : []
  const columns = data ? columnsFor(view, data.debit, data.credit) : []
  const balanced = data ? Math.abs(data.difference) < 0.005 : false

  const exportCsv = () => {
    if (!data) return
    const headers = ["Account", "Name", ...(view === "nets" ? ["Net"] : ["Debit", "Credit"]), ...(view === "full" ? ["Opening", "Changed"] : [])]
    const lines = rows.map((row) => [
      row.code,
      row.name,
      ...(view === "nets" ? [row.net.toFixed(2)] : [row.debit.toFixed(2), row.credit.toFixed(2)]),
      ...(view === "full" ? [row.opening.toFixed(2), row.changed.toFixed(2)] : []),
    ])
    downloadCsv(`trial-balance-${data.as_at}-${view}.csv`, headers, lines)
  }

  return (
    <>
      <FinancePageHeader title="Trial balance" />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <p className="text-content-secondary text-[13px] leading-5">
              {data.entity?.id ?? "EG-01"} · as at {formatDate(data.as_at)} · {data.currency}
            </p>

            <FilterBar className="print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-content-secondary text-[13px]">View</span>
                <div role="group" aria-label="View" className="bg-surface-page flex rounded-md p-0.5">
                  {VIEWS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={view === option.value}
                      onClick={() => setView(option.value)}
                      className={cn(
                        "text-content-secondary rounded-sm px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                        view === option.value && "bg-surface-white text-content-primary font-medium shadow-xs",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span id="tb-level-label" className="text-content-secondary text-[13px]">
                  Show to level
                </span>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger aria-labelledby="tb-level-label" className="h-8 w-36 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-content-secondary text-[13px]">
                Basis <span className="text-content-primary">Accrual — count when it happens</span>
              </span>
              <ResultCount>{data.accounts} accounts</ResultCount>
              <div className="ms-auto flex gap-2">
                <Button variant="secondary" size="sm" onClick={exportCsv}>
                  <Download aria-hidden />
                  Export
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer aria-hidden />
                  Print
                </Button>
              </div>
            </FilterBar>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Total debit (EGP)" value={formatAmount(data.debit)} />
              <KpiCard layout="bar" accent="teal" label="Total credit (EGP)" value={formatAmount(data.credit)} />
              <KpiCard
                layout="bar"
                accent={balanced ? "success" : "danger"}
                label="Difference (EGP)"
                value={formatAmount(data.difference)}
                caption={balanced ? "In balance" : "Out of balance — check suspense and unposted entries"}
              />
            </div>

            <FinanceTable caption={`Trial balance as at ${formatDate(data.as_at)}`} columns={columns} rows={rows} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { TrialBalancePage }
