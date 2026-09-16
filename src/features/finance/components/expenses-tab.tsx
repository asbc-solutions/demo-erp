"use client"

import * as React from "react"
import {
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  useFinanceExpenseBreakdown,
  useFinanceExpenseCategories,
  useFinanceExpenseSummary,
  useFinanceExpenses,
} from "../lib/queries/expenses"
import { formatCurrency } from "../lib/utils/currency"
import { AddExpenseDialog } from "./add-expense-dialog"
import { FinanceErrorState } from "./shared/finance-error-state"
import { FinancePageSpinner } from "./shared/finance-loading"

function expenseSummaryIcon(kind: "spent" | "wallet" | "average" | "category" | "recurring") {
  const c = "size-3.5"
  switch (kind) {
    case "wallet":
      return <Wallet className={c} />
    case "average":
      return <BarChart3 className={c} />
    case "category":
      return <PieChartIcon className={c} />
    case "recurring":
      return <Repeat className={c} />
    default:
      return <Receipt className={c} />
  }
}

const SUMMARY_ACCENT_BORDER = {
  spent: "border-l-brand-danger",
  wallet: "border-l-brand-warning",
  average: "border-l-brand-primary",
  category: "border-l-violet-500",
  recurring: "border-l-[#14b8a6]",
} as const

const SUMMARY_ACCENT_TINT = {
  spent: "from-brand-danger/[0.05] to-brand-danger/[0.02]",
  wallet: "from-[rgba(245,158,11,0.06)] to-[rgba(245,158,11,0.02)]",
  average: "from-brand-primary/[0.05] to-brand-primary/[0.02]",
  category: "from-violet-500/[0.05] to-violet-500/[0.02]",
  recurring: "from-[rgba(20,184,166,0.05)] to-[rgba(20,184,166,0.02)]",
} as const

const SUMMARY_ACCENT_ICON_BG = {
  spent: "from-brand-danger/20 to-brand-danger/5 text-brand-danger",
  wallet: "from-brand-warning/20 to-brand-warning/5 text-brand-warning",
  average: "from-brand-primary/20 to-brand-primary/5 text-brand-primary",
  category: "from-violet-500/20 to-violet-500/5 text-violet-500",
  recurring: "from-teal-500/20 to-teal-500/5 text-teal-600 dark:text-teal-400",
} as const

type SummaryAccent = keyof typeof SUMMARY_ACCENT_BORDER

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent: SummaryAccent
}) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-stroke-default border-l-[2.4px] py-6",
        SUMMARY_ACCENT_BORDER[accent],
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          SUMMARY_ACCENT_TINT[accent],
        )}
      />
      <div className="relative flex flex-col gap-2 px-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex rounded-lg bg-gradient-to-br p-1.5",
              SUMMARY_ACCENT_ICON_BG[accent],
            )}
          >
            {expenseSummaryIcon(accent)}
          </span>
          <span className="text-[11px] leading-[15.4px] text-content-quaternary">
            {label}
          </span>
        </div>
        <p className="text-[25px] leading-[32.5px] font-semibold text-content-primary">
          {value}
        </p>
      </div>
    </Card>
  )
}

export function ExpensesTab() {
  const [addExpenseOpen, setAddExpenseOpen] = React.useState(false)
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null)

  const summaryQuery = useFinanceExpenseSummary()
  const categoriesQuery = useFinanceExpenseCategories()
  const breakdownQuery = useFinanceExpenseBreakdown()
  const listQuery = useFinanceExpenses({
    category_id: activeCategoryId ?? undefined,
    per_page: 50,
  })

  const isLoading =
    summaryQuery.isLoading ||
    categoriesQuery.isLoading ||
    breakdownQuery.isLoading ||
    listQuery.isLoading
  const isError =
    summaryQuery.isError || categoriesQuery.isError || breakdownQuery.isError || listQuery.isError

  if (isLoading) return <FinancePageSpinner />
  if (
    isError ||
    !summaryQuery.data ||
    !categoriesQuery.data ||
    !breakdownQuery.data ||
    !listQuery.data
  ) {
    return (
      <FinanceErrorState
        message="Failed to load expenses."
        onRetry={() => {
          void summaryQuery.refetch()
          void categoriesQuery.refetch()
          void breakdownQuery.refetch()
          void listQuery.refetch()
        }}
      />
    )
  }

  const summary = summaryQuery.data
  const categories = categoriesQuery.data
  const breakdown = breakdownQuery.data
  const rows = listQuery.data.data
  const currencyCode = rows[0]?.currency_code ?? "USD"

  const breakdownTotal = breakdown.reduce((sum, entry) => sum + entry.amount, 0)
  const breakdownChartConfig = breakdown.reduce<ChartConfig>((acc, entry) => {
    acc[entry.label] = { label: entry.label, color: entry.color }
    return acc
  }, {})
  const rowsTotal = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryTile
          label="Total Expenses"
          value={formatCurrency(summary.total_spent, currencyCode)}
          accent="spent"
        />
        <SummaryTile
          label="Spent This Month"
          value={formatCurrency(summary.spent_this_month, currencyCode)}
          accent="wallet"
        />
        <SummaryTile
          label="Monthly Average"
          value={formatCurrency(summary.monthly_average, currencyCode)}
          accent="average"
        />
        <SummaryTile
          label="Largest Category"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{summary.largest_category}</span>
              <span className="text-[13px] font-normal text-content-tertiary">
                {formatCurrency(summary.largest_category_amount, currencyCode)}
              </span>
            </span>
          }
          accent="category"
        />
        <SummaryTile
          label="Recurring"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{summary.recurring_count}</span>
              <span className="text-[13px] font-normal text-content-tertiary">
                {formatCurrency(summary.recurring_amount, currencyCode)}/mo
              </span>
            </span>
          }
          accent="recurring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="h-9 rounded-lg px-3 text-[12px]"
          onClick={() => setAddExpenseOpen(true)}
        >
          <Plus className="size-4" />
          New Expense
        </Button>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            className={cn(
              "h-8 rounded-lg px-3 text-[11px] font-medium transition-colors",
              activeCategoryId === null
                ? "bg-brand-primary text-white"
                : "bg-[#f0f0f5] text-content-tertiary hover:bg-surface-hover",
            )}
          >
            All
          </button>
          {categories.map((category) => {
            const isActive = activeCategoryId === category.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "bg-[#f0f0f5] text-content-tertiary hover:bg-surface-hover",
                )}
              >
                {category.label}
                <span className={cn("text-[10px] opacity-60", isActive && "text-white opacity-80")}>
                  ({category.expense_count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card
          variant="elevated"
          className="overflow-hidden rounded-2xl border-stroke-default p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-stroke-default hover:bg-transparent">
                  <TableHead className="px-2">Date</TableHead>
                  <TableHead className="px-2">Description</TableHead>
                  <TableHead className="px-2">Category</TableHead>
                  <TableHead className="px-2 text-right">Amount</TableHead>
                  <TableHead className="px-2">Recurring</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={cn("border-stroke-default", index % 2 === 1 && "bg-[#f4f4f5]/30")}
                  >
                    <TableCell className="px-2 py-3 text-xs text-content-tertiary">
                      {row.date}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs font-medium text-content-primary">
                      {row.description}
                    </TableCell>
                    <TableCell className="px-2 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: row.category_color,
                          background: `linear-gradient(135deg, ${row.category_color}1F 0%, ${row.category_color}00 100%)`,
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: row.category_color }}
                        />
                        {row.category_label}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-right font-mono text-xs text-content-primary">
                      {formatCurrency(row.amount, row.currency_code)}
                    </TableCell>
                    <TableCell className="px-2 py-3">
                      {row.recurring ? (
                        <Badge
                          variant="neutral"
                          className="rounded-lg border border-stroke-default bg-transparent px-2 py-0 text-[10px]"
                          aria-label="Recurring"
                        >
                          <span role="img" aria-hidden>
                            🔁
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-content-quaternary">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-content-tertiary py-10 text-center text-xs"
                    >
                      No expenses match the current filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-stroke-default px-6 py-3 text-[11px] leading-[15.4px] text-content-quaternary">
            Showing {rows.length} expenses · Total: {formatCurrency(rowsTotal, currencyCode)}
          </div>
        </Card>

        <Card
          variant="elevated"
          className="flex flex-col gap-4 rounded-2xl border-stroke-default p-4"
        >
          <span className="text-[11px] leading-[15.4px] font-medium tracking-[0.55px] text-content-quaternary uppercase">
            Breakdown
          </span>
          {breakdown.length === 0 ? (
            <p className="py-8 text-center text-[11px] text-content-quaternary">
              No expenses yet.
            </p>
          ) : (
            <>
              <ChartContainer
                config={breakdownChartConfig}
                className="aspect-auto h-[200px] w-full"
              >
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={42}
                    outerRadius={70}
                    strokeWidth={2}
                    stroke="white"
                  >
                    {breakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-1.5 pt-2">
                {breakdown.map((entry) => (
                  <div key={entry.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[11px] leading-[15.4px] text-content-tertiary">
                        {entry.label}
                      </span>
                    </div>
                    <span className="text-[11px] leading-[15.4px] tabular-nums text-content-quaternary">
                      {formatCurrency(entry.amount, currencyCode)}
                    </span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-stroke-default pt-2">
                  <span className="text-[11px] font-medium text-content-tertiary">Total</span>
                  <span className="text-[11px] font-semibold tabular-nums text-content-primary">
                    {formatCurrency(breakdownTotal, currencyCode)}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
    </div>
  )
}
