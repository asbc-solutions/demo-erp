"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount, formatRate } from "../../../lib/utils/money"
import { usePostRevaluation } from "../../lib/mutations/ledger"
import { useFxRevaluation } from "../../lib/queries/ledger"
import type { RevaluationRow } from "../../lib/types/ledger"

function columns(net: number): FinanceColumn<RevaluationRow>[] {
  return [
    { id: "name", header: "Treasury", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span>, footer: "Net adjustment" },
    { id: "balance", header: "Balance (FCY)", align: "end", cell: (row) => <Amount value={row.balance} currency={row.currency} /> },
    { id: "book", header: "Book rate", align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.book_rate)}</span> },
    { id: "spot", header: "Spot rate", align: "end", cell: (row) => <span className="tabular-nums">{formatRate(row.spot_rate)}</span> },
    { id: "unrealized", header: "Unrealized (EGP)", align: "end", cell: (row) => <Amount value={row.unrealized} signed />, footer: <Amount value={net} signed emphasis="strong" /> },
  ]
}

/** 05.13 · FX revaluation — restate foreign-currency balances at the period-end spot rate. */
function FxRevaluationPage() {
  const { data, isError, refetch } = useFxRevaluation()
  const post = usePostRevaluation()
  const [confirming, setConfirming] = React.useState(false)
  const nothingToPost = !data || Math.abs(data.net) < 0.005
  const last = data?.posted[data.posted.length - 1]

  return (
    <>
      <FinancePageHeader
        title="FX revaluation"
        figure={
          data ? (
            <HeaderFigure label="Unrealized gain / (loss) · EGP">
              <Amount value={data.net} align="start" signed />
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="primary" disabled={nothingToPost || post.isPending} onClick={() => setConfirming(true)}>
            Post revaluation
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
              <KpiCard layout="bar" accent="indigo" label="FCY treasuries" value={data.items.length} />
              <KpiCard layout="bar" accent="teal" label="Revaluation date" value={formatDate(data.date)} />
              <KpiCard layout="bar" accent="amber" label="Net adjustment (EGP)" value={formatAmount(data.net)} />
            </div>
            {last && nothingToPost ? (
              <FinanceAlert
                tone="success"
                className="text-status-success-fg"
                action={
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/finance/journals/${last.journal}`}>View journal</Link>
                  </Button>
                }
              >
                Revalued on {formatDate(last.date)} for {formatAmount(last.net)} EGP. Every foreign-currency balance now
                sits at the spot rate, so there is nothing further to post this period.
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="info">
                Posting revaluation adjusts each foreign-currency balance to the spot rate at {formatDate(data.date)}. The
                offsetting gain or loss books to unrealized FX (unrealized gains reverse next period), so run this only
                once per period.
              </FinanceAlert>
            )}
            <FinanceTable caption="Foreign-currency treasuries" columns={columns(data.net)} rows={data.items} getRowId={(row) => row.treasury_id} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post the revaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This posts one balanced entry restating every foreign-currency balance at the spot rate, with the
              difference to unrealised FX. It is a real posting and can only be reversed from the journal.
            </AlertDialogDescription>
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
                <span>Net adjustment (EGP)</span>
                <Amount value={data.net} signed emphasis="strong" />
              </li>
            </ul>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                post.mutate(undefined, {
                  onSuccess: (result) => toast.success(`${result.journal} posted the revaluation (${formatAmount(result.net)} EGP).`),
                  onError: (error) => toast.error(errorMessage(error, "The revaluation could not be posted. Try again.")),
                })
              }
            >
              Post revaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { FxRevaluationPage }
