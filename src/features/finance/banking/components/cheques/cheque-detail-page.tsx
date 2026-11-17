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
import { StatusPill, useStatusLabel } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useMoveCheque } from "../../lib/mutations/banking"
import { useCheque } from "../../lib/queries/banking"
import type { Cheque, ChequeDirection } from "../../lib/types/banking"
import { CHEQUE_COPY } from "./cheque-dialog"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

/** The button each next status shows as (a `FinanceBanking` key), and whether it is the expected path. */
const NEXT_ACTION = {
  deposited: { label: "actionDeposit", variant: "primary" },
  under_collection: { label: "actionSendForCollection", variant: "primary" },
  collected: { label: "actionMarkCollected", variant: "primary" },
  bounced: { label: "actionMarkBounced", variant: "danger" },
  returned: { label: "actionReturnToDrawer", variant: "secondary" },
  delivered: { label: "actionMarkDelivered", variant: "primary" },
  presented: { label: "actionMarkPresented", variant: "primary" },
  cleared: { label: "actionMarkCleared", variant: "primary" },
  cancelled: { label: "actionCancelCheque", variant: "danger" },
} as const

type NextStatus = keyof typeof NEXT_ACTION

function nextAction(status: string) {
  return status in NEXT_ACTION ? NEXT_ACTION[status as NextStatus] : null
}

const REGISTER = {
  received: { title: "chequesReceived", open: "openChequesReceived", href: "/finance/cheques/received" },
  issued: { title: "chequesIssued", open: "openChequesIssued", href: "/finance/cheques/issued" },
} as const

function postingNote(cheque: Cheque, t: BankingT) {
  if (cheque.entry) return null
  if (cheque.direction === "received") {
    return t("postingNoteReceived", {
      amount: formatAmount(cheque.amount),
      currency: cheque.currency,
      treasury: cheque.treasury_name,
    })
  }
  return t("postingNoteIssued", { treasury: cheque.treasury_name })
}

/** Statuses a cheque never leaves, so they are confirmed first (`FinanceBanking` keys). */
const TERMINAL: Partial<Record<string, "terminalCancelled" | "terminalReturned">> = {
  cancelled: "terminalCancelled",
  returned: "terminalReturned",
}

/** 04.02 · Cheque detail — where a cheque is in its life, and what can happen next. */
function ChequeDetailPage({ direction, chequeId }: { direction: ChequeDirection; chequeId: string }) {
  const t = useTranslations("FinanceBanking")
  const { formatDate } = useFinanceDateFormat()
  const statusLabel = useStatusLabel()
  const { data: cheque, isError, isPending, refetch } = useCheque(chequeId)
  const move = useMoveCheque()
  const register = REGISTER[direction]
  const [confirming, setConfirming] = React.useState<string | null>(null)
  const confirmAction = confirming ? nextAction(confirming) : null
  const confirmCopy = confirming ? TERMINAL[confirming] : undefined

  const apply = (status: string) => {
    if (!cheque) return
    move.mutate(
      { id: cheque.id, status },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.entry && !cheque.entry
              ? t("chequeMovedPosted", { number: updated.number, status: statusLabel(status), entry: updated.entry })
              : t("chequeMoved", { number: updated.number, status: statusLabel(status) }),
          ),
        onError: (error) => toast.error(errorMessage(error, t("chequeUpdateFailed"))),
      },
    )
  }

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("cheque")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if ((!isPending && !cheque) || (cheque && cheque.direction !== direction)) {
    return (
      <>
        <FinancePageHeader title={t("chequeNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("noChequeWithNumber")}
            description={t("chequeNotFoundDescription", { register: t(register.title) })}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href={register.href}>{t(register.open)}</Link>
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
        title={cheque ? t("chequeNumber", { number: cheque.number }) : t("cheque")}
        figure={
          cheque ? (
            <HeaderFigure label={t("colAmount")}>
              <Amount value={cheque.amount} currency={cheque.currency} align="start" />
            </HeaderFigure>
          ) : null
        }
        actions={
          cheque ? (
            <>
              {cheque.next.map((status) => {
                const action = nextAction(status)
                return (
                  <Button
                    key={status}
                    variant={action?.variant ?? "secondary"}
                    disabled={move.isPending}
                    onClick={() => (TERMINAL[status] ? setConfirming(status) : apply(status))}
                  >
                    {action ? t(action.label) : statusLabel(status)}
                  </Button>
                )
              })}
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!cheque ? (
          <Skeleton aria-busy aria-label={t("loadingCheque")} className="h-80 rounded-xl" />
        ) : (
          <>
            <MetaChips>
              <StatusPill status={cheque.status} />
              <span>{direction === "received" ? t("received") : t("colIssued")}</span>
              <span>{cheque.bank}</span>
            </MetaChips>

            <KeyValueList
              items={[
                { term: t(CHEQUE_COPY[direction].party), value: cheque.party_name },
                { term: t("colIssued"), value: formatDate(cheque.issue_date) },
                {
                  term: t("colDue"),
                  value: (
                    <>
                      {formatDate(cheque.due_date)}
                      {cheque.days_to_due !== null && cheque.days_to_due >= 0 ? (
                        <span className="text-content-tertiary"> · {t("inDays", { days: cheque.days_to_due })}</span>
                      ) : null}
                    </>
                  ),
                },
                {
                  term: t("treasury"),
                  value: (
                    <Link href={`/finance/treasuries/${cheque.treasury_id}`} className="hover:underline">
                      {cheque.treasury_name}
                    </Link>
                  ),
                },
                {
                  term: t("journal"),
                  value: cheque.entry ? (
                    <Link href={`/finance/treasuries/${cheque.treasury_id}`} className="font-mono hover:underline">
                      {cheque.entry}
                    </Link>
                  ) : (
                    t("notPosted")
                  ),
                },
              ]}
            />

            {postingNote(cheque, t) && cheque.next.length > 0 ? (
              <FinanceAlert tone="info">{postingNote(cheque, t)}</FinanceAlert>
            ) : null}

            <FinanceSection title={t("history")}>
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
            <AlertDialogTitle>
              {confirming
                ? t("confirmAction", { action: confirmAction ? t(confirmAction.label) : t("update") })
                : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy ? t(confirmCopy) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirming && apply(confirming)}>
              {confirmAction ? t(confirmAction.label) : null}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { ChequeDetailPage }
