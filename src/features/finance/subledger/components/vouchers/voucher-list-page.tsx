"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
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
import { VoucherDialog } from "../../../components/shared/voucher-dialog"
import { useFinanceContacts, useFinanceTreasuries } from "../../../lib/queries/master-data"
import { formatDate, formatPeriod } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useCreateVoucher } from "../../lib/mutations/subledger"
import { useVouchers } from "../../lib/queries/subledger"
import type { Side, Voucher } from "../../lib/types/subledger"

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "treasury", label: "Treasury" },
  { value: "month", label: "Month" },
]

function voucherColumns(side: Side): FinanceColumn<Voucher>[] {
  return [
    { id: "number", header: "Voucher no.", cell: (row) => <DocNumber>{row.number}</DocNumber> },
    { id: "date", header: "Date", hideable: true, cell: (row) => formatDate(row.date) },
    {
      id: "description",
      header: "Description",
      hideable: true,
      cell: (row) => <span className="block max-w-72 truncate">{row.description}</span>,
    },
    {
      id: "treasury",
      header: SUBLEDGER_SIDES[side].vouchers.treasury,
      hideable: true,
      cell: (row) => row.treasury_name,
    },
    {
      id: "origin",
      header: "Origin",
      hideable: true,
      cell: (row) => (
        <StatusPill
          status={row.origin}
          label={row.origin === "auto" ? "Auto" : "Manual"}
          tone={row.origin === "auto" ? "info" : "neutral"}
        />
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "end",
      cell: (row) => <Amount value={row.amount} currency={row.currency} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          <StatusPill status={row.status} />
          {row.allocation === "unallocated" ? <StatusPill status="unallocated" /> : null}
        </span>
      ),
    },
  ]
}

/**
 * 02.04 · Receipts and 03.04 · Payments, with the voucher detail (02.05 /
 * 03.05) as a dialog over the list.
 */
function VoucherListPage({ side, newVoucher = false }: { side: Side; newVoucher?: boolean }) {
  const router = useRouter()
  const config = SUBLEDGER_SIDES[side]
  const { data, isError, refetch } = useVouchers(side)
  const { data: contacts = [] } = useFinanceContacts(config.contactKind)
  const { data: treasuries = [] } = useFinanceTreasuries()
  const createVoucher = useCreateVoucher(side)
  const [dialogOpen, setDialogOpen] = React.useState(newVoucher)
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  const columns = React.useMemo(() => voucherColumns(side), [side])

  const setOpen = (open: boolean) => {
    setDialogOpen(open)
    // The voucher has its own URL; closing it returns to the list.
    if (!open && newVoucher) router.replace(config.href.vouchers)
  }

  const groups: FinanceTableGroup<Voucher>[] | undefined = React.useMemo(() => {
    if (!data || groupBy === "none") return undefined
    const keyOf = (row: Voucher) => (groupBy === "treasury" ? row.treasury_name : row.date.slice(0, 7))
    return Array.from(new Set(data.items.map(keyOf))).map((key) => {
      const rows = data.items.filter((row) => keyOf(row) === key)
      return {
        id: key,
        label: groupBy === "month" ? formatPeriod(key) : key,
        rows,
        summary: {
          amount: (
            <Amount value={rows.reduce((sum, row) => sum + row.amount_base, 0)} currency="EGP" emphasis="strong" />
          ),
        },
      }
    })
  }, [data, groupBy])

  return (
    <>
      <FinancePageHeader
        title={config.vouchers.title}
        figure={
          data ? <HeaderFigure label={config.vouchers.figure}>{formatAmount(data.total_base)}</HeaderFigure> : null
        }
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus aria-hidden />
            {config.vouchers.newLabel}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={`Loading ${config.vouchers.title.toLowerCase()}`} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Vouchers" value={data.count} />
              <KpiCard layout="bar" accent="teal" label="Total (EGP)" value={formatAmount(data.total_base)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Average (EGP)"
                value={formatAmount(data.average_base)}
                caption={data.unallocated_count > 0 ? `${data.unallocated_count} not yet allocated` : undefined}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS} />
                <ColumnChooser
                  columns={columns
                    .filter((column) => column.hideable)
                    .map((column) => ({ id: column.id, label: columnLabel(column) }))}
                  hiddenIds={hiddenIds}
                  onHiddenIdsChange={setHiddenIds}
                />
              </div>
              <FinanceTable
                caption={config.vouchers.caption}
                columns={columns}
                rows={data.items}
                groups={groups}
                getRowId={(row) => row.id}
                hiddenColumnIds={hiddenIds}
              />
            </div>
          </>
        )}
      </FinancePageBody>

      <VoucherDialog
        kind={side === "receivable" ? "receipt" : "payment"}
        open={dialogOpen}
        onOpenChange={setOpen}
        contacts={contacts}
        treasuries={treasuries}
        pending={createVoucher.isPending}
        onSubmit={(values) =>
          createVoucher.mutate(
            {
              contact_id: values.contact_id,
              treasury_id: values.treasury_id,
              amount: Number(values.amount),
              date: values.date,
              description: values.description,
            },
            {
              onSuccess: (voucher) => {
                toast.success(`${voucher.number} was saved as a draft.`)
                setOpen(false)
              },
              onError: () => toast.error(`The ${config.vouchers.noun} could not be saved. Try again.`),
            },
          )
        }
      />
    </>
  )
}

export { VoucherListPage }
