"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { ChartContainer } from "@/src/shared/components/ui/chart"
import { Progress } from "@/src/shared/components/ui/progress"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  buildCostMix,
  evmMetricCards,
  formatMoney,
} from "../../../lib/mappers/cost-budget-mapper"
import { useReleaseBudget } from "../../../lib/mutations/cost-budget"
import {
  useBudgets,
  useCostPlans,
  useEvm,
  useNodeCost,
} from "../../../lib/queries/cost-budget"

const VALUE_TONE = {
  default: "text-content-primary",
  warning: "text-brand-warning",
  danger: "text-brand-danger",
}

export function BudgetTab({ projectId }: { projectId: string }) {
  // The project's root node id is the project id for node-scoped endpoints.
  const nodeId = projectId

  const evmQ = useEvm(projectId)
  const budgetsQ = useBudgets(projectId)
  const nodeCostQ = useNodeCost(nodeId)
  const costPlansQ = useCostPlans(nodeId)
  const releaseBudget = useReleaseBudget(projectId)

  const evm = evmQ.data
  const metrics = evm ? evmMetricCards(evm) : []
  const nodeCost = nodeCostQ.data
  const { slices, total } = buildCostMix(costPlansQ.data ?? [])
  const budgets = budgetsQ.data ?? []

  const consumed =
    nodeCost && nodeCost.planned > 0
      ? ((nodeCost.committed + nodeCost.actual) / nodeCost.planned) * 100
      : 0

  const handleRelease = (budgetId: string) =>
    releaseBudget.mutate(budgetId, {
      onSuccess: () => toast.success("Budget released"),
      onError: (err) =>
        toast.error("Couldn't release budget", {
          description: (err as unknown as ApiError).message,
        }),
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
            Budget &amp; Costs
          </h2>
          <p className="text-content-tertiary text-sm">
            Earned-value, cost variance, and forecast at completion
          </p>
        </div>
      </div>

      {/* EVM metrics */}
      {evmQ.isLoading ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-24 animate-pulse rounded-[14px]"
            />
          ))}
        </section>
      ) : evmQ.isError || !evm ? (
        <Card className="flex h-24 items-center justify-center p-4">
          <p className="text-content-tertiary text-sm">
            Earned-value metrics are not available yet.
          </p>
        </Card>
      ) : (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {metrics.map((metric) => (
            <Card key={metric.id} className="gap-1 p-4">
              <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                {metric.label}
              </span>
              <span
                className={cn(
                  "text-2xl leading-7 font-bold",
                  VALUE_TONE[metric.tone],
                )}
              >
                {metric.value}
              </span>
              <span className="text-content-tertiary text-[11px]">
                {metric.sub}
              </span>
            </Card>
          ))}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cost summary (node cost roll-up) */}
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Cost Summary
            </h3>
            <p className="text-content-tertiary text-xs">
              Planned vs. committed and actual for this project
            </p>
          </div>
          {nodeCostQ.isLoading ? (
            <div className="bg-surface-muted h-32 animate-pulse rounded-lg" />
          ) : !nodeCost ? (
            <p className="text-content-tertiary text-sm">No cost data yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Planned", value: nodeCost.planned },
                  { label: "Committed", value: nodeCost.committed },
                  { label: "Actual", value: nodeCost.actual },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                      {item.label}
                    </span>
                    <span className="text-content-primary text-lg font-bold">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-secondary font-medium">
                    Consumed
                  </span>
                  <span className="text-content-tertiary">
                    {Math.round(consumed)}%
                  </span>
                </div>
                <Progress
                  value={consumed}
                  color={consumed > 100 ? "red" : "indigo"}
                  className="bg-surface-muted h-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-tertiary text-xs">Variance</span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    nodeCost.variance_label === "over_budget"
                      ? "text-brand-danger"
                      : "text-brand-success",
                  )}
                >
                  {nodeCost.variance_label === "over_budget" ? (
                    <TrendingDown className="size-3.5" aria-hidden />
                  ) : (
                    <TrendingUp className="size-3.5" aria-hidden />
                  )}
                  {formatMoney(nodeCost.variance)}
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Cost type mix (cost plans grouped) */}
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Cost Type Mix
            </h3>
            <p className="text-content-tertiary text-xs">Planned by cost type</p>
          </div>
          {costPlansQ.isLoading ? (
            <div className="bg-surface-muted h-32 animate-pulse rounded-lg" />
          ) : slices.length === 0 ? (
            <p className="text-content-tertiary text-sm">
              No cost plan lines yet.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative size-32 shrink-0">
                <ChartContainer
                  config={{}}
                  className="aspect-square size-32"
                  initialDimension={{ width: 128, height: 128 }}
                >
                  <PieChart>
                    <Pie
                      data={slices}
                      dataKey="raw"
                      nameKey="label"
                      innerRadius={42}
                      outerRadius={62}
                      strokeWidth={2}
                      stroke="var(--surface-white)"
                    >
                      {slices.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-content-primary text-base font-bold">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {slices.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-content-secondary flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="text-content-primary font-semibold">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Forecast (EVM) */}
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Forecast
            </h3>
            <p className="text-content-tertiary text-xs">Estimate at Completion</p>
          </div>
          {!evm ? (
            <p className="text-content-tertiary text-sm">Not available yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                  Budget at Completion
                </span>
                <span className="text-content-primary text-xl font-bold">
                  {formatMoney(evm.bac)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                  Forecast EAC
                </span>
                <span
                  className={cn(
                    "flex items-center gap-2 text-xl font-bold",
                    evm.eac != null && evm.bac != null && evm.eac > evm.bac
                      ? "text-brand-danger"
                      : "text-brand-success",
                  )}
                >
                  {formatMoney(evm.eac)}
                  <span className="flex items-center gap-0.5 text-[11px] font-medium">
                    {(evm.vac ?? 0) < 0 ? (
                      <TrendingDown className="size-3" aria-hidden />
                    ) : (
                      <TrendingUp className="size-3" aria-hidden />
                    )}
                    VAC {formatMoney(evm.vac)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Budgets */}
        <Card className="gap-4 p-5">
          <h3 className="text-content-primary text-sm font-semibold">Budgets</h3>
          {budgetsQ.isLoading ? (
            <div className="bg-surface-muted h-24 animate-pulse rounded-lg" />
          ) : budgets.length === 0 ? (
            <p className="text-content-tertiary text-sm">
              No budgets created yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {budgets.map((budget) => (
                <div
                  key={budget.budget_id}
                  className="border-stroke-light flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-content-primary text-sm font-semibold">
                      {formatMoney(budget.budget_amount)}
                      <span className="text-content-tertiary ms-2 text-[11px] font-normal">
                        FY {budget.fiscal_year}
                      </span>
                    </span>
                    <span className="text-content-tertiary text-[11px]">
                      Released {formatMoney(budget.released_amount)} ·{" "}
                      {budget.status_label}
                    </span>
                  </div>
                  {budget.status === "draft" && (
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-[12px]"
                      onClick={() => handleRelease(budget.budget_id)}
                      disabled={releaseBudget.isPending}
                    >
                      {releaseBudget.isPending ? "Releasing…" : "Release"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
