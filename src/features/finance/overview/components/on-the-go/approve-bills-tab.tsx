"use client"

import * as React from "react"
import { CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { useApproveBill, useSendBackBill } from "../../../money-out/lib/mutations/payables"
import { useBillApprovals } from "../../../money-out/lib/queries/payables"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"

function BillCard({ bill }: { bill: SubledgerDocument }) {
  const t = useTranslations("FinanceOverview")
  const { formatDate } = useFinanceDateFormat()
  const approve = useApproveBill()
  const sendBack = useSendBackBill()
  const busy = approve.isPending || sendBack.isPending

  return (
    <article
      aria-label={`${bill.contact_name}, ${bill.number}`}
      className="border-stroke-default bg-surface-white flex flex-col gap-2 rounded-xl border px-5 py-4 shadow-xs"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-content-primary text-sm leading-5 font-medium">{bill.contact_name}</span>
        <Amount value={bill.outstanding} className="text-sm leading-5" />
      </div>
      <p className="text-content-secondary text-[13px] leading-5">
        {t("billDue", { number: bill.number, date: bill.due_date ? formatDate(bill.due_date) : "—" })}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={() =>
            approve.mutate(bill.id, {
              onSuccess: () => toast.success(t("billApproved", { number: bill.number })),
              onError: () => toast.error(t("billApproveFailed", { number: bill.number })),
            })
          }
        >
          {t("approveForPayment")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() =>
            sendBack.mutate(
              { id: bill.id, reason: "Sent back from On the go." },
              {
                onSuccess: () => toast.success(t("billSentBack", { number: bill.number })),
                onError: () => toast.error(t("billSendBackFailed", { number: bill.number })),
              },
            )
          }
        >
          {t("sendBack")}
        </Button>
      </div>
    </article>
  )
}

/** Approve a bill — the queue a manager can clear from a phone. */
function ApproveBillsTab() {
  const t = useTranslations("FinanceOverview")
  const { data, isError, refetch } = useBillApprovals()
  const bills = data?.items

  return (
    <div className="flex flex-col gap-4">
      <p className="text-content-tertiary text-[13px] leading-5">{t("approveBillsIntro")}</p>
      {isError ? (
        <FinanceErrorState onRetry={() => refetch()} />
      ) : !bills ? (
        <div aria-busy aria-label={t("loadingBills")} className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<CircleCheck />}
          title={t("approvalsEmptyTitle")}
          description={t("approvalsEmptyDescription")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}

export { ApproveBillsTab }
