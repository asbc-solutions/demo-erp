"use client"

import * as React from "react"
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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useIssueCertificates } from "../../lib/mutations/tax"
import { useWithholding } from "../../lib/queries/tax"
import type { WithholdingRow } from "../../lib/types/tax"

const COLUMNS: FinanceColumn<WithholdingRow>[] = [
  { id: "bill", header: "Bill", cell: (row) => <DocNumber>{row.bill}</DocNumber> },
  { id: "supplier", header: "Supplier", cell: (row) => row.supplier },
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "gross", header: "Gross (EGP)", align: "end", cell: (row) => <Amount value={row.gross} /> },
  { id: "code", header: "Code", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
  { id: "rate", header: "Rate", align: "end", cell: (row) => `${row.rate}%` },
  { id: "amount", header: "Withheld (EGP)", align: "end", cell: (row) => <Amount value={row.amount} emphasis="strong" /> },
  {
    id: "status",
    header: "Status",
    cell: (row) => (row.status === "certified" ? <StatusPill status="accepted" label="certified" /> : <StatusPill status="pending" label="accrued" />),
  },
]

/** 07.02 · Withholding tax — tax withheld from supplier bills, and the certificates issued for it. */
function WithholdingPage() {
  const { data, isError, refetch } = useWithholding()
  const issue = useIssueCertificates()
  const [selected, setSelected] = React.useState<string[]>([])
  const accruedSelected = data?.items.filter((row) => selected.includes(row.id) && row.status === "accrued").length ?? 0

  return (
    <>
      <FinancePageHeader
        title="Withholding tax"
        figure={data ? <HeaderFigure label="Withheld this period (EGP)">{formatAmount(data.total)}</HeaderFigure> : null}
        actions={
          <Button
            variant="primary"
            disabled={!data || issue.isPending || (selected.length > 0 && accruedSelected === 0)}
            onClick={() =>
              issue.mutate(selected, {
                onSuccess: (result) => {
                  toast.success(`${result.issued} certificates issued to suppliers.`)
                  setSelected([])
                },
                onError: (error) => toast.error(errorMessage(error, "The certificates could not be issued. Try again.")),
              })
            }
          >
            {selected.length > 0 ? `Generate ${accruedSelected} certificates` : "Generate certificates"}
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
              <KpiCard layout="bar" accent="indigo" label="Total withheld (EGP)" value={formatAmount(data.total)} />
              <KpiCard layout="bar" accent="teal" label="Certified (EGP)" value={formatAmount(data.certified)} caption={`${data.certificates} certificates`} />
              <KpiCard layout="bar" accent="amber" label="Pending remittance (EGP)" value={formatAmount(data.pending)} caption="Due to ETA quarterly" />
            </div>
            <FinanceTable
              caption="Tax withheld from supplier bills"
              columns={COLUMNS.map((column) =>
                column.id === "bill" ? { ...column, footer: "Total" } : column.id === "amount" ? { ...column, footer: <Amount value={data.total} emphasis="strong" /> } : column,
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
