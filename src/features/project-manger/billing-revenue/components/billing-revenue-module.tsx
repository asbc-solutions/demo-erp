"use client"

import { useMemo } from "react"
import {
  CheckCircle2,
  Diamond,
  Flag,
  Receipt,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { ProjectScopedView } from "../../components/project-scoped-view"
import { PortfolioBillingView } from "./portfolio-billing-view"
import {
  buildBillingStats,
  billingMilestoneMapper,
  type BillingStat,
} from "../../lib/mappers/billing-mapper"
import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import {
  useBillingMilestones,
  useBillingPlan,
  useRevenueSummary,
} from "../../lib/queries/billing"

type BillingStatId = "contract" | "recognized" | "invoiced" | "gap"

const STAT_ICON: Record<BillingStat["icon"], LucideIcon> = {
  check: CheckCircle2,
  receipt: Receipt,
  flag: Flag,
  dso: Diamond,
}

const STAT_ACCENT: Record<
  BillingStat["accent"],
  { border: string; tile: string }
> = {
  indigo: {
    border: "border-s-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-s-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-s-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-s-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

function BillingRevenueContent({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsBillingRevenue")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const revenue = useRevenueSummary(projectId)
  const plan = useBillingPlan(projectId)
  const milestonesQuery = useBillingMilestones(projectId)

  const stats = useMemo(
    () => buildBillingStats(revenue.data),
    [revenue.data],
  )
  const milestones = useMemo(
    () => (milestonesQuery.data ?? []).map(billingMilestoneMapper(locale)),
    [milestonesQuery.data, locale],
  )

  const contractValue = revenue.data?.contract_value ?? 0
  const invoiced = revenue.data?.total_invoiced ?? 0
  const open = contractValue - invoiced

  const statCaption = (id: BillingStatId, fallback: string): string => {
    const summary = revenue.data
    if (!summary) return id === "invoiced" ? t("statCaption.invoiced") : ""
    switch (id) {
      case "contract":
        return t("statCaption.contract", {
          pct: Math.round(summary.percent_complete),
        })
      case "recognized":
        return t("statCaption.recognized", {
          amount: formatMoney(summary.deferred_revenue),
        })
      case "invoiced":
        return t("statCaption.invoiced")
      default:
        return fallback
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* contract banner */}
      <Card className="border-brand-primary/15 bg-brand-primary/5 flex-row flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/10 text-brand-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Receipt className="size-[18px]" aria-hidden />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-content-primary text-sm font-semibold">
              {t("billingMethod", { method: plan.data?.method_label ?? "—" })}
            </span>
            <span className="text-content-tertiary text-xs">
              {t("contractSummary", {
                contract: formatMoney(contractValue),
                count: milestones.length,
                invoiced: formatMoney(invoiced),
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              {t("invoiced")}
            </span>
            <span className="text-brand-success text-lg font-bold">
              {formatMoney(invoiced)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              {t("open")}
            </span>
            <span className="text-brand-warning text-lg font-bold">
              {formatMoney(open)}
            </span>
          </div>
        </div>
      </Card>

      {/* stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICON[stat.icon]
          const accent = STAT_ACCENT[stat.accent]
          const statId = stat.id as BillingStatId
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-s-4 p-4",
                accent.border,
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  accent.tile,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                  {t(`statLabel.${statId}`)}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {revenue.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {statCaption(statId, stat.caption)}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      {/* milestone billing plan */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            {t("milestonePlan")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("colCode")}</TableHead>
              <TableHead>{t("colMilestone")}</TableHead>
              <TableHead>{t("colDueDate")}</TableHead>
              <TableHead>{tCommon("amount")}</TableHead>
              <TableHead>{t("colPctOfTotal")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestonesQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("milestonesLoading")}
                </TableCell>
              </TableRow>
            ) : milestonesQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("milestonesLoadError")}
                </TableCell>
              </TableRow>
            ) : milestones.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("milestonesEmptyProject")}
                </TableCell>
              </TableRow>
            ) : (
              milestones.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-content-tertiary font-mono text-[12px]">
                    {m.code}
                  </TableCell>
                  <TableCell className="text-content-primary text-[13px] font-medium">
                    {m.name}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {m.due}
                  </TableCell>
                  <TableCell className="text-content-primary text-[13px] font-semibold tabular-nums">
                    {m.amount}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px] tabular-nums">
                    {m.pctOfTotal}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={m.statusLabel} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export function BillingRevenueModule() {
  const t = useTranslations("ProjectsBillingRevenue")
  return (
    <ProjectScopedView
      title={t("title")}
      subtitle={t("subtitle")}
      renderAll={() => <PortfolioBillingView />}
    >
      {(projectId) => <BillingRevenueContent projectId={projectId} />}
    </ProjectScopedView>
  )
}
