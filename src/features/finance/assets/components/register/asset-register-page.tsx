"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useAssetRegister } from "../../lib/queries/assets"
import type { Asset, AssetsTranslator } from "../../lib/types/assets"

function buildColumns(t: AssetsTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Asset>[] {
  return [
    { id: "tag", header: t("tag"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
    { id: "asset", header: t("asset"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "category", header: t("category"), cell: (row) => <span className="text-content-secondary">{row.category_name}</span> },
    { id: "acquired", header: t("acquired"), cell: (row) => formatDate(row.in_service) },
    { id: "cost", header: t("costEgp"), align: "end", cell: (row) => <Amount value={row.cost} /> },
    { id: "accumulated", header: t("accumDeprecEgp"), align: "end", cell: (row) => <Amount value={-row.accumulated} signed /> },
    {
      id: "nbv",
      header: t("netBookEgp"),
      align: "end",
      cell: (row) => <Amount value={row.nbv} emphasis={row.status === "in_service" ? "default" : "muted"} />,
    },
    { id: "status", header: t("status"), cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/** 08.01 · Asset register — every fixed asset with its cost, depreciation to date and book value. */
function AssetRegisterPage() {
  const t = useTranslations("FinanceAssets")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const router = useRouter()
  const { data, isError, refetch } = useAssetRegister()
  const [category, setCategory] = React.useState("all")
  const rows = data?.items.filter((row) => category === "all" || row.category_id === category) ?? []
  const filters = [{ id: "all", name: t("all") }, ...(data?.categories ?? [])]

  return (
    <>
      <FinancePageHeader
        title={t("assetRegister")}
        figure={
          data ? (
            <HeaderFigure label={t("netBookValueEgp")} size="lg">
              {formatAmount(data.nbv)}
            </HeaderFigure>
          ) : null
        }
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/assets/depreciation">{t("depreciationRun")}</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/finance/assets/new">
                <Plus aria-hidden />
                {t("addAsset")}
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
                label={t("grossCostEgp")}
                value={formatAmount(data.cost)}
                caption={t("assetsInService", { count: data.in_service + data.retired, inService: data.in_service })}
              />
              <KpiCard layout="bar" accent="teal" label={t("accumulatedDepreciationEgp")} value={formatAmount(data.accumulated)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("netBookValueEgp")}
                value={formatAmount(data.nbv)}
                caption={t("percentOfCost", { percent: data.cost ? Math.round((data.nbv / data.cost) * 100) : 0 })}
              />
            </div>

            <div role="group" aria-label={t("filterByCategory")} className="flex flex-wrap gap-1.5">
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
              caption={t("fixedAssets")}
              columns={columns}
              rows={rows}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/assets/${row.id}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noAssetsInCategory")}</p>}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AssetRegisterPage }
