"use client"

import * as React from "react"
import { CircleCheck } from "lucide-react"
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
import { formatDate } from "../../../lib/utils/date"
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
            <StatusPill status="overdue" label={`Due ${formatDate(bill.due_date)}`} family="internal" tone="warning" />
          ) : null}
          {bill.outstanding_base >= threshold ? (
            <StatusPill status="second-approver" label="Needs a second approver" tone="neutral" />
          ) : null}
        </div>
        <p className="text-content-secondary text-xs leading-4">
          Invoiced {formatDate(bill.date)} · terms to {bill.due_date ? formatDate(bill.due_date) : "—"} ·{" "}
          {bill.currency}
        </p>
      </div>
      <Amount value={bill.outstanding} className="text-sm leading-5" />
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled={busy} onClick={onSendBack}>
          Send back
        </Button>
        <Button variant="primary" size="sm" disabled={busy} onClick={onApprove}>
          Approve
        </Button>
      </div>
    </article>
  )
}

/** 03.08 · Bill approvals — the queue of bills waiting for a decision before they can be paid. */
function BillApprovalsPage() {
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
      onError: () => toast.error(`${bill.number} could not be approved. Try again.`),
    })
  }

  return (
    <>
      <FinancePageHeader
        title="Bill approvals"
        figure={
          data ? (
            <HeaderFigure label="Awaiting your decision (EGP)">{formatAmount(data.total_base)}</HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading bill approvals" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="In your queue" value={data.count} />
              <KpiCard layout="bar" accent="teal" label="Approved today" value={data.approved_today} />
              <KpiCard layout="bar" accent="amber" label="Sent back" value={data.sent_back} />
            </div>

            {outcome?.kind === "approved" ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {outcome.number} approved for payment. The next approver in the policy is notified
                automatically. Approved bills flow into the next payment run.
              </FinanceAlert>
            ) : outcome?.kind === "sent_back" ? (
              <FinanceAlert tone="info">
                {outcome.number} was sent back to the preparer with your reason. It left the queue and
                the payables balance, and comes back here once it is corrected and resubmitted.
              </FinanceAlert>
            ) : null}

            {data.items.length === 0 ? (
              <EmptyState
                variant="card"
                icon={<CircleCheck />}
                title="Nothing is waiting for your approval."
                description="New bills appear here as soon as they are submitted for approval."
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
            <AlertDialogTitle>Approve this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving releases {approving?.number ?? "the bill"} into the payment queue. The supplier is
              not paid until a payment run includes it, and you can still hold it before the run.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={confirmApprove}>
              Approve bill
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
