"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useAssetRegister } from "../../lib/queries/assets"
import type { Asset } from "../../lib/types/assets"

const COLUMNS: FinanceColumn<Asset>[] = [
  { id: "tag", header: "Tag", cell: (row) => <DocNumber>{row.number}</DocNumber> },
  { id: "asset", header: "Asset", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "category", header: "Category", cell: (row) => <span className="text-content-secondary">{row.category_name}</span> },
  { id: "acquired", header: "Acquired", cell: (row) => formatDate(row.in_service) },
  { id: "cost", header: "Cost (EGP)", align: "end", cell: (row) => <Amount value={row.cost} /> },
  { id: "accumulated", header: "Accum. deprec. (EGP)", align: "end", cell: (row) => <Amount value={-row.accumulated} signed /> },
  {
    id: "nbv",
    header: "Net book (EGP)",
    align: "end",
    cell: (row) => <Amount value={row.nbv} emphasis={row.status === "in_service" ? "default" : "muted"} />,
  },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
]

/** 08.01 · Asset register — every fixed asset with its cost, depreciation to date and book value. */
function AssetRegisterPage() {
  const router = useRouter()
  const { data, isError, refetch } = useAssetRegister()
  const [category, setCategory] = React.useState("all")
  const rows = data?.items.filter((row) => category === "all" || row.category_id === category) ?? []
  const filters = [{ id: "all", name: "All" }, ...(data?.categories ?? [])]

  return (
    <>
      <FinancePageHeader
        title="Asset register"
        figure={
          data ? (
            <HeaderFigure label="Net book value (EGP)" size="lg">
              {formatAmount(data.nbv)}
            </HeaderFigure>
          ) : null
        }
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/assets/depreciation">Depreciation run</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/finance/assets/new">
                <Plus aria-hidden />
                Add asset
              </Link>
            </Button>
          </>
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
              <KpiCard
                layout="bar"
                accent="indigo"
                label="Gross cost (EGP)"
                value={formatAmount(data.cost)}
                caption={`${data.in_service + data.retired} assets · ${data.in_service} in service`}
              />
              <KpiCard layout="bar" accent="teal" label="Accumulated depreciation (EGP)" value={formatAmount(data.accumulated)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Net book value (EGP)"
                value={formatAmount(data.nbv)}
                caption={`${data.cost ? Math.round((data.nbv / data.cost) * 100) : 0}% of cost`}
              />
            </div>

            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
              {filters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={category === option.id}
                  onClick={() => setCategory(option.id)}
                  className={cn(
                    "border-stroke-default text-content-secondary rounded-full border px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                    category === option.id && "border-brand-primary bg-brand-primary/10 text-content-primary font-medium",
                  )}
                >
                  {option.name}
                </button>
              ))}
            </div>

            <FinanceTable
              caption="Fixed assets"
              columns={COLUMNS}
              rows={rows}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/assets/${row.id}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">No assets in this category yet.</p>}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AssetRegisterPage }
