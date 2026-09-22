"use client"

import * as React from "react"
import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Progress } from "@/src/shared/components/ui/progress"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure, MetaChips } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate, formatPeriod } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { METHOD_LABELS, costCenterLabel } from "../../lib/constants/assets"
import { useAssetDetail } from "../../lib/queries/assets"
import type { AssetHistoryEvent, AssetScheduleRow } from "../../lib/types/assets"
import { DisposeDialog, EditAssetDialog, WriteOffDialog } from "./asset-dialogs"

const SCHEDULE_COLUMNS: FinanceColumn<AssetScheduleRow>[] = [
  { id: "period", header: "Run", cell: (row) => formatPeriod(row.period) },
  { id: "charge", header: "Charge (EGP)", align: "end", cell: (row) => <Amount value={row.charge} /> },
  { id: "accumulated", header: "Accumulated (EGP)", align: "end", cell: (row) => <Amount value={row.accumulated} /> },
  { id: "nbv", header: "Net book after (EGP)", align: "end", cell: (row) => <Amount value={row.nbv} emphasis="strong" /> },
]

const HISTORY_COLUMNS: FinanceColumn<AssetHistoryEvent & { key: string }>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "event", header: "Event", cell: (row) => <span className="text-content-primary">{row.event}</span> },
  {
    id: "entry",
    header: "Entry",
    cell: (row) => (row.entry ? <DocNumber href={`/finance/journals/${row.entry}`}>{row.entry}</DocNumber> : <span className="text-content-tertiary">—</span>),
  },
  { id: "amount", header: "Amount (EGP)", align: "end", cell: (row) => (row.amount === null ? null : <Amount value={row.amount} signed />) },
]

/** 08.02 · Asset detail — cost, depreciation to date, the coming runs, and the asset's lifecycle actions. */
function AssetDetailPage({ assetId }: { assetId: string }) {
  const { data, isError, isPending, refetch } = useAssetDetail(assetId)
  const [dialog, setDialog] = React.useState<"dispose" | "write-off" | "edit" | null>(null)
  const onOpenChange = (name: typeof dialog) => (open: boolean) => setDialog(open ? name : null)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Asset" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title="Asset not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no asset with this tag."
            description="The link may be out of date. Find the asset in the register."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/assets">Open the asset register</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const inService = data?.status === "in_service"
  const depreciable = data ? data.cost - data.salvage : 0

  return (
    <>
      <FinancePageHeader
        title={
          data ? (
            <span className="flex items-baseline gap-2.5">
              <DocNumber className="text-xs font-normal">{data.number}</DocNumber>
              {data.name}
            </span>
          ) : (
            "Asset"
          )
        }
        breadcrumbs={
          data
            ? [{ label: "Assets" }, { label: "Asset register", href: "/finance/assets" }, { label: `${data.number} ${data.name}` }]
            : undefined
        }
        figure={
          data ? (
            <HeaderFigure label="Net book value (EGP)">{formatAmount(data.nbv)}</HeaderFigure>
          ) : null
        }
        actions={
          inService ? (
            <>
              <Button variant="danger" onClick={() => setDialog("dispose")}>
                Dispose
              </Button>
              <Button variant="ghost" onClick={() => setDialog("write-off")}>
                Write off
              </Button>
              <Button variant="secondary" onClick={() => setDialog("edit")}>
                Edit
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label="Loading asset" className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={4} />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status={data.status} />
              <StatusPill status="prepared" label={data.category_name} />
              <StatusPill status="prepared" label={METHOD_LABELS[data.method]} />
              <span>{data.location}</span>
              <span>{costCenterLabel(data.cost_center_id)}</span>
            </MetaChips>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Cost (EGP)" value={formatAmount(data.cost)} caption={data.cost_account ? `Account ${data.cost_account}` : undefined} />
              <KpiCard
                layout="bar"
                accent="teal"
                label="Accumulated depreciation (EGP)"
                value={formatAmount(data.accumulated)}
                caption={`${data.pct_depreciated}% depreciated`}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Monthly charge (EGP)"
                value={formatAmount(data.monthly_charge)}
                caption={inService ? (data.monthly_charge > 0 ? "Next run" : "Fully depreciated") : "No longer depreciating"}
              />
              <KpiCard layout="bar" accent="blue" label="Salvage (EGP)" value={formatAmount(data.salvage)} />
            </div>

            <FinanceSection title="Depreciation progress">
              <Progress
                value={depreciable > 0 ? Math.min(100, (data.accumulated / depreciable) * 100) : 100}
                size="sm"
                aria-label={`${data.pct_depreciated}% of cost depreciated`}
              />
              <p className="text-content-secondary text-[13px] leading-5">
                Acquired {formatDate(data.in_service)} · useful life {data.life} months · {METHOD_LABELS[data.method]}.{" "}
                {inService
                  ? "Book value settles at the salvage value once fully depreciated."
                  : `${data.status === "disposed" ? "Disposed" : "Written off"} on ${formatDate(data.retired_on)}${data.retire_reason ? ` — ${data.retire_reason}` : ""}.`}
              </p>
            </FinanceSection>

            {inService && data.schedule.length > 0 ? (
              <FinanceSection title="Coming runs" description="The next twelve monthly charges if nothing about the asset changes.">
                <FinanceTable caption={`Depreciation schedule for ${data.number}`} columns={SCHEDULE_COLUMNS} rows={data.schedule} getRowId={(row) => row.id} />
              </FinanceSection>
            ) : null}

            <FinanceSection title="History">
              <FinanceTable
                caption={`History of ${data.number}`}
                columns={HISTORY_COLUMNS}
                rows={[...data.history].reverse().map((row, index) => ({ ...row, key: `${row.date}-${index}` }))}
                getRowId={(row) => row.key}
              />
            </FinanceSection>

            {inService ? (
              <>
                <DisposeDialog asset={data} open={dialog === "dispose"} onOpenChange={onOpenChange("dispose")} />
                <WriteOffDialog asset={data} open={dialog === "write-off"} onOpenChange={onOpenChange("write-off")} />
                <EditAssetDialog asset={data} open={dialog === "edit"} onOpenChange={onOpenChange("edit")} />
              </>
            ) : null}
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AssetDetailPage }
