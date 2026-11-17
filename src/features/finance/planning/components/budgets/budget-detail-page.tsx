"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useIntlLocale } from "@/src/i18n/intl-locale"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useApproveBudget, useLockBudget, useSaveBudgetLines } from "../../lib/mutations/planning"
import { useBudget } from "../../lib/queries/planning"
import type { Budget, BudgetLine } from "../../lib/types/planning"

const shortMonth = (index: number, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(Date.UTC(2026, index, 1))

function UsedBar({ used }: { used: number | null }) {
  const t = useTranslations("FinancePlanning")
  if (used === null) return <span className="text-content-tertiary">—</span>
  return (
    <span className="flex items-center justify-end gap-2">
      <Progress value={Math.min(used, 100)} size="sm" color={used > 100 ? "red" : "indigo"} className="w-24" aria-label={t("budgetUsed", { used })} />
      <span className="text-content-secondary w-10 text-end text-xs tabular-nums">{used}%</span>
    </span>
  )
}

/** Annual figures per cost center, editable while the budget is a draft. */
function DraftLines({ budget }: { budget: Budget }) {
  const t = useTranslations("FinancePlanning")
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
      header: t("costCenter"),
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber>{row.cost_center_id}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
      footer: t("total"),
    },
    {
      id: "annual",
      header: t("annualBudgetEgp"),
      align: "end",
      width: "w-56",
      cell: (row) => (
        <Input
          aria-label={t("annualBudgetFor", { name: row.name })}
          inputMode="decimal"
          className="ms-auto h-8 w-44 text-end tabular-nums"
          value={values[row.cost_center_id] ?? ""}
          aria-invalid={!(Number(values[row.cost_center_id]) >= 0) || values[row.cost_center_id]?.trim() === ""}
          onChange={(event) => setValues((current) => ({ ...current, [row.cost_center_id]: event.target.value }))}
        />
      ),
      footer: <Amount value={total} emphasis="strong" />,
    },
    { id: "actual", header: t("actualToDateEgp"), align: "end", cell: (row) => <Amount value={row.actual} /> },
  ]

  return (
    <>
      <FinanceTable caption={t("budgetByCostCenter", { name: budget.name })} columns={columns} rows={budget.lines} getRowId={(row) => row.id} />
      <div className="flex justify-end gap-2">
        <Button
          variant="primary"
          disabled={!dirty || invalid || save.isPending}
          onClick={() =>
            save.mutate(
              { id: budget.id, lines: budget.lines.map((line) => ({ cost_center_id: line.cost_center_id, annual: Number(values[line.cost_center_id]) })) },
              {
                onSuccess: (saved) => toast.success(t("toastBudgetSaved", { code: saved.code, amount: formatAmount(saved.total) })),
                onError: (error) => toast.error(errorMessage(error, t("errorSaveBudget"))),
              },
            )
          }
        >
          {t("saveChanges")}
        </Button>
      </div>
    </>
  )
}

/** 09.02 · Budget vs actual — year-to-date budget against posted expense, by top-level cost center. */
function BudgetDetailPage({ budgetId }: { budgetId: string }) {
  const t = useTranslations("FinancePlanning")
  const { formatDate } = useFinanceDateFormat()
  const locale = useIntlLocale()
  const { data, isError, isPending, refetch } = useBudget(budgetId)
  const approve = useApproveBudget()
  const lock = useLockBudget()
  const [confirmLock, setConfirmLock] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("budgetVsActual")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title={t("budgetNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("budgetNotFoundTitle")}
            description={t("budgetNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/budgets">{t("allBudgets")}</Link>
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
      header: t("costCenter"),
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <DocNumber href={`/finance/cost-centers/${row.cost_center_id}`}>{row.cost_center_id}</DocNumber>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
      footer: t("total"),
    },
    { id: "budgeted", header: t("budgetedEgp"), align: "end", cell: (row) => <Amount value={row.budgeted} />, footer: data ? <Amount value={data.budgeted} emphasis="strong" /> : null },
    { id: "actual", header: t("actualEgp"), align: "end", cell: (row) => <Amount value={row.actual} />, footer: data ? <Amount value={data.actual} emphasis="strong" /> : null },
    { id: "variance", header: t("varianceEgp"), align: "end", cell: (row) => <Amount value={row.variance} signed />, footer: data ? <Amount value={data.variance} emphasis="strong" signed /> : null },
    { id: "used", header: t("used"), align: "end", width: "w-40", cell: (row) => <UsedBar used={row.used} /> },
  ]

  const toDate =
    data && data.months_elapsed > 0
      ? t("monthRange", { from: shortMonth(0, locale), to: shortMonth(data.months_elapsed - 1, locale), year: data.year })
      : null

  return (
    <>
      <FinancePageHeader
        title={t("budgetVsActual")}
        figure={data ? <HeaderFigure label={t("budgetVarianceLabel", { name: data.name })}>{formatAmount(data.variance)}</HeaderFigure> : null}
        actions={
          <>
            {data?.status === "approved" ? (
              <Button variant="secondary" onClick={() => setConfirmLock(true)}>
                {t("lockBudget")}
              </Button>
            ) : null}
            {data?.status === "draft" ? (
              <Button
                variant="primary"
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate(data.id, {
                    onSuccess: (budget) => toast.success(t("toastBudgetApproved", { code: budget.code })),
                    onError: (error) => toast.error(errorMessage(error, t("errorApproveBudget"))),
                  })
                }
              >
                {t("approveBudget")}
              </Button>
            ) : null}
            <Button variant="secondary" asChild>
              <Link href="/finance/budgets">{t("allBudgets")}</Link>
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
              <span>{t("annualAmount", { amount: formatAmount(data.total) })}</span>
              {data.locked_on ? (
                <span>{t("lockedByOn", { name: data.locked_by ?? "", date: formatDate(data.locked_on) })}</span>
              ) : data.approved_on ? (
                <span>{t("approvedByOn", { name: data.approved_by ?? "", date: formatDate(data.approved_on) })}</span>
              ) : null}
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("budgetedEgp")} value={formatAmount(data.budgeted)} caption={toDate ? t("phasedEvenly", { range: toDate }) : t("yearNotStarted")} />
              <KpiCard layout="bar" accent="teal" label={t("actualEgp")} value={formatAmount(data.actual)} caption={t("postedExpenseRolledUp")} />
              <KpiCard
                layout="bar"
                accent={data.variance < 0 ? "danger" : "amber"}
                label={t("varianceEgp")}
                value={formatAmount(data.variance)}
                caption={data.variance < 0 ? t("overBudget") : t("underBudget")}
              />
            </div>

            {data.status === "draft" ? (
              <>
                <FinanceAlert tone="info">
                  {t("draftBudgetInfo")}
                </FinanceAlert>
                <DraftLines key={`${data.id}-${data.total}`} budget={data} />
              </>
            ) : (
              <FinanceTable caption={t("budgetAgainstActuals", { name: data.name })} columns={columns} rows={data.lines} getRowId={(row) => row.id} />
            )}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lockBudgetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("lockBudgetDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                data &&
                lock.mutate(data.id, {
                  onSuccess: (budget) => toast.success(t("toastBudgetLocked", { code: budget.code })),
                  onError: (error) => toast.error(errorMessage(error, t("errorLockBudget"))),
                })
              }
            >
              {t("lockBudget")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { BudgetDetailPage }
