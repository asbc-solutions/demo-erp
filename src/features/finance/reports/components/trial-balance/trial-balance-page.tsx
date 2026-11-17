"use client"

import * as React from "react"
import { Download, Printer } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useTrialBalance } from "../../lib/queries/reports"
import type { ReportsMessageKey, ReportsTranslator, TrialBalanceRow } from "../../lib/types/reports"

type View = "balances" | "nets" | "full"

const VIEWS: { value: View; labelKey: ReportsMessageKey }[] = [
  { value: "balances", labelKey: "viewBalances" },
  { value: "nets", labelKey: "viewNets" },
  { value: "full", labelKey: "viewFull" },
]

const LEVELS: { value: string; labelKey: ReportsMessageKey }[] = [
  { value: "1", labelKey: "levelClass" },
  { value: "2", labelKey: "levelGroup" },
  { value: "3", labelKey: "levelSubGroup" },
  { value: "4", labelKey: "levelAccount" },
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

const codeColumn = (t: ReportsTranslator): FinanceColumn<TrialBalanceRow> => ({
  id: "code",
  header: t("account"),
  cell: (row) => <span className={cn("font-mono text-xs", row.is_group && "font-semibold")}>{row.code}</span>,
  footer: t("total"),
})
const nameColumn = (t: ReportsTranslator): FinanceColumn<TrialBalanceRow> => ({
  id: "name",
  header: t("name"),
  cell: (row) => <span className={cn("text-content-primary", row.is_group && "font-medium")}>{row.name}</span>,
})

/** Debit and credit sides, with zero sides muted as in the design. */
const side = (key: "debit" | "credit", label: string, total: number): FinanceColumn<TrialBalanceRow> => ({
  id: key,
  header: label,
  align: "end",
  cell: (row) => <Amount value={row[key]} emphasis={row[key] === 0 ? "muted" : "default"} />,
  footer: <Amount value={total} emphasis="strong" />,
})

function columnsFor(t: ReportsTranslator, view: View, debit: number, credit: number): FinanceColumn<TrialBalanceRow>[] {
  const code = codeColumn(t)
  const name = nameColumn(t)
  if (view === "nets") {
    return [code, name, { id: "net", header: t("netsEgp"), align: "end", cell: (row) => <Amount value={row.net} />, footer: <Amount value={debit - credit} emphasis="strong" /> }]
  }
  const base = [code, name, side("debit", t("debitEgp"), debit), side("credit", t("creditEgp"), credit)]
  if (view === "balances") return base
  return [
    ...base,
    { id: "opening", header: t("openingBalancesEgp"), align: "end", cell: (row) => <Amount value={row.opening} emphasis={row.opening === 0 ? "muted" : "default"} /> },
    { id: "changed", header: t("changedEgp"), align: "end", cell: (row) => <Amount value={row.changed} /> },
  ]
}

/** 10.06 · Trial balance — every account's closing balance, proving debits equal credits. */
function TrialBalancePage() {
  const t = useTranslations("FinanceReports")
  const { formatDate } = useFinanceDateFormat()
  const { data, isError, refetch } = useTrialBalance()
  const [view, setView] = React.useState<View>("balances")
  const [level, setLevel] = React.useState("4")

  const rows = data ? rowsToLevel(data.rows, Number(level)) : []
  const columns = data ? columnsFor(t, view, data.debit, data.credit) : []
  const balanced = data ? Math.abs(data.difference) < 0.005 : false

  const exportCsv = () => {
    if (!data) return
    const headers = [
      t("account"),
      t("name"),
      ...(view === "nets" ? [t("net")] : [t("debit"), t("credit")]),
      ...(view === "full" ? [t("opening"), t("changed")] : []),
    ]
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
      <FinancePageHeader title={t("trialBalance")} />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <p className="text-content-secondary text-[13px] leading-5">
              {t("tbSubtitle", { entity: data.entity?.id ?? "EG-01", date: formatDate(data.as_at), currency: data.currency })}
            </p>

            <FilterBar className="print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-content-secondary text-[13px]">{t("view")}</span>
                <div role="group" aria-label={t("view")} className="bg-surface-page flex rounded-md p-0.5">
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
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span id="tb-level-label" className="text-content-secondary text-[13px]">
                  {t("showToLevel")}
                </span>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger aria-labelledby="tb-level-label" className="h-8 w-36 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-content-secondary text-[13px]">
                {t.rich("basisAccrual", { strong: (chunks) => <span className="text-content-primary">{chunks}</span> })}
              </span>
              <ResultCount>{t("accountsCount", { count: data.accounts })}</ResultCount>
              <div className="ms-auto flex gap-2">
                <Button variant="secondary" size="sm" onClick={exportCsv}>
                  <Download aria-hidden />
                  {t("export")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer aria-hidden />
                  {t("print")}
                </Button>
              </div>
            </FilterBar>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("totalDebitEgp")} value={formatAmount(data.debit)} />
              <KpiCard layout="bar" accent="teal" label={t("totalCreditEgp")} value={formatAmount(data.credit)} />
              <KpiCard
                layout="bar"
                accent={balanced ? "success" : "danger"}
                label={t("differenceEgp")}
                value={formatAmount(data.difference)}
                caption={balanced ? t("inBalance") : t("outOfBalanceHint")}
              />
            </div>

            <FinanceTable caption={t("tbCaption", { date: formatDate(data.as_at) })} columns={columns} rows={rows} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { TrialBalancePage }
