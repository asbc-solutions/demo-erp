"use client"

import { Link, useRouter } from "@/src/i18n/navigation"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useAdjustments } from "../../lib/queries/close"
import type { Adjustment } from "../../lib/types/close"

type CloseT = ReturnType<typeof useTranslations<"FinanceClose">>

function columns(total: number, t: CloseT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Adjustment>[] {
  return [
    { id: "number", header: t("colEntryNo"), cell: (row) => <DocNumber>{row.number}</DocNumber>, footer: t("total") },
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    { id: "description", header: t("colDescription"), cell: (row) => <span className="block max-w-96 truncate">{row.description}</span> },
    { id: "amount", header: t("amountEgp"), align: "end", cell: (row) => <Amount value={row.amount} />, footer: <Amount value={total} emphasis="strong" /> },
    { id: "status", header: t("colStatus"), cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/** 06.04 · Adjustments — the manual entries booked during the close. */
function AdjustmentsPage() {
  const t = useTranslations("FinanceClose")
  const { formatDate } = useFinanceDateFormat()
  const router = useRouter()
  const { data, isError, refetch } = useAdjustments()

  return (
    <>
      <FinancePageHeader
        title={t("adjustmentsTitle")}
        figure={data ? <HeaderFigure label={t("adjustingEntriesEgp")}>{formatAmount(data.total_base)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              {t("newAdjustment")}
            </Link>
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
              <KpiCard layout="bar" accent="indigo" label={t("adjustingEntries")} value={data.count} />
              <KpiCard layout="bar" accent="teal" label={t("totalValueEgp")} value={formatAmount(data.total_base)} />
              <KpiCard layout="bar" accent="amber" label={t("period")} value={data.period.label} caption={t("adjustingWindow")} />
            </div>
            <FinanceAlert tone="info">{t("adjustmentsNote")}</FinanceAlert>
            <FinanceTable
              caption={t("adjustingEntries")}
              columns={columns(data.total_base, t, formatDate)}
              rows={data.items}
              getRowId={(row) => row.number}
              onRowClick={(row) => router.push(`/finance/journals/${row.number}`)}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noAdjustments")}</p>}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AdjustmentsPage }
