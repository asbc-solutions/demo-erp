"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import type { FinanceTreasury } from "../../../lib/types/common"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { AgingBucketPill } from "../../../subledger/components/shared/aging-bucket-pill"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"
import { usePostPaymentRun } from "../../lib/mutations/payables"
import { usePaymentRunCandidates } from "../../lib/queries/payables"
import type { PaymentRunResult } from "../../lib/types/payables"

/** The run pays from the main operating account unless another is chosen. */
const DEFAULT_TREASURY_ID = "bnk-cib-0021"

const COLUMNS: FinanceColumn<SubledgerDocument>[] = [
  { id: "bill", header: "Bill", cell: (row) => <DocNumber>{row.number}</DocNumber>, footer: "Selected" },
  { id: "supplier", header: "Supplier", cell: (row) => row.contact_name },
  { id: "due", header: "Due", cell: (row) => (row.due_date ? formatDate(row.due_date) : "—") },
  { id: "aging", header: "Aging", cell: (row) => <AgingBucketPill bucket={row.bucket} /> },
  {
    id: "outstanding",
    header: "Outstanding (EGP)",
    align: "end",
    cell: (row) => <Amount value={row.outstanding_base} />,
  },
]

function PostingPreview({
  payablesAccount,
  treasury,
  total,
}: {
  payablesAccount: string
  treasury: FinanceTreasury | undefined
  total: number
}) {
  return (
    <FinanceSection title="Posting preview">
      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="align-top">
                <span className="flex flex-col">
                  <span className="font-mono">{payablesAccount}</span>
                  <span className="text-content-secondary">Trade payables</span>
                </span>
              </TableCell>
              <TableCell className="align-top">
                <span className="flex flex-col">
                  <span className="font-mono">{treasury?.account_code ?? "—"}</span>
                  <span className="text-content-secondary">{treasury?.name ?? "Choose a treasury"}</span>
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-end">
                <Amount value={total} emphasis="strong" />
              </TableCell>
              <TableCell className="text-end">
                <Amount value={total} emphasis="strong" />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className="text-content-tertiary text-xs leading-4">
        One payment voucher is created per supplier. The entry posts to the open period when you post the run.
      </p>
    </FinanceSection>
  )
}

function RunPosted({ result, onAnother }: { result: PaymentRunResult; onAnother: () => void }) {
  return (
    <FinanceAlert
      tone="success"
      className="text-status-success-fg"
      action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onAnother}>
            Start another run
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/finance/journals">View journal</Link>
          </Button>
        </div>
      }
    >
      The payment run posted successfully. It paid {result.bill_count} bill(s) totalling{" "}
      {formatAmount(result.total_base)} EGP from {result.treasury_name}. The entry is now on the ledger
      and reduced the treasury balance.
    </FinanceAlert>
  )
}

/**
 * 03.09 · Payment runs — pay approved bills in one batch from one treasury.
 * `supplierId` (from a supplier card's "Pay") preselects only that supplier.
 */
function PaymentRunPage({ supplierId }: { supplierId?: string }) {
  const { data, isError, refetch } = usePaymentRunCandidates()
  const { data: treasuries = [] } = useFinanceTreasuries()
  const postRun = usePostPaymentRun()
  const [treasuryId, setTreasuryId] = React.useState(DEFAULT_TREASURY_ID)
  const [selection, setSelection] = React.useState<string[] | null>(null)
  const [result, setResult] = React.useState<PaymentRunResult | null>(null)

  const items = React.useMemo(() => data?.items ?? [], [data])
  // Until the user changes it, the selection is every candidate (or one supplier's).
  const selectedIds =
    selection ??
    items.filter((bill) => !supplierId || bill.contact_id === supplierId).map((bill) => bill.id)
  const selected = items.filter((bill) => selectedIds.includes(bill.id))
  const total = round2(selected.reduce((sum, bill) => sum + bill.outstanding_base, 0))
  const suppliers = new Set(selected.map((bill) => bill.contact_id)).size

  const treasury = treasuries.find((row) => row.id === treasuryId)
  // Bills are in EGP and the run pays from EGP treasuries only, so no conversion is needed.
  const short = treasury ? total > treasury.balance : false
  const canPost = selected.length > 0 && Boolean(treasury) && !short && !postRun.isPending

  const post = () =>
    postRun.mutate(
      { treasury_id: treasuryId, bill_ids: selectedIds },
      {
        onSuccess: (run) => {
          setResult(run)
          setSelection(null)
        },
        onError: (error) => toast.error(errorMessage(error, "The payment run could not be posted. Try again.")),
      },
    )

  return (
    <>
      <FinancePageHeader
        title="Payment run"
        figure={
          data && !result ? <HeaderFigure label="Selected total (EGP)">{formatAmount(total)}</HeaderFigure> : null
        }
        actions={
          result ? null : (
            <Button variant="primary" disabled={!canPost} onClick={post}>
              {postRun.isPending ? "Posting…" : "Post payment run"}
            </Button>
          )
        }
      />
      <FinancePageBody>
        {result ? (
          <RunPosted result={result} onAnother={() => setResult(null)} />
        ) : isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading bills to pay" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard
                  layout="bar"
                  accent="indigo"
                  label="Bills selected"
                  value={`${selected.length} / ${items.length}`}
                />
                <KpiCard layout="bar" accent="teal" label="Run total (EGP)" value={formatAmount(total)} />
                <KpiCard layout="bar" accent="amber" label="Suppliers" value={suppliers} />
              </div>

              <Field className="max-w-sm">
                <FieldLabel htmlFor="payment-run-treasury">Pay from treasury</FieldLabel>
                <Select value={treasuryId} onValueChange={setTreasuryId}>
                  <SelectTrigger id="payment-run-treasury" className="h-9" aria-invalid={short}>
                    <SelectValue placeholder="Choose a treasury" />
                  </SelectTrigger>
                  <SelectContent>
                    {treasuries.map((row) => (
                      <SelectItem key={row.id} value={row.id} disabled={row.currency !== "EGP"}>
                        {row.name} ({row.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {treasury ? (
                  <FieldDescription>
                    Available {formatAmount(treasury.balance)} {treasury.currency}. Bills are in EGP, so the
                    run pays from EGP accounts only.
                  </FieldDescription>
                ) : null}
              </Field>

              {short && treasury ? (
                <FinanceAlert tone="danger">
                  {treasury.name} holds {formatAmount(treasury.balance)} EGP, and this run needs{" "}
                  {formatAmount(total)} EGP. Choose another treasury or clear some bills from the run.
                </FinanceAlert>
              ) : null}

              {items.length === 0 ? (
                <FinanceAlert tone="info">
                  No approved bills are waiting to be paid. Bills join the next run once they are approved.
                </FinanceAlert>
              ) : (
                <FinanceTable
                  caption="Approved bills to pay"
                  columns={COLUMNS.map((column) =>
                    column.id === "outstanding"
                      ? { ...column, footer: <Amount value={total} emphasis="strong" /> }
                      : column,
                  )}
                  rows={items}
                  getRowId={(row) => row.id}
                  selectable
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelection}
                />
              )}
            </div>

            <PostingPreview payablesAccount={data.payables_account} treasury={treasury} total={total} />
          </div>
        )}
      </FinancePageBody>
    </>
  )
}

export { PaymentRunPage }
