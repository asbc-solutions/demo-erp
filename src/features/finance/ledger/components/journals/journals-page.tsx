"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { Download, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import {
  FinanceTable,
  columnLabel,
  type FinanceColumn,
  type FinanceTableGroup,
} from "../../../components/shared/finance-table"
import {
  ColumnChooser,
  FilterBar,
  FilterChip,
  FilterIcon,
  FilterSearch,
  GroupBySelect,
  ResultCount,
  SelectionBar,
} from "../../../components/shared/filter-bar"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StatusPill, useStatusLabel } from "../../../components/shared/status-pill"
import { downloadCsv } from "../../../lib/utils/csv"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useJournals } from "../../lib/queries/ledger"
import type {
  JournalFilters,
  JournalStatus,
  JournalSummary,
  LedgerMessageKey,
  LedgerTranslator,
} from "../../lib/types/ledger"

type KeyedOption = { value: string; labelKey: LedgerMessageKey }

const JOURNAL_STATUSES: JournalStatus[] = ["draft", "pending", "posted", "reversed"]

const ORIGIN_OPTIONS: KeyedOption[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "auto", labelKey: "auto" },
  { value: "manual", labelKey: "manual" },
]

const GROUP_OPTIONS: KeyedOption[] = [
  { value: "none", labelKey: "noGrouping" },
  { value: "status", labelKey: "status" },
  { value: "month", labelKey: "month" },
  { value: "origin", labelKey: "origin" },
]

function foreignBase(row: JournalSummary, value: number) {
  return row.currency === "EGP" ? undefined : { value, currency: "EGP" }
}

function buildColumns(t: LedgerTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<JournalSummary>[] {
  return [
    { id: "date", header: t("date"), cell: (row) => formatDate(row.date) },
    {
      id: "description",
      header: t("description"),
      cell: (row) => <span className="block max-w-80 truncate">{row.description}</span>,
    },
    {
      id: "source",
      header: t("source"),
      hideable: true,
      cell: (row) =>
        row.source_href ? (
          <Link href={row.source_href} className="font-mono text-xs hover:underline" onClick={(event) => event.stopPropagation()}>
            {row.source}
          </Link>
        ) : (
          <span className="text-content-tertiary">{row.source}</span>
        ),
    },
    {
      id: "origin",
      header: t("origin"),
      hideable: true,
      cell: (row) => (
        <StatusPill status={`origin-${row.origin}`} label={row.origin === "auto" ? t("auto") : t("manual")} tone={row.origin === "auto" ? "info" : "neutral"} />
      ),
    },
    { id: "currency", header: t("currency"), hideable: true, cell: (row) => row.currency },
    {
      id: "debit",
      header: t("debit"),
      align: "end",
      cell: (row) => <Amount value={row.debit} currency={row.currency} base={foreignBase(row, row.debit_base)} />,
    },
    {
      id: "credit",
      header: t("credit"),
      align: "end",
      hideable: true,
      cell: (row) => <Amount value={row.credit} currency={row.currency} base={foreignBase(row, row.credit_base)} />,
    },
    { id: "status", header: t("status"), cell: (row) => <StatusPill status={row.status} /> },
    { id: "number", header: t("entryNo"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
  ]
}

/** 05.03 · Journal entries — every entry in the ledger, filterable, with bulk export. */
function JournalsPage() {
  const t = useTranslations("FinanceLedger")
  const { formatDate, formatPeriod } = useFinanceDateFormat()
  const router = useRouter()
  const [filters, setFilters] = React.useState<JournalFilters>({ status: "all", origin: "all", currency: "all", q: "" })
  const [search, setSearch] = React.useState("")
  const { data, isError, refetch } = useJournals(filters)
  const [selected, setSelected] = React.useState<string[]>([])
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>(["currency"])
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const translateOptions = (options: KeyedOption[]) => options.map((option) => ({ value: option.value, label: t(option.labelKey) }))
  const statusLabel = useStatusLabel()
  // "reversed" is not in the shared finance status vocabulary, so it keeps a ledger key.
  const journalStatusLabel = (status: JournalStatus) => (status === "reversed" ? t("statusReversed") : statusLabel(status))
  const statusOptions = [
    { value: "all", label: t("filterAll") },
    ...JOURNAL_STATUSES.map((status) => ({ value: status, label: journalStatusLabel(status) })),
  ]

  // Search runs as you type, a beat after the last key.
  React.useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => (current.q === search ? current : { ...current, q: search })), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const setFilter = (key: keyof JournalFilters) => (value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const items = React.useMemo(() => data?.items ?? [], [data])

  const groups: FinanceTableGroup<JournalSummary>[] | undefined = React.useMemo(() => {
    if (groupBy === "none") return undefined
    const keyOf = (row: JournalSummary) => (groupBy === "status" ? row.status : groupBy === "origin" ? row.origin : row.period)
    return Array.from(new Set(items.map(keyOf))).map((key) => ({
      id: key,
      label:
        groupBy === "month"
          ? formatPeriod(key)
          : groupBy === "status"
            ? key === "reversed"
              ? t("statusReversed")
              : statusLabel(key)
            : key === "auto"
              ? t("auto")
              : t("manual"),
      rows: items.filter((row) => keyOf(row) === key),
    }))
  }, [items, groupBy, t, statusLabel, formatPeriod])

  const exportSelected = () => {
    const rows = items.filter((row) => selected.includes(row.id))
    downloadCsv(
      "journal-entries.csv",
      [t("entryNo"), t("date"), t("description"), t("source"), t("origin"), t("currency"), t("debit"), t("credit"), t("debitEgp"), t("status")],
      rows.map((row) => [row.number, row.date, row.description, row.source, row.origin, row.currency, row.debit, row.credit, row.debit_base, row.status]),
    )
  }

  const currencyOptions = [{ value: "all", label: t("filterAll") }, ...(data?.currencies ?? []).map((code) => ({ value: code, label: code }))]

  return (
    <>
      <FinancePageHeader
        title={t("journalEntries")}
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              {t("newEntry")}
            </Link>
          </Button>
        }
      />
      <FinancePageBody>
        {selected.length > 0 ? (
          <SelectionBar count={selected.length} onClear={() => setSelected([])}>
            <Button variant="secondary" size="sm" onClick={exportSelected}>
              <Download aria-hidden />
              {t("exportSelected")}
            </Button>
          </SelectionBar>
        ) : (
          <FilterBar>
            <FilterSearch value={search} onChange={(event) => setSearch(event.target.value)} />
            <FilterIcon />
            <FilterChip label={t("status")} value={filters.status} options={statusOptions} onValueChange={setFilter("status")} />
            <FilterChip label={t("origin")} value={filters.origin} options={translateOptions(ORIGIN_OPTIONS)} onValueChange={setFilter("origin")} />
            <FilterChip label={t("currency")} value={filters.currency} options={currencyOptions} onValueChange={setFilter("currency")} />
            <ResultCount>{data ? t("entriesCount", { shown: items.length, total: data.total }) : null}</ResultCount>
          </FilterBar>
        )}
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={translateOptions(GROUP_OPTIONS)} />
              <ColumnChooser
                columns={columns.filter((column) => column.hideable).map((column) => ({ id: column.id, label: columnLabel(column) }))}
                hiddenIds={hiddenIds}
                onHiddenIdsChange={setHiddenIds}
              />
            </div>
            <FinanceTable
              caption={t("journalEntries")}
              columns={columns}
              rows={items}
              groups={groups}
              loading={!data}
              getRowId={(row) => row.id}
              hiddenColumnIds={hiddenIds}
              selectable
              selectedIds={selected}
              onSelectedIdsChange={setSelected}
              onRowClick={(row) => router.push(`/finance/journals/${row.number}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noEntryMatches")}</p>}
            />
          </div>
        )}
      </FinancePageBody>
    </>
  )
}

export { JournalsPage }
