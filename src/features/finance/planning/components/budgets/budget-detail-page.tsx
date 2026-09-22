"use client"

import * as React from "react"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Progress } from "@/src/shared/components/ui/progress"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure, MetaChips } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useApproveBudget, useLockBudget, useSaveBudgetLines } from "../../lib/mutations/planning"
import { useBudget } from "../../lib/queries/planning"
import type { Budget, BudgetLine } from "../../lib/types/planning"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function UsedBar({ used }: { used: number | null }) {
  if (used === null) return <span className="text-content-tertiary">—</span>
  return (
    <span className="flex items-center justify-end gap-2">
      <Progress value={Math.min(used, 100)} size="sm" color={used > 100 ? "red" : "indigo"} className="w-24" aria-label={`${used}% of budget used`} />
      <span className="text-content-secondary w-10 text-right text-xs tabular-nums">{used}%</span>
    </span>
  )
}

/** Annual figures per cost center, editable while the budget is a draft. */
function DraftLines({ budget }: { budget: Budget }) {
  const save = useSaveBudgetLines()
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(budget.lines.map((line) => [line.cost_center_id, String(line.annual)])),
  )
  const invalid = Object.values(values).some((value) => value.trim() === "" || !(Number(value) >= 0))
  const dirty = budget.lines.some((line) => Number(values[line.cost_center_id]) !== line.annual)
  const total = Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0)

  const columns: FinanceColumn<BudgetLine>[] = [
    {
      id: "center",
      header: "Cost center",
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber>{row.cost_center_id}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
      footer: "Total",
    },
    {
      id: "annual",
      header: "Annual budget (EGP)",
      align: "end",
      width: "w-56",
      cell: (row) => (
        <Input
          aria-label={`Annual budget for ${row.name}`}
          inputMode="decimal"
          className="ml-auto h-8 w-44 text-right tabular-nums"
          value={values[row.cost_center_id] ?? ""}
          aria-invalid={!(Number(values[row.cost_center_id]) >= 0) || values[row.cost_center_id]?.trim() === ""}
          onChange={(event) => setValues((current) => ({ ...current, [row.cost_center_id]: event.target.value }))}
        />
      ),
      footer: <Amount value={total} emphasis="strong" />,
    },
    { id: "actual", header: "Actual to date (EGP)", align: "end", cell: (row) => <Amount value={row.actual} /> },
  ]

  return (
    <>
      <FinanceTable caption={`${budget.name} by cost center`} columns={columns} rows={budget.lines} getRowId={(row) => row.id} />
      <div className="flex justify-end gap-2">
        <Button
          variant="primary"
          disabled={!dirty || invalid || save.isPending}
          onClick={() =>
            save.mutate(
              { id: budget.id, lines: budget.lines.map((line) => ({ cost_center_id: line.cost_center_id, annual: Number(values[line.cost_center_id]) })) },
              {
                onSuccess: (saved) => toast.success(`${saved.code} saved. Annual total ${formatAmount(saved.total)} EGP.`),
                onError: (error) => toast.error(errorMessage(error, "The budget could not be saved. Try again.")),
              },
            )
          }
        >
          Save changes
        </Button>
      </div>
    </>
  )
}

/** 09.02 · Budget vs actual — year-to-date budget against posted expense, by top-level cost center. */
function BudgetDetailPage({ budgetId }: { budgetId: string }) {
  const { data, isError, isPending, refetch } = useBudget(budgetId)
  const approve = useApproveBudget()
  const lock = useLockBudget()
  const [confirmLock, setConfirmLock] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Budget vs actual" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title="Budget not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no budget with this code."
            description="It may belong to another session or the link is out of date."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/budgets">All budgets</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const columns: FinanceColumn<BudgetLine>[] = [
    {
      id: "center",
      header: "Cost center",
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber href={`/finance/cost-centers/${row.cost_center_id}`}>{row.cost_center_id}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
      footer: "Total",
    },
    { id: "budgeted", header: "Budgeted (EGP)", align: "end", cell: (row) => <Amount value={row.budgeted} />, footer: data ? <Amount value={data.budgeted} emphasis="strong" /> : null },
    { id: "actual", header: "Actual (EGP)", align: "end", cell: (row) => <Amount value={row.actual} />, footer: data ? <Amount value={data.actual} emphasis="strong" /> : null },
    { id: "variance", header: "Variance (EGP)", align: "end", cell: (row) => <Amount value={row.variance} signed />, footer: data ? <Amount value={data.variance} emphasis="strong" signed /> : null },
    { id: "used", header: "Used", align: "end", width: "w-40", cell: (row) => <UsedBar used={row.used} /> },
  ]

  const toDate = data && data.months_elapsed > 0 ? `${MONTHS[0]}–${MONTHS[data.months_elapsed - 1]} ${data.year}` : null

  return (
    <>
      <FinancePageHeader
        title="Budget vs actual"
        figure={data ? <HeaderFigure label={`${data.name} · variance (EGP)`}>{formatAmount(data.variance)}</HeaderFigure> : null}
        actions={
          <>
            {data?.status === "approved" ? (
              <Button variant="secondary" onClick={() => setConfirmLock(true)}>
                Lock budget
              </Button>
            ) : null}
            {data?.status === "draft" ? (
              <Button
                variant="primary"
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate(data.id, {
                    onSuccess: (budget) => toast.success(`${budget.code} is approved.`),
                    onError: (error) => toast.error(errorMessage(error, "The budget could not be approved. Try again.")),
                  })
                }
              >
                Approve budget
              </Button>
            ) : null}
            <Button variant="secondary" asChild>
              <Link href="/finance/budgets">All budgets</Link>
            </Button>
          </>
        }
      />
      <FinancePageBody>
        {!data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <MetaChips>
              <DocNumber>{data.code}</DocNumber>
              <StatusPill status={data.status} />
              <span>{data.scope_label}</span>
              <span>Annual {formatAmount(data.total)} EGP</span>
              {data.locked_on ? <span>Locked by {data.locked_by} on {formatDate(data.locked_on)}</span> : data.approved_on ? <span>Approved by {data.approved_by} on {formatDate(data.approved_on)}</span> : null}
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Budgeted (EGP)" value={formatAmount(data.budgeted)} caption={toDate ? `${toDate}, phased evenly` : "The year has not started"} />
              <KpiCard layout="bar" accent="teal" label="Actual (EGP)" value={formatAmount(data.actual)} caption="Posted expense, rolled up" />
              <KpiCard
                layout="bar"
                accent={data.variance < 0 ? "danger" : "amber"}
                label="Variance (EGP)"
                value={formatAmount(data.variance)}
                caption={data.variance < 0 ? "Over budget" : "Under budget"}
              />
            </div>

            {data.status === "draft" ? (
              <>
                <FinanceAlert tone="info">
                  This budget is a draft. Adjust the annual figure for each cost center, save, then approve it. Variance is
                  measured once it is approved.
                </FinanceAlert>
                <DraftLines key={`${data.id}-${data.total}`} budget={data} />
              </>
            ) : (
              <FinanceTable caption={`${data.name} against actuals`} columns={columns} rows={data.lines} getRowId={(row) => row.id} />
            )}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Locking freezes every budget line for the year so variance reports stay comparable. Unlocking needs a
              controller. Draft a revision instead if the plan itself has changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                data &&
                lock.mutate(data.id, {
                  onSuccess: (budget) => toast.success(`${budget.code} is locked.`),
                  onError: (error) => toast.error(errorMessage(error, "The budget could not be locked. Try again.")),
                })
              }
            >
              Lock budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { BudgetDetailPage }
