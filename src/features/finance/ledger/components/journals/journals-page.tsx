"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { Download, Plus } from "lucide-react"

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
import { StatusPill } from "../../../components/shared/status-pill"
import { downloadCsv } from "../../../lib/utils/csv"
import { formatDate, formatPeriod } from "../../../lib/utils/date"
import { useJournals } from "../../lib/queries/ledger"
import type { JournalFilters, JournalSummary } from "../../lib/types/ledger"

const STATUS_OPTIONS = [
  { value: "all", label: "all" },
  { value: "draft", label: "draft" },
  { value: "pending", label: "pending" },
  { value: "posted", label: "posted" },
  { value: "reversed", label: "reversed" },
]

const ORIGIN_OPTIONS = [
  { value: "all", label: "all" },
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
]

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "month", label: "Month" },
  { value: "origin", label: "Origin" },
]

function foreignBase(row: JournalSummary, value: number) {
  return row.currency === "EGP" ? undefined : { value, currency: "EGP" }
}

const COLUMNS: FinanceColumn<JournalSummary>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  {
    id: "description",
    header: "Description",
    cell: (row) => <span className="block max-w-80 truncate">{row.description}</span>,
  },
  {
    id: "source",
    header: "Source",
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
    header: "Origin",
    hideable: true,
    cell: (row) => (
      <StatusPill status={`origin-${row.origin}`} label={row.origin === "auto" ? "Auto" : "Manual"} tone={row.origin === "auto" ? "info" : "neutral"} />
    ),
  },
  { id: "currency", header: "Currency", hideable: true, cell: (row) => row.currency },
  {
    id: "debit",
    header: "Debit",
    align: "end",
    cell: (row) => <Amount value={row.debit} currency={row.currency} base={foreignBase(row, row.debit_base)} />,
  },
  {
    id: "credit",
    header: "Credit",
    align: "end",
    hideable: true,
    cell: (row) => <Amount value={row.credit} currency={row.currency} base={foreignBase(row, row.credit_base)} />,
  },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  { id: "number", header: "Entry no.", cell: (row) => <DocNumber>{row.number}</DocNumber> },
]

/** 05.03 · Journal entries — every entry in the ledger, filterable, with bulk export. */
function JournalsPage() {
  const router = useRouter()
  const [filters, setFilters] = React.useState<JournalFilters>({ status: "all", origin: "all", currency: "all", q: "" })
  const [search, setSearch] = React.useState("")
  const { data, isError, refetch } = useJournals(filters)
  const [selected, setSelected] = React.useState<string[]>([])
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>(["currency"])

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
      label: groupBy === "month" ? formatPeriod(key) : key === "auto" ? "Auto" : key === "manual" ? "Manual" : key,
      rows: items.filter((row) => keyOf(row) === key),
    }))
  }, [items, groupBy])

  const exportSelected = () => {
    const rows = items.filter((row) => selected.includes(row.id))
    downloadCsv(
      "journal-entries.csv",
      ["Entry no.", "Date", "Description", "Source", "Origin", "Currency", "Debit", "Credit", "Debit (EGP)", "Status"],
      rows.map((row) => [row.number, row.date, row.description, row.source, row.origin, row.currency, row.debit, row.credit, row.debit_base, row.status]),
    )
  }

  const currencyOptions = [{ value: "all", label: "all" }, ...(data?.currencies ?? []).map((code) => ({ value: code, label: code }))]

  return (
    <>
      <FinancePageHeader
        title="Journal entries"
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              New entry
            </Link>
          </Button>
        }
      />
      <FinancePageBody>
        {selected.length > 0 ? (
          <SelectionBar count={selected.length} onClear={() => setSelected([])}>
            <Button variant="secondary" size="sm" onClick={exportSelected}>
              <Download aria-hidden />
              Export selected
            </Button>
          </SelectionBar>
        ) : (
          <FilterBar>
            <FilterSearch value={search} onChange={(event) => setSearch(event.target.value)} />
            <FilterIcon />
            <FilterChip label="Status" value={filters.status} options={STATUS_OPTIONS} onValueChange={setFilter("status")} />
            <FilterChip label="Origin" value={filters.origin} options={ORIGIN_OPTIONS} onValueChange={setFilter("origin")} />
            <FilterChip label="Currency" value={filters.currency} options={currencyOptions} onValueChange={setFilter("currency")} />
            <ResultCount>{data ? `${items.length} of ${data.total} entries` : null}</ResultCount>
          </FilterBar>
        )}
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS} />
              <ColumnChooser
                columns={COLUMNS.filter((column) => column.hideable).map((column) => ({ id: column.id, label: columnLabel(column) }))}
                hiddenIds={hiddenIds}
                onHiddenIdsChange={setHiddenIds}
              />
            </div>
            <FinanceTable
              caption="Journal entries"
              columns={COLUMNS}
              rows={items}
              groups={groups}
              loading={!data}
              getRowId={(row) => row.id}
              hiddenColumnIds={hiddenIds}
              selectable
              selectedIds={selected}
              onSelectedIdsChange={setSelected}
              onRowClick={(row) => router.push(`/finance/journals/${row.number}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">No entry matches these filters.</p>}
            />
          </div>
        )}
      </FinancePageBody>
    </>
  )
}

export { JournalsPage }
