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
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useSubledgerAdvances, useSubledgerNotes } from "../../lib/queries/subledger"
import type { CreditDocument, Side } from "../../lib/types/subledger"
import { NewNoteDialog } from "./new-note-dialog"

type CreditKind = "note" | "advance"

function columns(side: Side, kind: CreditKind, totals: { gross: number; unapplied: number }) {
  const config = SUBLEDGER_SIDES[side]
  const foreign = (row: CreditDocument, base: number) =>
    row.currency === "EGP" ? undefined : { value: base, currency: "EGP" }
  const list: FinanceColumn<CreditDocument>[] = [
    {
      id: "number",
      header: kind === "note" ? "Note no." : "Reference",
      cell: (row) => <DocNumber>{row.number}</DocNumber>,
      footer: "Total",
    },
    { id: "contact", header: config.contact.singular, cell: (row) => row.contact_name },
    {
      id: "date",
      header: kind === "note" ? "Date" : config.advances.date,
      cell: (row) => formatDate(row.date),
    },
    {
      id: "amount",
      header: kind === "note" ? "Amount" : "Advance",
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

/**
 * Credit notes (02.08), customer advances (02.09), debit notes (03.10) and
 * supplier advances (03.11) share one layout: each is a credit on the
 * contact's account that waits to be applied.
 */
function CreditListPage({ side, kind }: { side: Side; kind: CreditKind }) {
  const config = SUBLEDGER_SIDES[side]
  const notes = useSubledgerNotes(side, kind === "note")
  const advances = useSubledgerAdvances(side, kind === "advance")
  const { data, isError, refetch } = kind === "note" ? notes : advances
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const copy =
    kind === "note"
      ? { title: config.notes.title, figure: "Unapplied (EGP)", explainer: config.notes.explainer }
      : { title: config.advances.title, figure: config.advances.figure, explainer: config.advances.explainer }

  return (
    <>
      <FinancePageHeader
        title={copy.title}
        figure={
          data ? <HeaderFigure label={copy.figure}>{formatAmount(data.unapplied_base)}</HeaderFigure> : null
        }
        actions={
          kind === "note" ? (
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              <Plus aria-hidden />
              {config.notes.newLabel}
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
                label={kind === "note" ? config.notes.count : "Open advances"}
                value={kind === "note" ? data.count : data.open_count}
              />
              {kind === "note" ? (
                <KpiCard layout="bar" accent="teal" label="Total value (EGP)" value={formatAmount(data.total_base)} />
              ) : null}
              <KpiCard layout="bar" accent="amber" label="Unapplied (EGP)" value={formatAmount(data.unapplied_base)} />
              {kind === "advance" && data.advances_account ? (
                <KpiCard
                  layout="bar"
                  accent="blue"
                  label={config.advances.heldAs}
                  value={<span className="font-mono">{data.advances_account}</span>}
                  caption={config.advances.title}
                />
              ) : null}
            </div>
            <FinanceAlert tone="info">{copy.explainer}</FinanceAlert>
            <FinanceTable
              caption={copy.title}
              columns={columns(side, kind, { gross: data.total_base, unapplied: data.unapplied_base })}
              rows={data.items}
              getRowId={(row) => row.id}
            />
          </>
        )}
      </FinancePageBody>
      {kind === "note" ? <NewNoteDialog side={side} open={dialogOpen} onOpenChange={setDialogOpen} /> : null}
    </>
  )
}

export { CreditListPage }
