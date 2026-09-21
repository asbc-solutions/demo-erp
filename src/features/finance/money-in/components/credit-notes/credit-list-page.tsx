"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCreditNotes, useCustomerAdvances } from "../../lib/queries/receivables"
import type { CreditDocument } from "../../lib/types/receivables"
import { NewCreditNoteDialog } from "./new-credit-note-dialog"

function columns(kind: "credit_note" | "advance", totals: { gross: number; unapplied: number }) {
  const foreign = (row: CreditDocument, base: number) =>
    row.currency === "EGP" ? undefined : { value: base, currency: "EGP" }
  const list: FinanceColumn<CreditDocument>[] = [
    {
      id: "number",
      header: kind === "credit_note" ? "Note no." : "Reference",
      cell: (row) => <DocNumber>{row.number}</DocNumber>,
      footer: "Total",
    },
    { id: "customer", header: "Customer", cell: (row) => row.customer_name },
    { id: "date", header: kind === "credit_note" ? "Date" : "Received", cell: (row) => formatDate(row.date) },
    {
      id: "amount",
      header: kind === "credit_note" ? "Amount" : "Advance",
      align: "end",
      cell: (row) => <Amount value={row.gross} currency={row.currency} base={foreign(row, row.gross_base)} />,
      footer: <Amount value={totals.gross} currency="EGP" />,
    },
    {
      id: "unapplied",
      header: "Unapplied",
      align: "end",
      cell: (row) => (
        <Amount value={row.outstanding} currency={row.currency} base={foreign(row, row.unapplied_base)} />
      ),
      footer: <Amount value={totals.unapplied} currency="EGP" emphasis="strong" />,
    },
    { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  ]
  return list
}

const COPY = {
  credit_note: {
    title: "Credit notes",
    figure: "Unapplied (EGP)",
    count: "Notes issued",
    explainer:
      "A credit note reduces what the customer owes and can be applied against open invoices. Unapplied notes stay on the ledger until offset, so they always tie back to the aging report.",
  },
  advance: {
    title: "Customer advances",
    figure: "Unapplied advances (EGP)",
    count: "Open advances",
    explainer:
      "A customer advance is money received before an invoice exists, so it sits as a liability until applied. Allocating it against a future invoice clears both the advance and the receivable.",
  },
} as const

/**
 * 02.08 · Credit notes and 02.09 · Customer advances share one layout: both
 * are credits on the customer's account that wait to be applied.
 */
function CreditListPage({ kind }: { kind: "credit_note" | "advance" }) {
  const creditNotes = useCreditNotes(kind === "credit_note")
  const advances = useCustomerAdvances(kind === "advance")
  const { data, isError, refetch } = kind === "credit_note" ? creditNotes : advances
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const copy = COPY[kind]

  return (
    <>
      <FinancePageHeader
        title={copy.title}
        figure={
          data ? <HeaderFigure label={copy.figure}>{formatAmount(data.unapplied_base)}</HeaderFigure> : null
        }
        actions={
          kind === "credit_note" ? (
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              <Plus aria-hidden />
              New credit note
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={`Loading ${copy.title.toLowerCase()}`} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={copy.count}
                value={kind === "credit_note" ? data.count : data.open_count}
              />
              {kind === "credit_note" ? (
                <KpiCard layout="bar" accent="teal" label="Total value (EGP)" value={formatAmount(data.total_base)} />
              ) : null}
              <KpiCard layout="bar" accent="amber" label="Unapplied (EGP)" value={formatAmount(data.unapplied_base)} />
              {kind === "advance" && data.liability_account ? (
                <KpiCard
                  layout="bar"
                  accent="blue"
                  label="Held as liability"
                  value={<span className="font-mono">{data.liability_account}</span>}
                  caption="Customer advances"
                />
              ) : null}
            </div>
            <FinanceAlert tone="info">{copy.explainer}</FinanceAlert>
            <FinanceTable
              caption={copy.title}
              columns={columns(kind, { gross: data.total_base, unapplied: data.unapplied_base })}
              rows={data.items}
              getRowId={(row) => row.id}
            />
          </>
        )}
      </FinancePageBody>
      {kind === "credit_note" ? <NewCreditNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} /> : null}
    </>
  )
}

export { CreditListPage }
