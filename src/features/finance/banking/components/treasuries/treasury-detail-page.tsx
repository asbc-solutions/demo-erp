"use client"

import { Link } from "@/src/i18n/navigation"
import { ArrowLeftRight, ArrowRight, SearchX } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
  MetaChips,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useTreasuryDetail } from "../../lib/queries/banking"
import type { TreasuryMovement } from "../../lib/types/banking"

const COLUMNS: FinanceColumn<TreasuryMovement>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "entry", header: "Entry", cell: (row) => <DocNumber>{row.entry}</DocNumber> },
  {
    id: "description",
    header: "Description",
    cell: (row) => <span className="block max-w-80 truncate">{row.description}</span>,
  },
  {
    id: "source",
    header: "Source",
    cell: (row) =>
      row.source_href ? (
        <Link
          href={row.source_href}
          className="border-stroke-default text-content-primary hover:bg-surface-hover inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs"
        >
          {row.source}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      ) : (
        <span className="text-content-tertiary">{row.source}</span>
      ),
  },
  {
    id: "in",
    header: "In",
    align: "end",
    cell: (row) => (row.amount > 0 ? <Amount value={row.amount} /> : null),
  },
  {
    id: "out",
    header: "Out",
    align: "end",
    cell: (row) => (row.amount < 0 ? <Amount value={-row.amount} /> : null),
  },
]

function daysAgo(days: number | null) {
  if (days === null) return undefined
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`
}

/** 04.03 · Treasury — one cash account's book balance, reconciliation state and movements. */
function TreasuryDetailPage({ treasuryId }: { treasuryId: string }) {
  const { data, isError, isPending, refetch } = useTreasuryDetail(treasuryId)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Treasury" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title="Treasury not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no treasury with this code."
            description="It may have been closed or the link is out of date. Pick it from Treasuries & banks."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/treasuries">Open Treasuries & banks</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title={data?.name ?? "Treasury"}
        figure={
          data ? (
            <HeaderFigure label="Book balance">
              <Amount value={data.balance} currency={data.currency} align="start" signed />
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            <Button variant="secondary" asChild>
              <Link href={`/finance/ledger?account=${data.account_code}`}>View ledger</Link>
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label="Loading treasury" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status="prepared" label={data.kind === "bank" ? "Bank account" : "Cash treasury"} />
              <StatusPill status="prepared" label={data.currency} />
              <span className="text-content-primary font-mono text-xs">{data.account_code}</span>
              <span>{data.name}</span>
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label="Opening balance"
                value={`${formatAmount(data.opening_balance)} ${data.currency}`}
                caption="Before the movements below"
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label="Last reconciled"
                value={data.last_reconciled ? formatDate(data.last_reconciled) : "Never"}
                caption={daysAgo(data.days_since_reconciled)}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Unmatched lines"
                value={data.unmatched_lines}
                caption={
                  data.unmatched_lines > 0 ? (
                    <Link href={`/finance/reconciliation/${data.id}`} className="hover:underline">
                      Reconcile now
                    </Link>
                  ) : (
                    "All matched"
                  )
                }
              />
            </div>

            <FinanceSection
              title="Recent movements"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/finance/transfers?from=${data.id}`}>
                    <ArrowLeftRight aria-hidden />
                    Transfer
                  </Link>
                </Button>
              }
            >
              <FinanceTable
                caption={`Movements on ${data.name}`}
                columns={COLUMNS}
                rows={data.movements}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">No movements yet.</p>}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { TreasuryDetailPage }
