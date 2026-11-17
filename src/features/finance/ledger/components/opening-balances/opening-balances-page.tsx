"use client"

import * as React from "react"
import { Lock } from "lucide-react"
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
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useLockOpenings } from "../../lib/mutations/ledger"
import { useOpeningBalances } from "../../lib/queries/ledger"
import type { LedgerTranslator, OpeningBalances } from "../../lib/types/ledger"

type Row = OpeningBalances["items"][number]

function columns(t: LedgerTranslator, totals: { debit: number; credit: number }): FinanceColumn<Row>[] {
  return [
    { id: "code", header: t("account"), cell: (row) => <span className="font-mono text-xs">{row.code}</span>, footer: t("total") },
    {
      id: "name",
      header: t("name"),
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.name}
          {row.owned ? <StatusPill status="routing-auto" label={t("fromSubledger")} tone="info" /> : null}
        </span>
      ),
    },
    { id: "side", header: t("normalSide"), cell: (row) => (row.normal_side === "debit" ? t("debit") : t("credit")) },
    { id: "debit", header: t("debitEgp"), align: "end", cell: (row) => (row.debit ? <Amount value={row.debit} /> : null), footer: <Amount value={totals.debit} emphasis="strong" /> },
    { id: "credit", header: t("creditEgp"), align: "end", cell: (row) => (row.credit ? <Amount value={row.credit} /> : null), footer: <Amount value={totals.credit} emphasis="strong" /> },
  ]
}

/** 05.10 · Opening balances — the starting position of the year, checked and then locked. */
function OpeningBalancesPage() {
  const t = useTranslations("FinanceLedger")
  const { formatDate, formatDateTime } = useFinanceDateFormat()
  const { data, isError, refetch } = useOpeningBalances()
  const lock = useLockOpenings()
  const [confirming, setConfirming] = React.useState(false)
  const balanced = data ? Math.abs(data.difference) < 0.005 : false

  return (
    <>
      <FinancePageHeader
        title={t("openingBalances")}
        figure={data ? <HeaderFigure label={t("asAt", { date: formatDate(data.as_at) })}>{t("accountsCount", { count: data.items.length })}</HeaderFigure> : null}
        actions={
          <Button variant="primary" disabled={!data || data.locked || !balanced} onClick={() => setConfirming(true)}>
            <Lock aria-hidden />
            {data?.locked ? t("locked") : t("lockOpeningBalances")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("totalDebitsEgp")} value={formatAmount(data.debit)} />
              <KpiCard layout="bar" accent="teal" label={t("totalCreditsEgp")} value={formatAmount(data.credit)} />
              <KpiCard layout="bar" accent="amber" label={t("differenceEgp")} value={formatAmount(data.difference)} caption={balanced ? t("balanced") : t("outOfBalance")} />
            </div>
            {data.locked ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {data.locked_at
                  ? t("openingsLockedOn", { date: formatDateTime(data.locked_at, " · ") })
                  : t("openingsLocked")}
              </FinanceAlert>
            ) : balanced ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {t("openingsBalancedInfo")}
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="danger">
                {t("openingsOutBy", { amount: formatAmount(data.difference) })}
              </FinanceAlert>
            )}
            <FinanceTable caption={t("openingBalances")} columns={columns(t, data)} rows={data.items} getRowId={(row) => row.code} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lockOpeningsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("lockOpeningsDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                lock.mutate(undefined, {
                  onSuccess: () => toast.success(t("toastOpeningsLocked")),
                  onError: (error) => toast.error(errorMessage(error, t("errorLockOpenings"))),
                })
              }
            >
              {t("lockOpeningBalances")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { OpeningBalancesPage }
