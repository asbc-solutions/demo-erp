"use client"

import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { useNumbering } from "../../lib/queries/configuration"
import type { NumberingRow } from "../../lib/types/configuration"

const COLUMNS: FinanceColumn<NumberingRow>[] = [
  { id: "document", header: "Document", cell: (row) => <span className="text-content-primary font-medium">{row.document}</span> },
  { id: "format", header: "Format", cell: (row) => <span className="font-mono text-xs">{row.format}</span> },
  { id: "count", header: "Issued", align: "end", cell: (row) => <span className="tabular-nums">{row.count.toLocaleString("en-US")}</span> },
  { id: "next", header: "Next number", align: "end", cell: (row) => <span className="text-content-primary font-mono text-xs">{row.next}</span> },
]

/** 11.07 · Document numbering — one sequence per document type, read from the numbers in use. */
function NumberingPage() {
  const { data, isError, refetch } = useNumbering()
  return (
    <>
      <FinancePageHeader title="Numbering" figure={data ? <HeaderFigure label="Sequences">{data.length}</HeaderFigure> : null} />
      <FinancePageBody>
        <p className="text-content-secondary max-w-3xl text-[13px] leading-5">
          Each document type draws from its own sequence. Numbers are assigned on posting and never reused, so gaps are auditable
          rather than silently filled.
        </p>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <FinanceTable caption="Document numbering" columns={COLUMNS} rows={data} getRowId={(row) => row.id} />
        )}
      </FinancePageBody>
    </>
  )
}

export { NumberingPage }
