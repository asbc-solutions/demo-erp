"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinanceTable,
  columnLabel,
  type FinanceColumn,
  type FinanceTableGroup,
} from "../../../components/shared/finance-table"
import { ColumnChooser, GroupBySelect } from "../../../components/shared/filter-bar"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useChequeBooks, useCheques } from "../../lib/queries/banking"
import type { Cheque, ChequeDirection } from "../../lib/types/banking"
import { CHEQUE_COPY, ChequeDialog } from "./cheque-dialog"

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "party", label: "Customer or supplier" },
]

const REGISTER_COPY = {
  received: { title: "Cheques received", problems: "Bounced / returned", href: "/finance/cheques/received" },
  issued: { title: "Cheques issued", problems: "Bounced / cancelled", href: "/finance/cheques/issued" },
} as const

function chequeColumns(direction: ChequeDirection): FinanceColumn<Cheque>[] {
  return [
    {
      id: "number",
      header: "Cheque no.",
      cell: (row) => (
        <Link href={`${REGISTER_COPY[direction].href}/${row.id}`} className="hover:underline">
          <DocNumber>{row.number}</DocNumber>
        </Link>
      ),
    },
    { id: "party", header: CHEQUE_COPY[direction].party, cell: (row) => row.party_name },
    { id: "bank", header: "Bank", hideable: true, cell: (row) => row.bank },
    { id: "issued", header: "Issued", hideable: true, cell: (row) => formatDate(row.issue_date) },
    {
      id: "due",
      header: "Due",
      cell: (row) => (
        <span className="whitespace-nowrap">
          {formatDate(row.due_date)}
          {row.due_soon && row.days_to_due !== null ? (
            <span className="text-status-warning-fg"> · {row.days_to_due}d</span>
          ) : null}
        </span>
      ),
    },
    { id: "amount", header: "Amount", align: "end", cell: (row) => <Amount value={row.amount} currency={row.currency} /> },
    { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/**
 * 04.10 · Cheques received and 04.11 · Cheques issued, with 04.02 (record /
 * write cheque) as a dialog over the register.
 */
function ChequeRegisterPage({ direction, newCheque = false }: { direction: ChequeDirection; newCheque?: boolean }) {
  const router = useRouter()
  const copy = REGISTER_COPY[direction]
  const { data, isError, refetch } = useCheques(direction)
  const { data: books } = useChequeBooks()
  const [dialogOpen, setDialogOpen] = React.useState(newCheque)
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  const columns = React.useMemo(() => chequeColumns(direction), [direction])
  const nextNumber = books?.find((book) => book.direction === "issued" && book.next_number !== null)?.next_number

  const setOpen = (open: boolean) => {
    setDialogOpen(open)
    if (!open && newCheque) router.replace(copy.href)
  }

  const groups: FinanceTableGroup<Cheque>[] | undefined = React.useMemo(() => {
    if (!data || groupBy === "none") return undefined
    const keyOf = (row: Cheque) => (groupBy === "status" ? row.status : row.party_name)
    return Array.from(new Set(data.items.map(keyOf))).map((key) => {
      const rows = data.items.filter((row) => keyOf(row) === key)
      return {
        id: key,
        label: groupBy === "status" ? key.replace(/_/g, " ") : key,
        rows,
        summary: {
          amount: <Amount value={rows.reduce((sum, row) => sum + row.amount, 0)} currency="EGP" emphasis="strong" />,
        },
      }
    })
  }, [data, groupBy])

  return (
    <>
      <FinancePageHeader
        title={copy.title}
        figure={data ? <HeaderFigure label="In register (EGP)">{formatAmount(data.total_base)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus aria-hidden />
            {CHEQUE_COPY[direction].title}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={`Loading ${copy.title.toLowerCase()}`} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Cheques in register" value={data.count} />
              <KpiCard
                layout="bar"
                accent="teal"
                label="Due within 14 days"
                value={data.due_soon}
                caption={direction === "received" ? "Present or collect" : "Keep the funds ready"}
              />
              <KpiCard layout="bar" accent="amber" label={copy.problems} value={data.problems} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS} />
                <ColumnChooser
                  columns={columns.filter((column) => column.hideable).map((column) => ({ id: column.id, label: columnLabel(column) }))}
                  hiddenIds={hiddenIds}
                  onHiddenIdsChange={setHiddenIds}
                />
              </div>
              <FinanceTable
                caption={copy.title}
                columns={columns.map((column) =>
                  column.id === "number"
                    ? { ...column, footer: "Total" }
                    : column.id === "amount"
                      ? { ...column, footer: <Amount value={data.total_base} currency="EGP" emphasis="strong" /> }
                      : column,
                )}
                rows={data.items}
                groups={groups}
                getRowId={(row) => row.id}
                hiddenColumnIds={hiddenIds}
                onRowClick={(row) => router.push(`${copy.href}/${row.id}`)}
              />
            </div>
            <FinanceAlert tone="info">
              Cheques post to their treasury automatically as they clear. To see the linked journal, open the
              cheque and follow the source link.
            </FinanceAlert>
          </>
        )}
      </FinancePageBody>
      <ChequeDialog direction={direction} open={dialogOpen} onOpenChange={setOpen} nextNumber={nextNumber} />
    </>
  )
}

export { ChequeRegisterPage }
