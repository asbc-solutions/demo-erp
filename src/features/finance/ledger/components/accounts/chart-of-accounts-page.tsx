"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/src/i18n/navigation"

import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FilterBar, FilterSearch, ResultCount } from "../../../components/shared/filter-bar"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useLedgerAccounts } from "../../lib/queries/ledger"
import type { LedgerAccount, LedgerTranslator } from "../../lib/types/ledger"

const INDENT = ["ps-0", "ps-4", "ps-8", "ps-12"]

function buildColumns(t: LedgerTranslator): FinanceColumn<LedgerAccount>[] {
  return [
    {
      id: "code",
      header: t("code"),
      cell: (row) => (
        <span className={cn("font-mono text-xs", INDENT[row.level], row.is_group && "text-content-primary font-semibold")}>
          {row.code}
        </span>
      ),
    },
    {
      id: "name",
      header: t("accountName"),
      cell: (row) => (
        <span className={cn(INDENT[row.level], row.is_group ? "text-content-primary font-semibold" : "text-content-primary")}>
          {row.name}
        </span>
      ),
    },
    { id: "type", header: t("type"), cell: (row) => <span className="text-content-secondary">{t(`accountType.${row.type}`)}</span> },
    {
      id: "routing",
      header: t("routing"),
      cell: (row) =>
        row.is_group ? null : (
          <StatusPill
            status={`routing-${row.routing}`}
            label={row.routing === "auto" ? t("auto") : t("manual")}
            tone={row.routing === "auto" ? "info" : "neutral"}
          />
        ),
    },
    { id: "debit", header: t("debitEgp"), align: "end", cell: (row) => <Amount value={row.debit} emphasis={row.is_group ? "strong" : "default"} /> },
    { id: "credit", header: t("creditEgp"), align: "end", cell: (row) => <Amount value={row.credit} emphasis={row.is_group ? "strong" : "default"} /> },
    { id: "balance", header: t("balanceEgp"), align: "end", cell: (row) => <Amount value={row.balance} emphasis={row.is_group ? "strong" : "default"} /> },
  ]
}

/** 05.01 · Chart of accounts — every account with its debits, credits and balance, groups rolled up. */
function ChartOfAccountsPage() {
  const t = useTranslations("FinanceLedger")
  const router = useRouter()
  const { data, isError, refetch } = useLedgerAccounts()
  const [query, setQuery] = React.useState("")
  const columns = React.useMemo(() => buildColumns(t), [t])

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!data || !needle) return data ?? []
    return data.filter((row) => row.code.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle))
  }, [data, query])

  return (
    <>
      <FinancePageHeader title={t("chartOfAccounts")} />
      <FinancePageBody>
        <FilterBar>
          <FilterSearch placeholder={t("searchCodeOrName")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <ResultCount>
            {data ? t("postableAccounts", { count: data.filter((row) => !row.is_group).length }) : null}
          </ResultCount>
        </FilterBar>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <FinanceTable
            caption={t("chartOfAccounts")}
            columns={columns}
            rows={rows}
            loading={!data}
            getRowId={(row) => row.code}
            onRowClick={(row) => (row.is_group ? undefined : router.push(`/finance/ledger?account=${row.code}`))}
            empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noAccountMatches", { query })}</p>}
          />
        )}
      </FinancePageBody>
    </>
  )
}

export { ChartOfAccountsPage }
