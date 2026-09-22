"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useAdjustments } from "../../lib/queries/close"
import type { Adjustment } from "../../lib/types/close"

function columns(total: number): FinanceColumn<Adjustment>[] {
  return [
    { id: "number", header: "Entry no.", cell: (row) => <DocNumber>{row.number}</DocNumber>, footer: "Total" },
    { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { id: "description", header: "Description", cell: (row) => <span className="block max-w-96 truncate">{row.description}</span> },
    { id: "amount", header: "Amount (EGP)", align: "end", cell: (row) => <Amount value={row.amount} />, footer: <Amount value={total} emphasis="strong" /> },
    { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/** 06.04 · Adjustments — the manual entries booked during the close. */
function AdjustmentsPage() {
  const router = useRouter()
  const { data, isError, refetch } = useAdjustments()

  return (
    <>
      <FinancePageHeader
        title="Adjustments"
        figure={data ? <HeaderFigure label="Adjusting entries (EGP)">{formatAmount(data.total_base)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              New adjustment
            </Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Adjusting entries" value={data.count} />
              <KpiCard layout="bar" accent="teal" label="Total value (EGP)" value={formatAmount(data.total_base)} />
              <KpiCard layout="bar" accent="amber" label="Period" value={data.period.label} caption="Adjusting window" />
            </div>
            <FinanceAlert tone="info">
              Adjustments are manual entries booked during the close — accruals, provisions, and reclassifications. They
              post to the adjusting window of an otherwise closed period and are tagged for the audit trail.
            </FinanceAlert>
            <FinanceTable
              caption="Adjusting entries"
              columns={columns(data.total_base)}
              rows={data.items}
              getRowId={(row) => row.number}
              onRowClick={(row) => router.push(`/finance/journals/${row.number}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">No adjusting entries yet.</p>}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AdjustmentsPage }
