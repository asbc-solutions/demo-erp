"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useIssueCertificates } from "../../lib/mutations/tax"
import { useWithholding } from "../../lib/queries/tax"
import type { TaxTranslator, WithholdingRow } from "../../lib/types/tax"

function buildColumns(t: TaxTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<WithholdingRow>[] {
  return [
    { id: "bill", header: t("bill"), cell: (row) => <DocNumber>{row.bill}</DocNumber> },
    { id: "supplier", header: t("supplier"), cell: (row) => row.supplier },
    { id: "date", header: t("date"), cell: (row) => formatDate(row.date) },
    { id: "gross", header: t("grossEgp"), align: "end", cell: (row) => <Amount value={row.gross} /> },
    { id: "code", header: t("code"), cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "rate", header: t("rate"), align: "end", cell: (row) => `${row.rate}%` },
    { id: "amount", header: t("withheldEgp"), align: "end", cell: (row) => <Amount value={row.amount} emphasis="strong" /> },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (row.status === "certified" ? <StatusPill status="accepted" label={t("whtCertified")} /> : <StatusPill status="pending" label={t("whtAccrued")} />),
    },
  ]
}

/** 07.02 · Withholding tax — tax withheld from supplier bills, and the certificates issued for it. */
function WithholdingPage() {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const { data, isError, refetch } = useWithholding()
  const issue = useIssueCertificates()
  const [selected, setSelected] = React.useState<string[]>([])
  const accruedSelected = data?.items.filter((row) => selected.includes(row.id) && row.status === "accrued").length ?? 0

  return (
    <>
      <FinancePageHeader
        title={t("withholdingTax")}
        figure={data ? <HeaderFigure label={t("withheldThisPeriodEgp")}>{formatAmount(data.total)}</HeaderFigure> : null}
        actions={
          <Button
            variant="primary"
            disabled={!data || issue.isPending || (selected.length > 0 && accruedSelected === 0)}
            onClick={() =>
              issue.mutate(selected, {
                onSuccess: (result) => {
                  toast.success(t("toastCertificatesIssued", { count: result.issued }))
                  setSelected([])
                },
                onError: (error) => toast.error(errorMessage(error, t("errorIssueCertificates"))),
              })
            }
          >
            {selected.length > 0 ? t("generateCountCertificates", { count: accruedSelected }) : t("generateCertificates")}
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
              <KpiCard layout="bar" accent="indigo" label={t("totalWithheldEgp")} value={formatAmount(data.total)} />
              <KpiCard layout="bar" accent="teal" label={t("certifiedEgp")} value={formatAmount(data.certified)} caption={t("certificatesCount", { count: data.certificates })} />
              <KpiCard layout="bar" accent="amber" label={t("pendingRemittanceEgp")} value={formatAmount(data.pending)} caption={t("dueToEtaQuarterly")} />
            </div>
            <FinanceTable
              caption={t("withheldCaption")}
              columns={columns.map((column) =>
                column.id === "bill" ? { ...column, footer: t("total") } : column.id === "amount" ? { ...column, footer: <Amount value={data.total} emphasis="strong" /> } : column,
              )}
              rows={data.items}
              getRowId={(row) => row.id}
              selectable
              selectedIds={selected}
              onSelectedIdsChange={setSelected}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { WithholdingPage }
