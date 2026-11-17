"use client"

import { CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useApproveExpense } from "../../lib/mutations/payables"
import type { Expense } from "../../lib/types/payables"

function ExpenseRow({ expense }: { expense: Expense }) {
  const t = useTranslations("FinanceMoneyOut")
  const { formatDate } = useFinanceDateFormat()
  const approve = useApproveExpense()
  return (
    <article
      aria-label={`${expense.number}, ${expense.merchant}`}
      className="border-stroke-default bg-surface-white flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border px-4 py-3.5 shadow-xs"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="text-content-primary text-[13px] leading-5 font-medium">
            {expense.merchant} · {expense.account_name}
          </span>
          <Amount value={expense.amount} currency={expense.currency} className="text-sm leading-5" />
        </div>
        <p className="text-content-secondary text-xs leading-4">
          {expense.description} · {formatDate(expense.date)} · {expense.treasury_name}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <DocNumber>{expense.number}</DocNumber>
          <span className="text-content-tertiary text-xs leading-4">
            {t("expenseEgp")} <span className="text-content-primary tabular-nums">{formatAmount(expense.net)}</span>
          </span>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        disabled={approve.isPending}
        onClick={() =>
          approve.mutate(expense.id, {
            onSuccess: () =>
              toast.success(
                t("expensePosted", {
                  number: expense.number,
                  treasury: expense.treasury_name,
                  amount: formatAmount(expense.amount),
                }),
              ),
            onError: (error) =>
              toast.error(errorMessage(error, t("expensePostFailed", { number: expense.number }))),
          })
        }
      >
        {t("approveAndPost")}
      </Button>
    </article>
  )
}

/** 03.06 · Expenses · Awaiting approval — approving posts the entry and takes the cash. */
function AwaitingTab({ items }: { items: Expense[] }) {
  const t = useTranslations("FinanceMoneyOut")
  const waiting = items.filter((item) => item.status === "awaiting_approval")
  if (waiting.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={<CircleCheck />}
        title={t("awaitingEmptyTitle")}
        description={t("awaitingEmptyDescription")}
      />
    )
  }
  return (
    <div className="flex max-w-4xl flex-col gap-3">
      {waiting.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} />
      ))}
    </div>
  )
}

export { AwaitingTab }
