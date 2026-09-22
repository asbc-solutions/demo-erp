"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatAmount } from "../../../lib/utils/money"
import { useCostCenters } from "../../lib/queries/planning"
import type { CostCenter } from "../../lib/types/planning"
import { NewCostCenterDialog } from "./new-cost-center-dialog"

const INDENT = ["", "pl-5", "pl-10", "pl-14"] as const

const COLUMNS: FinanceColumn<CostCenter>[] = [
  {
    id: "center",
    header: "Cost center",
    cell: (row) => (
      <span className={cn("flex items-baseline gap-2", INDENT[Math.min(row.depth, INDENT.length - 1)])}>
        <DocNumber>{row.code}</DocNumber>
        <span className={cn("text-content-primary", row.depth === 0 && "font-medium")}>{row.name}</span>
      </span>
    ),
  },
  { id: "type", header: "Type", cell: (row) => <StatusPill status={`center-${row.type}`} label={row.type} tone="neutral" /> },
  { id: "revenue", header: "Revenue (EGP)", align: "end", cell: (row) => <Amount value={row.revenue} /> },
  { id: "expense", header: "Expense (EGP)", align: "end", cell: (row) => <Amount value={row.expense} /> },
  { id: "contribution", header: "Contribution (EGP)", align: "end", cell: (row) => <Amount value={row.contribution} signed emphasis="strong" /> },
]

/** 09.04 · Cost centers — the hierarchy and each center's own revenue, expense and contribution this year. */
function CostCentersPage() {
  const router = useRouter()
  const { data, isError, refetch } = useCostCenters()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Cost centers"
        figure={data ? <HeaderFigure label="Net contribution (EGP)">{formatAmount(data.contribution)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New cost center
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
              <KpiCard layout="bar" accent="indigo" label="Revenue (EGP)" value={formatAmount(data.revenue)} caption={`FY${data.year} to date`} />
              <KpiCard layout="bar" accent="teal" label="Expense (EGP)" value={formatAmount(data.expense)} caption={`FY${data.year} to date`} />
              <KpiCard
                layout="bar"
                accent={data.contribution < 0 ? "danger" : "amber"}
                label="Contribution (EGP)"
                value={formatAmount(data.contribution)}
                caption={data.margin === null ? undefined : `${data.margin}% margin`}
              />
            </div>
            <FinanceTable
              caption="Cost centers"
              columns={COLUMNS}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/cost-centers/${row.id}`)}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              Each row shows what is posted to that center itself; a parent&apos;s figures do not include its sub-centers. Lines
              posted without a cost center are spread by each center&apos;s share of the account class, so the centers add back
              to the ledger.
            </p>
          </>
        )}
      </FinancePageBody>
      <NewCostCenterDialog open={dialogOpen} onOpenChange={setDialogOpen} centers={data?.items ?? []} />
    </>
  )
}

export { CostCentersPage }
