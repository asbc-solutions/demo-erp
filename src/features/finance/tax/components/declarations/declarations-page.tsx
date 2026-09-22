"use client"

import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { useFileDeclaration } from "../../lib/mutations/tax"
import { useDeclarations } from "../../lib/queries/tax"
import type { Declaration } from "../../lib/types/tax"

const STATUS_TONE: Record<Declaration["status"], "success" | "warning" | "danger" | "info"> = {
  filed: "success",
  due: "warning",
  overdue: "danger",
  upcoming: "info",
}

function FileButton({ row }: { row: Declaration }) {
  const file = useFileDeclaration()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={file.isPending}
      onClick={() =>
        file.mutate(row.id, {
          onSuccess: () => toast.success(`${row.name} for ${row.period} is recorded as filed.`),
          onError: (error) => toast.error(errorMessage(error, "The declaration could not be recorded. Try again.")),
        })
      }
    >
      Mark filed
    </Button>
  )
}

const COLUMNS: FinanceColumn<Declaration>[] = [
  { id: "name", header: "Declaration", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "authority", header: "Authority", cell: (row) => row.authority },
  { id: "period", header: "Period", cell: (row) => row.period },
  { id: "due", header: "Due", cell: (row) => formatDate(row.due) },
  { id: "in", header: "In", align: "end", cell: (row) => (row.days === null ? "—" : `${row.days}d`) },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={`declaration-${row.status}`} label={row.status} tone={STATUS_TONE[row.status]} /> },
  {
    id: "action",
    header: <span className="sr-only">Action</span>,
    align: "end",
    cell: (row) =>
      row.href ? (
        <Button variant="ghost" size="sm" asChild>
          <Link href={row.href}>Open</Link>
        </Button>
      ) : row.can_file ? (
        <FileButton row={row} />
      ) : null,
  },
]

/** 07.07 · Tax declarations — every return the entity owes, by due date. */
function DeclarationsPage() {
  const { data, isError, refetch } = useDeclarations()
  return (
    <>
      <FinancePageHeader title="Tax declarations" figure={data ? <HeaderFigure label="Due now">{data.due_now}</HeaderFigure> : null} />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="danger" label="Due now" value={data.due_now} />
              <KpiCard layout="bar" accent="success" label="Filed this quarter" value={data.filed_quarter} />
              <KpiCard layout="bar" accent="indigo" label="Upcoming" value={data.upcoming} />
            </div>
            <FinanceAlert tone="info">
              Declarations due within the current window are highlighted. Filing a return locks its period figures and records the
              submission reference for the audit trail, so review the worksheet before you submit.
            </FinanceAlert>
            <FinanceTable caption="Tax declarations" columns={COLUMNS} rows={data.items} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { DeclarationsPage }
