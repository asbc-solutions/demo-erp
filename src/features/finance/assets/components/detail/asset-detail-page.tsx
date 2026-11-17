"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { SearchX } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { METHOD_LABEL_KEYS } from "../../lib/constants/assets"
import { useAssetDetail } from "../../lib/queries/assets"
import type { AssetHistoryEvent, AssetScheduleRow, AssetsTranslator } from "../../lib/types/assets"
import { DisposeDialog, EditAssetDialog, WriteOffDialog } from "./asset-dialogs"

function buildScheduleColumns(t: AssetsTranslator, formatPeriod: FinanceDateFormat["formatPeriod"]): FinanceColumn<AssetScheduleRow>[] {
  return [
    { id: "period", header: t("run"), cell: (row) => formatPeriod(row.period) },
    { id: "charge", header: t("chargeEgp"), align: "end", cell: (row) => <Amount value={row.charge} /> },
    { id: "accumulated", header: t("accumulatedEgp"), align: "end", cell: (row) => <Amount value={row.accumulated} /> },
    { id: "nbv", header: t("netBookAfterEgp"), align: "end", cell: (row) => <Amount value={row.nbv} emphasis="strong" /> },
  ]
}

function buildHistoryColumns(t: AssetsTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<AssetHistoryEvent & { key: string }>[] {
  return [
    { id: "date", header: t("date"), cell: (row) => formatDate(row.date) },
    { id: "event", header: t("event"), cell: (row) => <span className="text-content-primary">{row.event}</span> },
    {
      id: "entry",
      header: t("entry"),
      cell: (row) => (row.entry ? <DocNumber href={`/finance/journals/${row.entry}`}>{row.entry}</DocNumber> : <span className="text-content-tertiary">—</span>),
    },
    { id: "amount", header: t("amountEgp"), align: "end", cell: (row) => (row.amount === null ? null : <Amount value={row.amount} signed />) },
  ]
}

/** 08.02 · Asset detail — cost, depreciation to date, the coming runs, and the asset's lifecycle actions. */
function AssetDetailPage({ assetId }: { assetId: string }) {
  const t = useTranslations("FinanceAssets")
  const { formatDate, formatPeriod } = useFinanceDateFormat()
  const scheduleColumns = React.useMemo(() => buildScheduleColumns(t, formatPeriod), [t, formatPeriod])
  const historyColumns = React.useMemo(() => buildHistoryColumns(t, formatDate), [t, formatDate])
  const { data, isError, isPending, refetch } = useAssetDetail(assetId)
  const [dialog, setDialog] = React.useState<"dispose" | "write-off" | "edit" | null>(null)
  const onOpenChange = (name: typeof dialog) => (open: boolean) => setDialog(open ? name : null)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("asset")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title={t("assetNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("assetNotFoundTitle")}
            description={t("assetNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/assets">{t("openAssetRegister")}</Link>
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
            t("asset")
          )
        }
        breadcrumbs={
          data
            ? [{ label: t("assets") }, { label: t("assetRegister"), href: "/finance/assets" }, { label: `${data.number} ${data.name}` }]
            : undefined
        }
        figure={
          data ? (
            <HeaderFigure label={t("netBookValueEgp")}>{formatAmount(data.nbv)}</HeaderFigure>
          ) : null
        }
        actions={
          inService ? (
            <>
              <Button variant="danger" onClick={() => setDialog("dispose")}>
                {t("dispose")}
              </Button>
              <Button variant="ghost" onClick={() => setDialog("write-off")}>
                {t("writeOff")}
              </Button>
              <Button variant="secondary" onClick={() => setDialog("edit")}>
                {t("edit")}
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label={t("loadingAsset")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={4} />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status={data.status} />
              <StatusPill status="prepared" label={data.category_name} />
              <StatusPill status="prepared" label={t(METHOD_LABEL_KEYS[data.method])} />
              <span>{data.location}</span>
              <Link href={`/finance/cost-centers/${data.cost_center_id}`} className="hover:text-content-primary hover:underline">
                {data.cost_center_id}
                {data.cost_center_name ? ` · ${data.cost_center_name}` : ""}
              </Link>
            </MetaChips>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("costEgp")} value={formatAmount(data.cost)} caption={data.cost_account ? t("accountCode", { code: data.cost_account }) : undefined} />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("accumulatedDepreciationEgp")}
                value={formatAmount(data.accumulated)}
                caption={t("percentDepreciated", { percent: data.pct_depreciated })}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("monthlyChargeEgp")}
                value={formatAmount(data.monthly_charge)}
                caption={inService ? (data.monthly_charge > 0 ? t("nextRun") : t("fullyDepreciated")) : t("noLongerDepreciating")}
              />
              <KpiCard layout="bar" accent="blue" label={t("salvageEgp")} value={formatAmount(data.salvage)} />
            </div>

            <FinanceSection title={t("depreciationProgress")}>
              <Progress
                value={depreciable > 0 ? Math.min(100, (data.accumulated / depreciable) * 100) : 100}
                size="sm"
                aria-label={t("percentOfCostDepreciated", { percent: data.pct_depreciated })}
              />
              <p className="text-content-secondary text-[13px] leading-5">
                {t("acquiredSummary", { date: formatDate(data.in_service), months: data.life, method: t(METHOD_LABEL_KEYS[data.method]) })}{" "}
                {inService
                  ? t("settlesAtSalvage")
                  : t(data.status === "disposed" ? "disposedOn" : "writtenOffOn", { date: formatDate(data.retired_on) }) +
                    (data.retire_reason ? ` — ${data.retire_reason}` : "") +
                    "."}
              </p>
            </FinanceSection>

            {inService && data.schedule.length > 0 ? (
              <FinanceSection title={t("comingRuns")} description={t("comingRunsDescription")}>
                <FinanceTable caption={t("scheduleFor", { number: data.number })} columns={scheduleColumns} rows={data.schedule} getRowId={(row) => row.id} />
              </FinanceSection>
            ) : null}

            <FinanceSection title={t("history")}>
              <FinanceTable
                caption={t("historyOf", { number: data.number })}
                columns={historyColumns}
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
