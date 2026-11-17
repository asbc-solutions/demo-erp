"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
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
import { useCustody } from "../../lib/queries/banking"
import type { CustodyHolder } from "../../lib/types/banking"
import { NewCustodyDialog } from "./new-custody-dialog"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

function columns(
  totals: { advanced: number; settled: number; outstanding: number },
  t: BankingT,
  formatDate: FinanceDateFormat["formatDate"],
): FinanceColumn<CustodyHolder>[] {
  return [
    {
      id: "employee",
      header: t("colEmployee"),
      cell: (row) => (
        <span className="flex flex-col">
          <Link href={`/finance/custody/${row.id}`} className="text-content-primary text-[13px] leading-5 font-medium hover:underline">
            {row.name}
          </Link>
          <span className="text-content-tertiary text-xs leading-4">{row.role}</span>
        </span>
      ),
      footer: t("total"),
    },
    { id: "since", header: t("colHeldSince"), cell: (row) => (row.since ? formatDate(row.since) : "—") },
    { id: "advanced", header: t("advancedEgp"), align: "end", cell: (row) => <Amount value={row.advanced} />, footer: <Amount value={totals.advanced} /> },
    { id: "settled", header: t("settledEgp"), align: "end", cell: (row) => <Amount value={row.settled} />, footer: <Amount value={totals.settled} /> },
    {
      id: "outstanding",
      header: t("outstandingEgp"),
      align: "end",
      cell: (row) => <Amount value={row.outstanding} emphasis="strong" />,
      footer: <Amount value={totals.outstanding} emphasis="strong" />,
    },
    {
      id: "status",
      header: t("colStatus"),
      cell: (row) =>
        row.status === "open" ? <StatusPill status="open" /> : <StatusPill status="settled" label={t("cleared")} />,
    },
  ]
}

/** 04.13 · Employee custody — cash advanced to staff and not yet accounted for. */
function CustodyPage() {
  const t = useTranslations("FinanceBanking")
  const { formatDate } = useFinanceDateFormat()
  const router = useRouter()
  const { data, isError, refetch } = useCustody()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const totals = {
    advanced: data?.items.reduce((sum, row) => sum + row.advanced, 0) ?? 0,
    settled: data?.items.reduce((sum, row) => sum + row.settled, 0) ?? 0,
    outstanding: data?.outstanding ?? 0,
  }

  return (
    <>
      <FinancePageHeader
        title={t("employeeCustody")}
        figure={data ? <HeaderFigure label={t("outstandingCustodyEgp")}>{formatAmount(data.outstanding)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newCustody")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingCustody")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("openHolders")} value={data.open_count} />
              <KpiCard layout="bar" accent="teal" label={t("outstandingEgp")} value={formatAmount(data.outstanding)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("custodyAccount")}
                value={<span className="font-mono">{data.account}</span>}
                caption={t("employeeCustody")}
              />
            </div>
            <FinanceAlert tone="info">{t("custodyNote")}</FinanceAlert>
            <FinanceTable
              caption={t("employeeCustody")}
              columns={columns(totals, t, formatDate)}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/custody/${row.id}`)}
            />
          </>
        )}
      </FinancePageBody>
      <NewCustodyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { CustodyPage }
