"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCustody } from "../../lib/queries/banking"
import type { CustodyHolder } from "../../lib/types/banking"
import { NewCustodyDialog } from "./new-custody-dialog"

function columns(totals: { advanced: number; settled: number; outstanding: number }): FinanceColumn<CustodyHolder>[] {
  return [
    {
      id: "employee",
      header: "Employee",
      cell: (row) => (
        <span className="flex flex-col">
          <Link href={`/finance/custody/${row.id}`} className="text-content-primary text-[13px] leading-5 font-medium hover:underline">
            {row.name}
          </Link>
          <span className="text-content-tertiary text-xs leading-4">{row.role}</span>
        </span>
      ),
      footer: "Total",
    },
    { id: "since", header: "Held since", cell: (row) => (row.since ? formatDate(row.since) : "—") },
    { id: "advanced", header: "Advanced (EGP)", align: "end", cell: (row) => <Amount value={row.advanced} />, footer: <Amount value={totals.advanced} /> },
    { id: "settled", header: "Settled (EGP)", align: "end", cell: (row) => <Amount value={row.settled} />, footer: <Amount value={totals.settled} /> },
    {
      id: "outstanding",
      header: "Outstanding (EGP)",
      align: "end",
      cell: (row) => <Amount value={row.outstanding} emphasis="strong" />,
      footer: <Amount value={totals.outstanding} emphasis="strong" />,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (row.status === "open" ? <StatusPill status="open" /> : <StatusPill status="settled" label="cleared" />),
    },
  ]
}

/** 04.13 · Employee custody — cash advanced to staff and not yet accounted for. */
function CustodyPage() {
  const router = useRouter()
  const { data, isError, refetch } = useCustody()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const totals = {
    advanced: data?.items.reduce((sum, row) => sum + row.advanced, 0) ?? 0,
    settled: data?.items.reduce((sum, row) => sum + row.settled, 0) ?? 0,
    outstanding: data?.outstanding ?? 0,
  }

  return (
    <>
      <FinancePageHeader
        title="Employee custody"
        figure={data ? <HeaderFigure label="Outstanding custody (EGP)">{formatAmount(data.outstanding)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New custody
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading custody" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Open holders" value={data.open_count} />
              <KpiCard layout="bar" accent="teal" label="Outstanding (EGP)" value={formatAmount(data.outstanding)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Custody account"
                value={<span className="font-mono">{data.account}</span>}
                caption="Employee custody"
              />
            </div>
            <FinanceAlert tone="info">
              Custody is cash advanced to an employee against future expenses. It stays as a receivable until the
              employee settles it with receipts, at which point the spend reclassifies to the relevant expense
              account.
            </FinanceAlert>
            <FinanceTable
              caption="Employee custody"
              columns={columns(totals)}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/custody/${row.id}`)}
            />
          </>
        )}
      </FinancePageBody>
      <NewCustodyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { CustodyPage }
