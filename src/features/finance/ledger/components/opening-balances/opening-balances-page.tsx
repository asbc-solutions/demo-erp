"use client"

import * as React from "react"
import { Lock } from "lucide-react"
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
import { formatDate, formatDateTime } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useLockOpenings } from "../../lib/mutations/ledger"
import { useOpeningBalances } from "../../lib/queries/ledger"
import type { OpeningBalances } from "../../lib/types/ledger"

type Row = OpeningBalances["items"][number]

function columns(totals: { debit: number; credit: number }): FinanceColumn<Row>[] {
  return [
    { id: "code", header: "Account", cell: (row) => <span className="font-mono text-xs">{row.code}</span>, footer: "Total" },
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.name}
          {row.owned ? <StatusPill status="routing-auto" label="From subledger" tone="info" /> : null}
        </span>
      ),
    },
    { id: "side", header: "Normal side", cell: (row) => (row.normal_side === "debit" ? "Debit" : "Credit") },
    { id: "debit", header: "Debit (EGP)", align: "end", cell: (row) => (row.debit ? <Amount value={row.debit} /> : null), footer: <Amount value={totals.debit} emphasis="strong" /> },
    { id: "credit", header: "Credit (EGP)", align: "end", cell: (row) => (row.credit ? <Amount value={row.credit} /> : null), footer: <Amount value={totals.credit} emphasis="strong" /> },
  ]
}

/** 05.10 · Opening balances — the starting position of the year, checked and then locked. */
function OpeningBalancesPage() {
  const { data, isError, refetch } = useOpeningBalances()
  const lock = useLockOpenings()
  const [confirming, setConfirming] = React.useState(false)
  const balanced = data ? Math.abs(data.difference) < 0.005 : false

  return (
    <>
      <FinancePageHeader
        title="Opening balances"
        figure={data ? <HeaderFigure label={`As at ${formatDate(data.as_at)}`}>{data.items.length} accounts</HeaderFigure> : null}
        actions={
          <Button variant="primary" disabled={!data || data.locked || !balanced} onClick={() => setConfirming(true)}>
            <Lock aria-hidden />
            {data?.locked ? "Locked" : "Lock opening balances"}
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
              <KpiCard layout="bar" accent="indigo" label="Total debits (EGP)" value={formatAmount(data.debit)} />
              <KpiCard layout="bar" accent="teal" label="Total credits (EGP)" value={formatAmount(data.credit)} />
              <KpiCard layout="bar" accent="amber" label="Difference (EGP)" value={formatAmount(data.difference)} caption={balanced ? "Balanced" : "Out of balance"} />
            </div>
            {data.locked ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                Locked{data.locked_at ? ` on ${formatDateTime(data.locked_at, " · ")}` : ""}. Changes to the starting
                position now go through an adjusting journal.
              </FinanceAlert>
            ) : balanced ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                Opening balances are in balance: total debits equal total credits. Locking them freezes the starting
                position for the fiscal year, after which changes must go through an adjusting journal.
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="danger">
                Opening balances are out by {formatAmount(data.difference)}. Correct the difference before locking.
              </FinanceAlert>
            )}
            <FinanceTable caption="Opening balances" columns={columns(data)} rows={data.items} getRowId={(row) => row.code} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock the opening balances?</AlertDialogTitle>
            <AlertDialogDescription>
              Locking freezes the opening figures for the year. They can no longer be edited, and every report from
              here on measures against them. This cannot be undone in this prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                lock.mutate(undefined, {
                  onSuccess: () => toast.success("The opening balances are locked."),
                  onError: (error) => toast.error(errorMessage(error, "The balances could not be locked. Try again.")),
                })
              }
            >
              Lock opening balances
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { OpeningBalancesPage }
