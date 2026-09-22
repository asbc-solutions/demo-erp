"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { SearchX } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure, MetaChips } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatAmount } from "../../../lib/utils/money"
import { useCostCenter } from "../../lib/queries/planning"
import type { CostCenter, CostCenterDetail } from "../../lib/types/planning"

type AccountRow = CostCenterDetail["accounts"][number]

const CHILD_COLUMNS: FinanceColumn<CostCenter>[] = [
  {
    id: "center",
    header: "Sub-center",
    cell: (row) => (
      <span className="flex items-baseline gap-2">
        <DocNumber>{row.code}</DocNumber>
        <span className="text-content-primary">{row.name}</span>
      </span>
    ),
  },
  { id: "revenue", header: "Revenue (EGP)", align: "end", cell: (row) => <Amount value={row.revenue} /> },
  { id: "expense", header: "Expense (EGP)", align: "end", cell: (row) => <Amount value={row.expense} /> },
  { id: "contribution", header: "Contribution (EGP)", align: "end", cell: (row) => <Amount value={row.contribution} signed /> },
]

const ACCOUNT_COLUMNS: FinanceColumn<AccountRow>[] = [
  {
    id: "account",
    header: "Account",
    cell: (row) => (
      <span className="flex items-baseline gap-2">
        <DocNumber href={`/finance/ledger?account=${row.code}`}>{row.code}</DocNumber>
        <span className="text-content-primary">{row.name}</span>
      </span>
    ),
  },
  { id: "kind", header: "Kind", cell: (row) => (row.kind === "revenue" ? "Revenue" : "Expense") },
  { id: "amount", header: "Amount (EGP)", align: "end", cell: (row) => <Amount value={row.amount} /> },
]

/** 09.05 · Cost center — its own actuals, how its sub-centers are doing, and which accounts make them up. */
function CostCenterDetailPage({ centerId }: { centerId: string }) {
  const router = useRouter()
  const { data, isError, isPending, refetch } = useCostCenter(centerId)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Cost center" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title="Cost center not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no cost center with this code."
            description="It may have been added in another session. Pick it from the cost center list."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/cost-centers">Open cost centers</Link>
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
        title={
          data ? (
            <span className="flex items-baseline gap-2.5">
              <DocNumber className="text-xs font-normal">{data.code}</DocNumber>
              {data.name}
            </span>
          ) : (
            "Cost center"
          )
        }
        breadcrumbs={data ? [{ label: "Planning" }, { label: "Cost centers", href: "/finance/cost-centers" }, { label: `${data.code} ${data.name}` }] : undefined}
        figure={data ? <HeaderFigure label="Contribution (EGP)">{formatAmount(data.contribution)}</HeaderFigure> : null}
        actions={
          data?.budget_id ? (
            <Button variant="secondary" asChild>
              <Link href={`/finance/budgets/${data.budget_id}`}>View budget</Link>
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <MetaChips>
              <StatusPill status={`center-${data.type}`} label={data.type} tone="neutral" />
              <StatusPill status="ready" label="Active" tone="success" />
              {data.parent ? (
                <span>
                  Part of{" "}
                  <Link href={`/finance/cost-centers/${data.parent.id}`} className="text-content-primary hover:underline">
                    {data.parent.code} · {data.parent.name}
                  </Link>
                </span>
              ) : (
                <span>Top level</span>
              )}
              {data.name_ar ? (
                <span dir="rtl" lang="ar">
                  {data.name_ar}
                </span>
              ) : null}
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Revenue (EGP)" value={formatAmount(data.revenue)} caption={`FY${data.year} to date`} />
              <KpiCard layout="bar" accent="teal" label="Expense (EGP)" value={formatAmount(data.expense)} caption={`FY${data.year} to date`} />
              <KpiCard
                layout="bar"
                accent={data.contribution < 0 ? "danger" : "amber"}
                label="Margin"
                value={data.margin === null ? "—" : `${data.margin}%`}
                caption={data.margin === null ? "No revenue posted here" : undefined}
              />
            </div>

            {data.children.length ? (
              <FinanceSection title="Sub-centers" description="Each sub-center's figures include the centers below it.">
                <FinanceTable
                  caption={`Sub-centers of ${data.code}`}
                  columns={CHILD_COLUMNS}
                  rows={data.children}
                  getRowId={(row) => row.id}
                  onRowClick={(row) => router.push(`/finance/cost-centers/${row.id}`)}
                />
              </FinanceSection>
            ) : null}

            <FinanceSection title="By account" description="What is posted to this center itself this year.">
              <FinanceTable
                caption={`Accounts posted to ${data.code}`}
                columns={ACCOUNT_COLUMNS}
                rows={data.accounts}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">Nothing is posted to this center yet.</p>}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CostCenterDetailPage }
