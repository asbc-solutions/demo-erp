"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { AgingTiles } from "../../../components/shared/aging-tiles"
import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinanceTable,
  columnLabel,
  type FinanceColumn,
  type FinanceTableGroup,
} from "../../../components/shared/finance-table"
import { ColumnChooser, GroupBySelect } from "../../../components/shared/filter-bar"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { formatAmount, formatPercent } from "../../../lib/utils/money"
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useSubledgerOverview } from "../../lib/queries/subledger"
import type { ContactSummary, Side } from "../../lib/types/subledger"
import { AgingBucketPill } from "../shared/aging-bucket-pill"

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "currency", label: "Currency" },
  { value: "bucket", label: "Oldest bucket" },
]

function foreignBase(row: ContactSummary, value: number) {
  return row.currency === "EGP" ? undefined : { value, currency: "EGP" }
}

function contactColumns(side: Side): FinanceColumn<ContactSummary>[] {
  const config = SUBLEDGER_SIDES[side]
  return [
    {
      id: "contact",
      header: config.contact.singular,
      cell: (row) => (
        <span className="flex flex-col">
          <Link
            href={config.href.contact(row.id)}
            className="text-content-primary text-[13px] leading-5 font-medium hover:underline"
          >
            {row.name}
          </Link>
          <span className="text-content-tertiary font-mono text-xs leading-4">{row.code}</span>
        </span>
      ),
    },
    { id: "terms", header: "Terms", label: "Terms", hideable: true, cell: (row) => `${row.terms_days} days` },
    { id: "currency", header: "Currency", label: "Currency", hideable: true, cell: (row) => row.currency },
    { id: "open", header: "Open", align: "end", hideable: true, cell: (row) => row.open_items },
    {
      id: "overdue",
      header: "Overdue",
      align: "end",
      cell: (row) =>
        row.overdue > 0 ? (
          <Amount
            value={row.overdue}
            currency={row.currency}
            className="text-status-danger-fg"
            base={foreignBase(row, row.overdue_base)}
          />
        ) : (
          <span className="text-content-tertiary">—</span>
        ),
    },
    {
      id: "oldest",
      header: "Oldest",
      hideable: true,
      cell: (row) => (row.overdue > 0 ? <AgingBucketPill bucket={row.oldest_bucket} /> : "—"),
    },
    {
      id: "balance",
      header: "Balance",
      align: "end",
      cell: (row) => (
        <Amount value={row.balance} currency={row.currency} base={foreignBase(row, row.balance_base)} />
      ),
    },
  ]
}

/**
 * 02.01 · AR overview and 03.01 · AP overview — what is owed, how late it is,
 * and whether the documents tie to the control account.
 */
function SubledgerOverviewPage({ side }: { side: Side }) {
  const router = useRouter()
  const config = SUBLEDGER_SIDES[side]
  const { data, isError, refetch } = useSubledgerOverview(side)
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>(["currency"])

  const baseColumns = React.useMemo(() => contactColumns(side), [side])
  const columns = baseColumns.map((column) =>
    column.id === "overdue" && data
      ? { ...column, footer: <Amount value={data.overdue_base} currency="EGP" className="text-status-danger-fg" /> }
      : column.id === "balance" && data
        ? { ...column, footer: <Amount value={data.total_base} currency="EGP" emphasis="strong" /> }
        : column.id === "contact"
          ? { ...column, footer: "Total" }
          : column,
  )

  const groups: FinanceTableGroup<ContactSummary>[] | undefined = React.useMemo(() => {
    if (!data || groupBy === "none") return undefined
    const keyOf = (row: ContactSummary) => (groupBy === "currency" ? row.currency : row.oldest_bucket)
    const keys = Array.from(new Set(data.contacts.map(keyOf)))
    return keys.map((key) => {
      const rows = data.contacts.filter((row) => keyOf(row) === key)
      return {
        id: key,
        label: groupBy === "currency" ? key : key === "current" ? "Not overdue" : `Oldest ${key} days`,
        rows,
        summary: {
          balance: (
            <Amount
              value={rows.reduce((sum, row) => sum + row.balance_base, 0)}
              currency="EGP"
              emphasis="strong"
            />
          ),
        },
      }
    })
  }, [data, groupBy])

  const agrees = data ? Math.abs(data.documents_base - data.ledger_base) < 0.005 : true

  return (
    <>
      <FinancePageHeader
        title={config.overview.title}
        figure={
          data ? (
            <HeaderFigure size="lg" label={config.overview.figure}>
              {formatAmount(data.total_base)}
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="primary" asChild>
            <Link href={config.overview.action.href}>{config.overview.action.label}</Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={config.overview.loading} className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={5} className="md:grid-cols-5" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            <AgingTiles buckets={data.buckets} accents="severity" />

            <FinanceSection title="Does this agree with the ledger?">
              {agrees ? (
                <FinanceAlert tone="success" className="text-status-success-fg">
                  This total matches the {data.control_account} control account exactly.
                </FinanceAlert>
              ) : (
                <FinanceAlert tone="danger">
                  The documents and the {data.control_account} control account differ by{" "}
                  {formatAmount(data.documents_base - data.ledger_base)}. Something posted to the
                  control account without a document. Open the general ledger to find the entry.
                </FinanceAlert>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                <KpiCard
                  layout="bar"
                  accent="indigo"
                  label="From the documents (EGP)"
                  value={formatAmount(data.documents_base)}
                />
                <KpiCard
                  layout="bar"
                  accent="teal"
                  label="From the ledger (EGP)"
                  value={formatAmount(data.ledger_base)}
                />
              </div>
            </FinanceSection>

            <div className="flex flex-wrap gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-content-secondary text-[13px] leading-5">Total outstanding (EGP)</span>
                <span className="text-content-primary text-xl leading-7 font-semibold tabular-nums">
                  {formatAmount(data.total_base)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-content-secondary text-[13px] leading-5">Overdue (EGP)</span>
                <span className="text-status-danger-fg text-xl leading-7 font-semibold tabular-nums">
                  {formatAmount(data.overdue_base)}
                </span>
                <span className="text-content-tertiary text-[13px] leading-5">
                  {data.total_base > 0 ? formatPercent((data.overdue_base / data.total_base) * 100) : "—"} of
                  balance
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS} />
                <ColumnChooser
                  columns={baseColumns
                    .filter((column) => column.hideable)
                    .map((column) => ({ id: column.id, label: columnLabel(column) }))}
                  hiddenIds={hiddenIds}
                  onHiddenIdsChange={setHiddenIds}
                />
              </div>
              <FinanceTable
                caption={config.overview.caption}
                columns={columns}
                rows={data.contacts}
                groups={groups}
                getRowId={(row) => row.id}
                hiddenColumnIds={hiddenIds}
                onRowClick={(row) => router.push(config.href.contact(row.id))}
              />
            </div>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { SubledgerOverviewPage }
