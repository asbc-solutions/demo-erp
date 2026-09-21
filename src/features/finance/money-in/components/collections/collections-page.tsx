"use client"

import Link from "next/link"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCollections } from "../../lib/queries/receivables"
import type { ArDocument } from "../../lib/types/receivables"
import { AgingBucketPill } from "../shared/aging-bucket-pill"

const COLUMNS: FinanceColumn<ArDocument>[] = [
  { id: "invoice", header: "Invoice", cell: (row) => <DocNumber>{row.number}</DocNumber> },
  {
    id: "customer",
    header: "Customer",
    cell: (row) => <span className="text-content-primary font-medium">{row.customer_name}</span>,
  },
  { id: "due", header: "Due", cell: (row) => (row.due_date ? formatDate(row.due_date) : "—") },
  {
    id: "late",
    header: "Days late",
    align: "end",
    cell: (row) => <span className="text-status-danger-fg tabular-nums">{row.days_late}</span>,
  },
  { id: "bucket", header: "Bucket", cell: (row) => <AgingBucketPill bucket={row.bucket} /> },
  {
    id: "outstanding",
    header: "Outstanding (EGP)",
    align: "end",
    cell: (row) => <Amount value={row.outstanding_base} />,
  },
  {
    id: "action",
    header: <span className="sr-only">Follow up</span>,
    align: "end",
    cell: (row) => (
      <Button variant="secondary" size="sm" asChild>
        <Link href={`/finance/ar/${row.customer_id}`} aria-label={`Follow up ${row.number} with ${row.customer_name}`}>
          Follow up
        </Link>
      </Button>
    ),
  },
]

/** 02.07 · Collections — overdue invoices ranked by exposure. */
function CollectionsPage() {
  const { data, isError, refetch } = useCollections()

  return (
    <>
      <FinancePageHeader
        title="Collections"
        figure={
          data ? (
            <HeaderFigure size="lg" label="Overdue receivable (EGP)">
              {formatAmount(data.overdue_base)}
            </HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading collections" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Overdue invoices" value={data.overdue_count} />
              <KpiCard layout="bar" accent="teal" label="Overdue (EGP)" value={formatAmount(data.overdue_base)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Over 90 days (EGP)"
                value={formatAmount(data.over90_base)}
                caption={`${data.over90_count} invoices`}
              />
            </div>
            <FinanceAlert tone="warning">
              These invoices are past due and ranked by exposure. Following up opens the customer card,
              where a receipt can be allocated against the oldest open item first.
            </FinanceAlert>
            <FinanceTable
              caption="Overdue invoices ranked by exposure"
              columns={COLUMNS}
              rows={data.items}
              getRowId={(row) => row.id}
              empty={
                <p className="text-content-tertiary py-8 text-center text-sm">Nothing is overdue.</p>
              }
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CollectionsPage }
