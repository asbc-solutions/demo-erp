"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/src/i18n/navigation"
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
import { COST_CENTER_TYPES } from "../../lib/constants/planning"
import type { CostCenter, CostCenterDetail, PlanningTranslator } from "../../lib/types/planning"

type AccountRow = CostCenterDetail["accounts"][number]

function buildChildColumns(t: PlanningTranslator): FinanceColumn<CostCenter>[] {
  return [
    {
      id: "center",
      header: t("subCenter"),
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber>{row.code}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
    },
    { id: "revenue", header: t("revenueEgp"), align: "end", cell: (row) => <Amount value={row.revenue} /> },
    { id: "expense", header: t("expenseEgp"), align: "end", cell: (row) => <Amount value={row.expense} /> },
    { id: "contribution", header: t("contributionEgp"), align: "end", cell: (row) => <Amount value={row.contribution} signed /> },
  ]
}

function buildAccountColumns(t: PlanningTranslator): FinanceColumn<AccountRow>[] {
  return [
    {
      id: "account",
      header: t("account"),
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber href={`/finance/ledger?account=${row.code}`}>{row.code}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
    },
    { id: "kind", header: t("kind"), cell: (row) => (row.kind === "revenue" ? t("revenue") : t("expense")) },
    { id: "amount", header: t("amountEgp"), align: "end", cell: (row) => <Amount value={row.amount} /> },
  ]
}

/** 09.05 · Cost center — its own actuals, how its sub-centers are doing, and which accounts make them up. */
function CostCenterDetailPage({ centerId }: { centerId: string }) {
  const t = useTranslations("FinancePlanning")
  const childColumns = React.useMemo(() => buildChildColumns(t), [t])
  const accountColumns = React.useMemo(() => buildAccountColumns(t), [t])
  const router = useRouter()
  const { data, isError, isPending, refetch } = useCostCenter(centerId)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("costCenter")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title={t("centerNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("centerNotFoundTitle")}
            description={t("centerNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/cost-centers">{t("openCostCenters")}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const typeOption = data ? COST_CENTER_TYPES.find((entry) => entry.value === data.type) : undefined
  const typeLabel = typeOption ? t(typeOption.labelKey) : data?.type

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
            t("costCenter")
          )
        }
        breadcrumbs={data ? [{ label: t("planning") }, { label: t("costCenters"), href: "/finance/cost-centers" }, { label: `${data.code} ${data.name}` }] : undefined}
        figure={data ? <HeaderFigure label={t("contributionEgp")}>{formatAmount(data.contribution)}</HeaderFigure> : null}
        actions={
          data?.budget_id ? (
            <Button variant="secondary" asChild>
              <Link href={`/finance/budgets/${data.budget_id}`}>{t("viewBudget")}</Link>
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
              <StatusPill status={`center-${data.type}`} label={typeLabel} tone="neutral" />
              <StatusPill status="ready" label={t("active")} tone="success" />
              {data.parent ? (
                <span>
                  {t.rich("partOf", {
                    parent: `${data.parent.code} · ${data.parent.name}`,
                    link: (chunks) => (
                      <Link href={`/finance/cost-centers/${data.parent?.id}`} className="text-content-primary hover:underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              ) : (
                <span>{t("topLevel")}</span>
              )}
              {data.name_ar ? (
                <span dir="rtl" lang="ar">
                  {data.name_ar}
                </span>
              ) : null}
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("revenueEgp")} value={formatAmount(data.revenue)} caption={t("fyToDate", { year: data.year })} />
              <KpiCard layout="bar" accent="teal" label={t("expenseEgp")} value={formatAmount(data.expense)} caption={t("fyToDate", { year: data.year })} />
              <KpiCard
                layout="bar"
                accent={data.contribution < 0 ? "danger" : "amber"}
                label={t("margin")}
                value={data.margin === null ? "—" : `${data.margin}%`}
                caption={data.margin === null ? t("noRevenueHere") : undefined}
              />
            </div>

            {data.children.length ? (
              <FinanceSection title={t("subCenters")} description={t("subCentersDescription")}>
                <FinanceTable
                  caption={t("subCentersOf", { code: data.code })}
                  columns={childColumns}
                  rows={data.children}
                  getRowId={(row) => row.id}
                  onRowClick={(row) => router.push(`/finance/cost-centers/${row.id}`)}
                />
              </FinanceSection>
            ) : null}

            <FinanceSection title={t("byAccount")} description={t("byAccountDescription")}>
              <FinanceTable
                caption={t("accountsPostedTo", { code: data.code })}
                columns={accountColumns}
                rows={data.accounts}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("nothingPostedYet")}</p>}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CostCenterDetailPage }
