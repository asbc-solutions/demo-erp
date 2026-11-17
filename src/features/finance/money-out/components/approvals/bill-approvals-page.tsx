"use client"

import * as React from "react"
import { CircleCheck } from "lucide-react"
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
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"
import { useApproveBill } from "../../lib/mutations/payables"
import { useBillApprovals } from "../../lib/queries/payables"
import { SendBackDialog } from "./send-back-dialog"

type Outcome = { kind: "approved" | "sent_back"; number: string }

function BillRow({
  bill,
  threshold,
  busy,
  onApprove,
  onSendBack,
}: {
  bill: SubledgerDocument
  threshold: number
  busy: boolean
  onApprove: () => void
  onSendBack: () => void
}) {
  const t = useTranslations("FinanceMoneyOut")
  const { formatDate } = useFinanceDateFormat()
  return (
    <article
      aria-label={`${bill.number}, ${bill.contact_name}`}
      className="border-stroke-default bg-surface-white flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border px-4 py-3.5 shadow-xs"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <DocNumber>{bill.number}</DocNumber>
          <span className="text-content-primary text-[13px] leading-5">{bill.contact_name}</span>
          {bill.days_late > 0 && bill.due_date ? (
            <StatusPill
              status="overdue"
              label={t("dueOn", { date: formatDate(bill.due_date) })}
              family="internal"
              tone="warning"
            />
          ) : null}
          {bill.outstanding_base >= threshold ? (
            <StatusPill status="second-approver" label={t("needsSecondApprover")} tone="neutral" />
          ) : null}
        </div>
        <p className="text-content-secondary text-xs leading-4">
          {t("billTerms", {
            invoiced: formatDate(bill.date),
            due: bill.due_date ? formatDate(bill.due_date) : "—",
            currency: bill.currency,
          })}
        </p>
      </div>
      <Amount value={bill.outstanding} className="text-sm leading-5" />
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled={busy} onClick={onSendBack}>
          {t("sendBack")}
        </Button>
        <Button variant="primary" size="sm" disabled={busy} onClick={onApprove}>
          {t("approve")}
        </Button>
      </div>
    </article>
  )
}

/** 03.08 · Bill approvals — the queue of bills waiting for a decision before they can be paid. */
function BillApprovalsPage() {
  const t = useTranslations("FinanceMoneyOut")
  const tCommon = useTranslations("Common")
  const { data, isError, refetch } = useBillApprovals()
  const approve = useApproveBill()
  const [approving, setApproving] = React.useState<SubledgerDocument | null>(null)
  const [sendingBack, setSendingBack] = React.useState<SubledgerDocument | null>(null)
  const [outcome, setOutcome] = React.useState<Outcome | null>(null)

  const confirmApprove = () => {
    if (!approving) return
    const bill = approving
    approve.mutate(bill.id, {
      onSuccess: () => setOutcome({ kind: "approved", number: bill.number }),
      onError: () => toast.error(t("approveFailed", { number: bill.number })),
    })
  }

  return (
    <>
      <FinancePageHeader
        title={t("approvalsTitle")}
        figure={
          data ? (
            <HeaderFigure label={t("awaitingDecisionEgp")}>{formatAmount(data.total_base)}</HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingApprovals")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("inYourQueue")} value={data.count} />
              <KpiCard layout="bar" accent="teal" label={t("approvedToday")} value={data.approved_today} />
              <KpiCard layout="bar" accent="amber" label={t("sentBack")} value={data.sent_back} />
            </div>

            {outcome?.kind === "approved" ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {t("outcomeApproved", { number: outcome.number })}
              </FinanceAlert>
            ) : outcome?.kind === "sent_back" ? (
              <FinanceAlert tone="info">{t("outcomeSentBack", { number: outcome.number })}</FinanceAlert>
            ) : null}

            {data.items.length === 0 ? (
              <EmptyState
                variant="card"
                icon={<CircleCheck />}
                title={t("approvalsEmptyTitle")}
                description={t("approvalsEmptyDescription")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {data.items.map((bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    threshold={data.threshold}
                    busy={approve.isPending}
                    onApprove={() => setApproving(bill)}
                    onSendBack={() => setSendingBack(bill)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={Boolean(approving)} onOpenChange={(open) => !open && setApproving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("approveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("approveDescription", { number: approving?.number ?? t("theBill") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={confirmApprove}>
              {t("approveBill")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SendBackDialog
        bill={sendingBack}
        onOpenChange={(open) => !open && setSendingBack(null)}
        onSentBack={(bill) => setOutcome({ kind: "sent_back", number: bill.number })}
      />
    </>
  )
}

export { BillApprovalsPage }
