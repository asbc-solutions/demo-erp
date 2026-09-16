"use client"

import { useMemo } from "react"
import {
  CheckCircle2,
  Diamond,
  Flag,
  Receipt,
  type LucideIcon,
} from "lucide-react"

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
  mapBillingMilestone,
  type BillingStat,
} from "../../lib/mappers/billing-mapper"
import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import {
  useBillingMilestones,
  useBillingPlan,
  useRevenueSummary,
} from "../../lib/queries/billing"

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
    border: "border-l-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-l-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-l-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-l-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

function BillingRevenueContent({ projectId }: { projectId: string }) {
  const revenue = useRevenueSummary(projectId)
  const plan = useBillingPlan(projectId)
  const milestonesQuery = useBillingMilestones(projectId)

  const stats = useMemo(
    () => buildBillingStats(revenue.data),
    [revenue.data],
  )
  const milestones = useMemo(
    () => (milestonesQuery.data ?? []).map(mapBillingMilestone),
    [milestonesQuery.data],
  )

  const contractValue = revenue.data?.contract_value ?? 0
  const invoiced = revenue.data?.total_invoiced ?? 0
  const open = contractValue - invoiced

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
              Billing Method: {plan.data?.method_label ?? "—"}
            </span>
            <span className="text-content-tertiary text-xs">
              Contract {formatMoney(contractValue)} · {milestones.length}{" "}
              milestones · {formatMoney(invoiced)} invoiced
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              Invoiced
            </span>
            <span className="text-brand-success text-lg font-bold">
              {formatMoney(invoiced)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              Open
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
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-l-4 p-4",
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
                  {stat.label}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {revenue.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {stat.caption}
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
            Milestone Billing Plan
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>% of Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestonesQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Loading billing milestones…
                </TableCell>
              </TableRow>
            ) : milestonesQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Couldn&apos;t load billing milestones.
                </TableCell>
              </TableRow>
            ) : milestones.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No billing milestones for this project.
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
  return (
    <ProjectScopedView
      title="Billing & Revenue"
      subtitle="Milestone invoicing and revenue recognition"
      renderAll={() => <PortfolioBillingView />}
    >
      {(projectId) => <BillingRevenueContent projectId={projectId} />}
    </ProjectScopedView>
  )
}
