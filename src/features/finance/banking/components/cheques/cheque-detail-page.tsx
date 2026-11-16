"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
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
import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { KeyValueList } from "../../../components/shared/key-value-list"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
  MetaChips,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useMoveCheque } from "../../lib/mutations/banking"
import { useCheque } from "../../lib/queries/banking"
import type { Cheque, ChequeDirection } from "../../lib/types/banking"
import { CHEQUE_COPY } from "./cheque-dialog"

/** The button each next status shows as, and whether it is the expected path. */
const NEXT_ACTION: Record<string, { label: string; variant: "primary" | "secondary" | "danger" }> = {
  deposited: { label: "Deposit", variant: "primary" },
  under_collection: { label: "Send for collection", variant: "primary" },
  collected: { label: "Mark collected", variant: "primary" },
  bounced: { label: "Mark bounced", variant: "danger" },
  returned: { label: "Return to drawer", variant: "secondary" },
  delivered: { label: "Mark delivered", variant: "primary" },
  presented: { label: "Mark presented", variant: "primary" },
  cleared: { label: "Mark cleared", variant: "primary" },
  cancelled: { label: "Cancel cheque", variant: "danger" },
}

const REGISTER = {
  received: { title: "Cheques received", href: "/finance/cheques/received" },
  issued: { title: "Cheques issued", href: "/finance/cheques/issued" },
} as const

function postingNote(cheque: Cheque) {
  if (cheque.entry) return null
  if (cheque.direction === "received") {
    return `Nothing has posted yet. Marking it collected posts ${formatAmount(cheque.amount)} ${cheque.currency} into ${cheque.treasury_name}.`
  }
  return `Nothing has posted yet. Marking it cleared takes the amount out of ${cheque.treasury_name}.`
}

/** Statuses a cheque never leaves, so they are confirmed first. */
const TERMINAL: Record<string, string> = {
  cancelled: "Cancelling voids the cheque for good. It stays in the register as cancelled, and its number is never reused.",
  returned: "Returning hands the cheque back to the drawer. It stays in the register as returned and nothing posts.",
}

/** 04.02 · Cheque detail — where a cheque is in its life, and what can happen next. */
function ChequeDetailPage({ direction, chequeId }: { direction: ChequeDirection; chequeId: string }) {
  const { data: cheque, isError, isPending, refetch } = useCheque(chequeId)
  const move = useMoveCheque()
  const register = REGISTER[direction]
  const [confirming, setConfirming] = React.useState<string | null>(null)

  const apply = (status: string) => {
    if (!cheque) return
    move.mutate(
      { id: cheque.id, status },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.entry && !cheque.entry
              ? `Cheque ${updated.number} is ${status.replace(/_/g, " ")} and posted as ${updated.entry}.`
              : `Cheque ${updated.number} is now ${status.replace(/_/g, " ")}.`,
          ),
        onError: (error) => toast.error(errorMessage(error, "The cheque could not be updated. Try again.")),
      },
    )
  }

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Cheque" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if ((!isPending && !cheque) || (cheque && cheque.direction !== direction)) {
    return (
      <>
        <FinancePageHeader title="Cheque not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no cheque with this number in the register."
            description={`It may have been recorded under the other register. Pick it from ${register.title}.`}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href={register.href}>Open {register.title}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title={cheque ? `Cheque ${cheque.number}` : "Cheque"}
        figure={
          cheque ? (
            <HeaderFigure label="Amount">
              <Amount value={cheque.amount} currency={cheque.currency} align="start" />
            </HeaderFigure>
          ) : null
        }
        actions={
          cheque ? (
            <>
              {cheque.next.map((status) => {
                const action = NEXT_ACTION[status] ?? { label: status, variant: "secondary" as const }
                return (
                  <Button
                    key={status}
                    variant={action.variant}
                    disabled={move.isPending}
                    onClick={() => (TERMINAL[status] ? setConfirming(status) : apply(status))}
                  >
                    {action.label}
                  </Button>
                )
              })}
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!cheque ? (
          <Skeleton aria-busy aria-label="Loading cheque" className="h-80 rounded-xl" />
        ) : (
          <>
            <MetaChips>
              <StatusPill status={cheque.status} />
              <span>{direction === "received" ? "Received" : "Issued"}</span>
              <span>{cheque.bank}</span>
            </MetaChips>

            <KeyValueList
              items={[
                { term: CHEQUE_COPY[direction].party, value: cheque.party_name },
                { term: "Issued", value: formatDate(cheque.issue_date) },
                {
                  term: "Due",
                  value: (
                    <>
                      {formatDate(cheque.due_date)}
                      {cheque.days_to_due !== null && cheque.days_to_due >= 0 ? (
                        <span className="text-content-tertiary"> · in {cheque.days_to_due}d</span>
                      ) : null}
                    </>
                  ),
                },
                {
                  term: "Treasury",
                  value: (
                    <Link href={`/finance/treasuries/${cheque.treasury_id}`} className="hover:underline">
                      {cheque.treasury_name}
                    </Link>
                  ),
                },
                {
                  term: "Journal",
                  value: cheque.entry ? (
                    <Link href={`/finance/treasuries/${cheque.treasury_id}`} className="font-mono hover:underline">
                      {cheque.entry}
                    </Link>
                  ) : (
                    "Not posted"
                  ),
                },
              ]}
            />

            {postingNote(cheque) && cheque.next.length > 0 ? (
              <FinanceAlert tone="info">{postingNote(cheque)}</FinanceAlert>
            ) : null}

            <FinanceSection title="History">
              <ol className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                {[...cheque.history].reverse().map((step, index) => (
                  <li key={`${step.status}-${index}`} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px] leading-5">
                    <StatusPill status={step.status} />
                    <span className="text-content-secondary">{formatDate(step.date)}</span>
                  </li>
                ))}
              </ol>
            </FinanceSection>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming ? `${NEXT_ACTION[confirming]?.label ?? "Update"}?` : ""}</AlertDialogTitle>
            <AlertDialogDescription>{confirming ? TERMINAL[confirming] : null}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirming && apply(confirming)}>
              {confirming ? NEXT_ACTION[confirming]?.label : null}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { ChequeDetailPage }
