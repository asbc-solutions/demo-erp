"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/src/i18n/navigation"

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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCollections } from "../../lib/queries/receivables"
import { AgingBucketPill } from "../../../subledger/components/shared/aging-bucket-pill"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"

type MoneyInT = ReturnType<typeof useTranslations<"FinanceMoneyIn">>

function collectionColumns(t: MoneyInT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<SubledgerDocument>[] {
  return [
    { id: "invoice", header: t("colInvoice"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
    {
      id: "customer",
      header: t("colCustomer"),
      cell: (row) => <span className="text-content-primary font-medium">{row.contact_name}</span>,
    },
    { id: "due", header: t("colDue"), cell: (row) => (row.due_date ? formatDate(row.due_date) : "—") },
    {
      id: "late",
      header: t("colDaysLate"),
      align: "end",
      cell: (row) => <span className="text-status-danger-fg tabular-nums">{row.days_late}</span>,
    },
    { id: "bucket", header: t("colBucket"), cell: (row) => <AgingBucketPill bucket={row.bucket} /> },
    {
      id: "outstanding",
      header: t("colOutstandingEgp"),
      align: "end",
      cell: (row) => <Amount value={row.outstanding_base} />,
    },
    {
      id: "action",
      header: <span className="sr-only">{t("followUp")}</span>,
      align: "end",
      cell: (row) => (
        <Button variant="secondary" size="sm" asChild>
          <Link
            href={`/finance/ar/${row.contact_id}`}
            aria-label={t("followUpLabel", { number: row.number, name: row.contact_name })}
          >
            {t("followUp")}
          </Link>
        </Button>
      ),
    },
  ]
}

/** 02.07 · Collections — overdue invoices ranked by exposure. */
function CollectionsPage() {
  const t = useTranslations("FinanceMoneyIn")
  const { formatDate } = useFinanceDateFormat()
  const { data, isError, refetch } = useCollections()

  return (
    <>
      <FinancePageHeader
        title={t("collectionsTitle")}
        figure={
          data ? (
            <HeaderFigure size="lg" label={t("overdueReceivableEgp")}>
              {formatAmount(data.overdue_base)}
            </HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingCollections")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("overdueInvoices")} value={data.overdue_count} />
              <KpiCard layout="bar" accent="teal" label={t("overdueEgp")} value={formatAmount(data.overdue_base)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("over90Egp")}
                value={formatAmount(data.over90_base)}
                caption={t("invoicesCount", { count: data.over90_count })}
              />
            </div>
            <FinanceAlert tone="warning">{t("collectionsExplainer")}</FinanceAlert>
            <FinanceTable
              caption={t("collectionsCaption")}
              columns={collectionColumns(t, formatDate)}
              rows={data.items}
              getRowId={(row) => row.id}
              empty={
                <p className="text-content-tertiary py-8 text-center text-sm">{t("nothingOverdue")}</p>
              }
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CollectionsPage }
