"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useSubledgerAdvances, useSubledgerNotes } from "../../lib/queries/subledger"
import type { CreditDocument, Side } from "../../lib/types/subledger"
import { NewNoteDialog } from "./new-note-dialog"

type CreditKind = "note" | "advance"

type SubledgerT = ReturnType<typeof useTranslations<"FinanceSubledger">>

function columns(
  side: Side,
  kind: CreditKind,
  totals: { gross: number; unapplied: number },
  t: SubledgerT,
  formatDate: FinanceDateFormat["formatDate"],
) {
  const foreign = (row: CreditDocument, base: number) =>
    row.currency === "EGP" ? undefined : { value: base, currency: "EGP" }
  const list: FinanceColumn<CreditDocument>[] = [
    {
      id: "number",
      header: kind === "note" ? t("colNoteNo") : t("colReference"),
      cell: (row) => <DocNumber>{row.number}</DocNumber>,
      footer: t("total"),
    },
    { id: "contact", header: t(`contactSingular.${side}`), cell: (row) => row.contact_name },
    {
      id: "date",
      header: kind === "note" ? t("colDate") : t(`advancesDate.${side}`),
      cell: (row) => formatDate(row.date),
    },
    {
      id: "amount",
      header: kind === "note" ? t("colAmount") : t("colAdvance"),
      align: "end",
      cell: (row) => <Amount value={row.gross} currency={row.currency} base={foreign(row, row.gross_base)} />,
      footer: <Amount value={totals.gross} currency="EGP" />,
    },
    {
      id: "unapplied",
      header: t("colUnapplied"),
      align: "end",
      cell: (row) => (
        <Amount value={row.outstanding} currency={row.currency} base={foreign(row, row.unapplied_base)} />
      ),
      footer: <Amount value={totals.unapplied} currency="EGP" emphasis="strong" />,
    },
    { id: "status", header: t("colStatus"), cell: (row) => <StatusPill status={row.status} /> },
  ]
  return list
}

/**
 * Credit notes (02.08), customer advances (02.09), debit notes (03.10) and
 * supplier advances (03.11) share one layout: each is a credit on the
 * contact's account that waits to be applied.
 */
function CreditListPage({ side, kind }: { side: Side; kind: CreditKind }) {
  const t = useTranslations("FinanceSubledger")
  const { formatDate } = useFinanceDateFormat()
  const notes = useSubledgerNotes(side, kind === "note")
  const advances = useSubledgerAdvances(side, kind === "advance")
  const { data, isError, refetch } = kind === "note" ? notes : advances
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const copy =
    kind === "note"
      ? {
          title: t(`notesTitle.${side}`),
          loading: t(`notesLoading.${side}`),
          figure: t("unappliedEgp"),
          explainer: t(`notesExplainer.${side}`),
        }
      : {
          title: t(`advancesTitle.${side}`),
          loading: t(`advancesLoading.${side}`),
          figure: t("unappliedAdvancesEgp"),
          explainer: t(`advancesExplainer.${side}`),
        }

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
              {t(`notesNew.${side}`)}
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={copy.loading} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={kind === "note" ? t("notesIssued") : t("openAdvances")}
                value={kind === "note" ? data.count : data.open_count}
              />
              {kind === "note" ? (
                <KpiCard layout="bar" accent="teal" label={t("totalValueEgp")} value={formatAmount(data.total_base)} />
              ) : null}
              <KpiCard layout="bar" accent="amber" label={t("unappliedEgp")} value={formatAmount(data.unapplied_base)} />
              {kind === "advance" && data.advances_account ? (
                <KpiCard
                  layout="bar"
                  accent="blue"
                  label={t(`advancesHeldAs.${side}`)}
                  value={<span className="font-mono">{data.advances_account}</span>}
                  caption={t(`advancesTitle.${side}`)}
                />
              ) : null}
            </div>
            <FinanceAlert tone="info">{copy.explainer}</FinanceAlert>
            <FinanceTable
              caption={copy.title}
              columns={columns(side, kind, { gross: data.total_base, unapplied: data.unapplied_base }, t, formatDate)}
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
