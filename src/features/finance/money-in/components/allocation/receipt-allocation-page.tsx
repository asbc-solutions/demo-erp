"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button } from "@/src/shared/components/ui/button"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { useFinanceContacts, useFinanceTreasuries } from "../../../lib/queries/master-data"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { usePostReceipt, useUnallocateReceipt } from "../../lib/mutations/receivables"
import { useOpenInvoices } from "../../lib/queries/receivables"
import { DueCell } from "../../../subledger/components/shared/aging-bucket-pill"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"
import type { PostedReceipt } from "../../lib/types/receivables"

const DEFAULT_TREASURY = "bnk-cib-0021"

function parseAmount(value: string): number {
  const amount = Number(value.replace(/,/g, ""))
  return Number.isFinite(amount) ? round2(amount) : 0
}

/**
 * 02.06 · Receipt allocation — record what came in and apply it to the
 * customer's open invoices, oldest first if asked. Posting moves the cash and
 * clears the invoices; anything left over stays on account as unallocated.
 */
function ReceiptAllocationPage({ initialCustomerId }: { initialCustomerId?: string }) {
  const { data: customers = [] } = useFinanceContacts("customer")
  const { data: treasuries = [] } = useFinanceTreasuries()
  const [customerId, setCustomerId] = React.useState(initialCustomerId ?? "C-0101")
  const [treasuryId, setTreasuryId] = React.useState(DEFAULT_TREASURY)
  const [amountText, setAmountText] = React.useState("")
  const [allocations, setAllocations] = React.useState<Record<string, string>>({})
  const [showErrors, setShowErrors] = React.useState(false)
  const [lastPosted, setLastPosted] = React.useState<PostedReceipt | null>(null)
  const [confirmUndo, setConfirmUndo] = React.useState(false)
  const { data: invoices = [], isPending: invoicesLoading } = useOpenInvoices(customerId)
  const postReceipt = usePostReceipt()
  const unallocate = useUnallocateReceipt()

  const customer = customers.find((row) => row.id === customerId)
  const currency = customer?.currency ?? "EGP"
  const receipt = parseAmount(amountText)
  const allocated = round2(
    invoices.reduce((sum, invoice) => sum + parseAmount(allocations[invoice.id] ?? ""), 0),
  )
  const unapplied = round2(receipt - allocated)
  const overLine = invoices.find(
    (invoice) => parseAmount(allocations[invoice.id] ?? "") > invoice.outstanding,
  )

  const error =
    receipt <= 0
      ? "Enter the receipt amount. The amount must be greater than zero. Type how much was received before posting."
      : allocated > receipt
        ? `The allocations total ${formatAmount(allocated)}, more than the receipt of ${formatAmount(receipt)}. Reduce an allocation or raise the receipt amount.`
        : overLine
          ? `${overLine.number} only has ${formatAmount(overLine.outstanding)} outstanding. Allocate no more than that, then post.`
          : null

  const changeCustomer = (id: string) => {
    setCustomerId(id)
    setAllocations({})
    setShowErrors(false)
  }

  const autoApply = () => {
    let remaining = receipt
    const next: Record<string, string> = {}
    for (const invoice of invoices) {
      if (remaining <= 0) break
      const share = round2(Math.min(remaining, invoice.outstanding))
      next[invoice.id] = share.toFixed(2)
      remaining = round2(remaining - share)
    }
    setAllocations(next)
  }

  const post = () => {
    setShowErrors(true)
    if (error) return
    postReceipt.mutate(
      {
        contact_id: customerId,
        treasury_id: treasuryId,
        amount: receipt,
        allocations: invoices
          .map((invoice) => ({ invoice_id: invoice.id, amount: parseAmount(allocations[invoice.id] ?? "") }))
          .filter((line) => line.amount > 0),
      },
      {
        onSuccess: (posted) => {
          setLastPosted(posted)
          setAmountText("")
          setAllocations({})
          setShowErrors(false)
          toast.success(
            posted.unapplied > 0
              ? `${posted.number} posted. ${formatAmount(posted.unapplied)} ${posted.currency} stays on account.`
              : `${posted.number} posted and fully applied.`,
          )
        },
        onError: () => toast.error("The receipt could not be posted. Try again."),
      },
    )
  }

  const columns: FinanceColumn<SubledgerDocument>[] = [
    { id: "invoice", header: "Invoice", cell: (row) => <DocNumber>{row.number}</DocNumber> },
    {
      id: "due",
      header: "Due",
      cell: (row) => (row.due_date ? <DueCell date={formatDate(row.due_date)} daysLate={row.days_late} /> : "—"),
    },
    {
      id: "outstanding",
      header: `Outstanding (${currency})`,
      align: "end",
      cell: (row) => <Amount value={row.outstanding} />,
    },
    {
      id: "allocate",
      header: `Allocate (${currency})`,
      align: "end",
      width: "w-44",
      cell: (row) => (
        <Input
          aria-label={`Allocate to ${row.number}`}
          inputMode="decimal"
          placeholder="0.00"
          value={allocations[row.id] ?? ""}
          aria-invalid={parseAmount(allocations[row.id] ?? "") > row.outstanding}
          onChange={(event) => setAllocations((current) => ({ ...current, [row.id]: event.target.value }))}
          className="ms-auto h-8 w-36 text-end tabular-nums"
        />
      ),
    },
  ]

  return (
    <>
      <FinancePageHeader
        title="Receipt allocation"
        actions={
          <Button variant="primary" disabled={postReceipt.isPending} onClick={post}>
            Post receipt
          </Button>
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-64">
            <FieldLabel htmlFor="allocation-customer">Customer</FieldLabel>
            <Select value={customerId} onValueChange={changeCustomer}>
              <SelectTrigger id="allocation-customer" className="h-9">
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-72">
            <FieldLabel htmlFor="allocation-treasury">Into treasury</FieldLabel>
            <Select value={treasuryId} onValueChange={setTreasuryId}>
              <SelectTrigger id="allocation-treasury" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treasuries.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-56">
            <FieldLabel htmlFor="allocation-amount">Receipt amount ({currency})</FieldLabel>
            <Input
              id="allocation-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountText}
              aria-invalid={showErrors && receipt <= 0}
              onChange={(event) => setAmountText(event.target.value)}
              className="h-9 text-end tabular-nums"
            />
          </Field>
        </div>

        {showErrors && error ? <FinanceAlert tone="danger">{error}</FinanceAlert> : null}

        {lastPosted ? (
          <FinanceAlert
            tone="success"
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/finance/ar/${lastPosted.contact_id}`}>Open customer</Link>
              </Button>
            }
          >
            {lastPosted.number} posted into {lastPosted.treasury_name}.{" "}
            {lastPosted.unapplied > 0
              ? `${formatAmount(lastPosted.unapplied)} ${lastPosted.currency} is unapplied and stays on account.`
              : "It is fully applied."}
          </FinanceAlert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
          <KpiCard layout="bar" accent="indigo" label={`Receipt (${currency})`} value={formatAmount(receipt)} />
          <KpiCard layout="bar" accent="teal" label={`Allocated (${currency})`} value={formatAmount(allocated)} />
          <KpiCard
            layout="bar"
            accent="amber"
            label={`Unapplied (${currency})`}
            value={formatAmount(unapplied)}
            caption={
              receipt <= 0
                ? "Enter a receipt"
                : unapplied === 0
                  ? "Fully applied"
                  : unapplied > 0
                    ? "Stays on account"
                    : "Over-allocated"
            }
          />
        </div>

        <FinanceSection
          title="Open invoices"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!lastPosted || unallocate.isPending}
                onClick={() => setConfirmUndo(true)}
              >
                Unallocate
              </Button>
              <Button variant="secondary" size="sm" disabled={receipt <= 0} onClick={autoApply}>
                Auto-apply oldest first
              </Button>
            </div>
          }
        >
          <FinanceTable
            caption={`Open invoices for ${customer?.name ?? "the customer"}`}
            columns={columns}
            rows={invoices}
            loading={invoicesLoading}
            getRowId={(row) => row.id}
            empty={
              <p className="text-content-tertiary py-8 text-center text-sm">
                This customer has no open invoices. A receipt posted now stays on account.
              </p>
            }
          />
        </FinanceSection>
      </FinancePageBody>

      <AlertDialog open={confirmUndo} onOpenChange={setConfirmUndo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              The receipt returns to the unallocated pool and the invoices go back to their previous
              outstanding amounts. No cash moves. The change is recorded against both documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!lastPosted) return
                unallocate.mutate(lastPosted.id, {
                  onSuccess: () => {
                    toast.success(`${lastPosted.number} is unallocated and back in the pool.`)
                    setLastPosted(null)
                  },
                  onError: () => toast.error("The allocation could not be undone. Try again."),
                })
              }}
            >
              Unallocate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { ReceiptAllocationPage }
