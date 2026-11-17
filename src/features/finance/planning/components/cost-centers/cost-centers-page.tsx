"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
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
import { formatAmount } from "../../../lib/utils/money"
import { useCostCenters } from "../../lib/queries/planning"
import { COST_CENTER_TYPES } from "../../lib/constants/planning"
import type { CostCenter, PlanningTranslator } from "../../lib/types/planning"
import { NewCostCenterDialog } from "./new-cost-center-dialog"

const INDENT = ["", "ps-5", "ps-10", "ps-14"] as const

function buildColumns(t: PlanningTranslator): FinanceColumn<CostCenter>[] {
  const typeLabel = (type: CostCenter["type"]) => {
    const option = COST_CENTER_TYPES.find((entry) => entry.value === type)
    return option ? t(option.labelKey) : type
  }
  return [
    {
      id: "center",
      header: t("costCenter"),
      cell: (row) => (
        <span className={cn("flex items-baseline gap-2", INDENT[Math.min(row.depth, INDENT.length - 1)])}>
          <DocNumber>{row.code}</DocNumber>
          <span className={cn("text-content-primary", row.depth === 0 && "font-medium")}>{row.name}</span>
        </span>
      ),
    },
    { id: "type", header: t("type"), cell: (row) => <StatusPill status={`center-${row.type}`} label={typeLabel(row.type)} tone="neutral" /> },
    { id: "revenue", header: t("revenueEgp"), align: "end", cell: (row) => <Amount value={row.revenue} /> },
    { id: "expense", header: t("expenseEgp"), align: "end", cell: (row) => <Amount value={row.expense} /> },
    { id: "contribution", header: t("contributionEgp"), align: "end", cell: (row) => <Amount value={row.contribution} signed emphasis="strong" /> },
  ]
}

/** 09.04 · Cost centers — the hierarchy and each center's own revenue, expense and contribution this year. */
function CostCentersPage() {
  const t = useTranslations("FinancePlanning")
  const columns = React.useMemo(() => buildColumns(t), [t])
  const router = useRouter()
  const { data, isError, refetch } = useCostCenters()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("costCenters")}
        figure={data ? <HeaderFigure label={t("netContributionEgp")}>{formatAmount(data.contribution)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newCostCenter")}
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
              <KpiCard layout="bar" accent="indigo" label={t("revenueEgp")} value={formatAmount(data.revenue)} caption={t("fyToDate", { year: data.year })} />
              <KpiCard layout="bar" accent="teal" label={t("expenseEgp")} value={formatAmount(data.expense)} caption={t("fyToDate", { year: data.year })} />
              <KpiCard
                layout="bar"
                accent={data.contribution < 0 ? "danger" : "amber"}
                label={t("contributionEgp")}
                value={formatAmount(data.contribution)}
                caption={data.margin === null ? undefined : t("marginPercent", { margin: data.margin })}
              />
            </div>
            <FinanceTable
              caption={t("costCenters")}
              columns={columns}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/cost-centers/${row.id}`)}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              {t("costCentersInfo")}
            </p>
          </>
        )}
      </FinancePageBody>
      <NewCostCenterDialog open={dialogOpen} onOpenChange={setDialogOpen} centers={data?.items ?? []} />
    </>
  )
}

export { CostCentersPage }
