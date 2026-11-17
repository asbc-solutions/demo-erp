"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/src/i18n/navigation"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useFileDeclaration } from "../../lib/mutations/tax"
import { useDeclarations } from "../../lib/queries/tax"
import type { Declaration, TaxTranslator } from "../../lib/types/tax"

const STATUS_TONE: Record<Declaration["status"], "success" | "warning" | "danger" | "info"> = {
  filed: "success",
  due: "warning",
  overdue: "danger",
  upcoming: "info",
}

function FileButton({ row }: { row: Declaration }) {
  const t = useTranslations("FinanceTax")
  const file = useFileDeclaration()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={file.isPending}
      onClick={() =>
        file.mutate(row.id, {
          onSuccess: () => toast.success(t("toastDeclarationFiled", { name: row.name, period: row.period })),
          onError: (error) => toast.error(errorMessage(error, t("errorFileDeclaration"))),
        })
      }
    >
      {t("markFiled")}
    </Button>
  )
}

function buildColumns(t: TaxTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Declaration>[] {
  return [
    { id: "name", header: t("declaration"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "authority", header: t("authority"), cell: (row) => row.authority },
    { id: "period", header: t("period"), cell: (row) => row.period },
    { id: "due", header: t("due"), cell: (row) => formatDate(row.due) },
    { id: "in", header: t("in"), align: "end", cell: (row) => (row.days === null ? "—" : t("daysShort", { days: row.days })) },
    { id: "status", header: t("status"), cell: (row) => <StatusPill status={`declaration-${row.status}`} label={t(`declarationStatus.${row.status}`)} tone={STATUS_TONE[row.status]} /> },
    {
      id: "action",
      header: <span className="sr-only">{t("action")}</span>,
      align: "end",
      cell: (row) =>
        row.href ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={row.href}>{t("open")}</Link>
          </Button>
        ) : row.can_file ? (
          <FileButton row={row} />
        ) : null,
    },
  ]
}

/** 07.07 · Tax declarations — every return the entity owes, by due date. */
function DeclarationsPage() {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const { data, isError, refetch } = useDeclarations()
  return (
    <>
      <FinancePageHeader title={t("taxDeclarations")} figure={data ? <HeaderFigure label={t("dueNow")}>{data.due_now}</HeaderFigure> : null} />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="danger" label={t("dueNow")} value={data.due_now} />
              <KpiCard layout="bar" accent="success" label={t("filedThisQuarter")} value={data.filed_quarter} />
              <KpiCard layout="bar" accent="indigo" label={t("upcoming")} value={data.upcoming} />
            </div>
            <FinanceAlert tone="info">
              {t("declarationsInfo")}
            </FinanceAlert>
            <FinanceTable caption={t("taxDeclarations")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { DeclarationsPage }
