"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
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
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount, formatRate } from "../../../lib/utils/money"
import { usePostRevaluation } from "../../lib/mutations/ledger"
import { useFxRevaluation } from "../../lib/queries/ledger"
import type { LedgerTranslator, RevaluationRow } from "../../lib/types/ledger"

function columns(t: LedgerTranslator, net: number): FinanceColumn<RevaluationRow>[] {
  return [
    { id: "name", header: t("treasury"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span>, footer: t("netAdjustment") },
    { id: "balance", header: t("balanceFcy"), align: "end", cell: (row) => <Amount value={row.balance} currency={row.currency} /> },
    { id: "book", header: t("bookRate"), align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.book_rate)}</span> },
    { id: "spot", header: t("spotRate"), align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.spot_rate)}</span> },
    { id: "unrealized", header: t("unrealizedEgp"), align: "end", cell: (row) => <Amount value={row.unrealized} signed />, footer: <Amount value={net} signed emphasis="strong" /> },
  ]
}

/** 05.13 · FX revaluation — restate foreign-currency balances at the period-end spot rate. */
function FxRevaluationPage() {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
  const { data, isError, refetch } = useFxRevaluation()
  const post = usePostRevaluation()
  const [confirming, setConfirming] = React.useState(false)
  const nothingToPost = !data || Math.abs(data.net) < 0.005
  const last = data?.posted[data.posted.length - 1]

  return (
    <>
      <FinancePageHeader
        title={t("fxRevaluation")}
        figure={
          data ? (
            <HeaderFigure label={t("unrealizedGainLoss")}>
              <Amount value={data.net} align="start" signed />
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="primary" disabled={nothingToPost || post.isPending} onClick={() => setConfirming(true)}>
            {t("postRevaluation")}
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
              <KpiCard layout="bar" accent="indigo" label={t("fcyTreasuries")} value={data.items.length} />
              <KpiCard layout="bar" accent="teal" label={t("revaluationDate")} value={formatDate(data.date)} />
              <KpiCard layout="bar" accent="amber" label={t("netAdjustmentEgp")} value={formatAmount(data.net)} />
            </div>
            {last && nothingToPost ? (
              <FinanceAlert
                tone="success"
                className="text-status-success-fg"
                action={
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/finance/journals/${last.journal}`}>{t("viewJournal")}</Link>
                  </Button>
                }
              >
                {t("revaluedNotice", { date: formatDate(last.date), amount: formatAmount(last.net) })}
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="info">
                {t("revaluationInfo", { date: formatDate(data.date) })}
              </FinanceAlert>
            )}
            <FinanceTable caption={t("fcyTreasuriesCaption")} columns={columns(t, data.net)} rows={data.items} getRowId={(row) => row.treasury_id} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("postRevaluationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("postRevaluationDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          {data ? (
            <ul className="border-stroke-default divide-stroke-light divide-y rounded-lg border text-[13px] leading-5">
              {data.items.map((row) => (
                <li key={row.treasury_id} className="flex justify-between gap-4 px-3 py-2">
                  <span>
                    {row.name} · {row.currency}
                  </span>
                  <Amount value={row.unrealized} signed />
                </li>
              ))}
              <li className="flex justify-between gap-4 px-3 py-2 font-semibold">
                <span>{t("netAdjustmentEgp")}</span>
                <Amount value={data.net} signed emphasis="strong" />
              </li>
            </ul>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                post.mutate(undefined, {
                  onSuccess: (result) => toast.success(t("toastRevaluationPosted", { journal: result.journal, amount: formatAmount(result.net) })),
                  onError: (error) => toast.error(errorMessage(error, t("errorPostRevaluation"))),
                })
              }
            >
              {t("postRevaluation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { FxRevaluationPage }
