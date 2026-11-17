"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
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
  const t = useTranslations("FinanceMoneyIn")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
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
      ? t("errorReceiptAmount")
      : allocated > receipt
        ? t("errorOverAllocated", { allocated: formatAmount(allocated), receipt: formatAmount(receipt) })
        : overLine
          ? t("errorLineOver", { number: overLine.number, outstanding: formatAmount(overLine.outstanding) })
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
              ? t("postedOnAccount", {
                  number: posted.number,
                  amount: formatAmount(posted.unapplied),
                  currency: posted.currency,
                })
              : t("postedFullyApplied", { number: posted.number }),
          )
        },
        onError: () => toast.error(t("postFailed")),
      },
    )
  }

  const columns: FinanceColumn<SubledgerDocument>[] = [
    { id: "invoice", header: t("colInvoice"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
    {
      id: "due",
      header: t("colDue"),
      cell: (row) => (row.due_date ? <DueCell date={formatDate(row.due_date)} daysLate={row.days_late} /> : "—"),
    },
    {
      id: "outstanding",
      header: t("colOutstandingIn", { currency }),
      align: "end",
      cell: (row) => <Amount value={row.outstanding} />,
    },
    {
      id: "allocate",
      header: t("colAllocateIn", { currency }),
      align: "end",
      width: "w-44",
      cell: (row) => (
        <Input
          aria-label={t("allocateTo", { number: row.number })}
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
        title={t("allocationTitle")}
        actions={
          <Button variant="primary" disabled={postReceipt.isPending} onClick={post}>
            {t("postReceipt")}
          </Button>
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-64">
            <FieldLabel htmlFor="allocation-customer">{t("colCustomer")}</FieldLabel>
            <Select value={customerId} onValueChange={changeCustomer}>
              <SelectTrigger id="allocation-customer" className="h-9">
                <SelectValue placeholder={t("chooseCustomer")} />
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
            <FieldLabel htmlFor="allocation-treasury">{t("intoTreasury")}</FieldLabel>
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
            <FieldLabel htmlFor="allocation-amount">{t("receiptAmountIn", { currency })}</FieldLabel>
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
                <Link href={`/finance/ar/${lastPosted.contact_id}`}>{t("openCustomer")}</Link>
              </Button>
            }
          >
            {lastPosted.unapplied > 0
              ? t("postedIntoUnapplied", {
                  number: lastPosted.number,
                  treasury: lastPosted.treasury_name,
                  amount: formatAmount(lastPosted.unapplied),
                  currency: lastPosted.currency,
                })
              : t("postedIntoApplied", { number: lastPosted.number, treasury: lastPosted.treasury_name })}
          </FinanceAlert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
          <KpiCard layout="bar" accent="indigo" label={t("receiptIn", { currency })} value={formatAmount(receipt)} />
          <KpiCard layout="bar" accent="teal" label={t("allocatedIn", { currency })} value={formatAmount(allocated)} />
          <KpiCard
            layout="bar"
            accent="amber"
            label={t("unappliedIn", { currency })}
            value={formatAmount(unapplied)}
            caption={
              receipt <= 0
                ? t("enterReceipt")
                : unapplied === 0
                  ? t("fullyApplied")
                  : unapplied > 0
                    ? t("staysOnAccount")
                    : t("overAllocated")
            }
          />
        </div>

        <FinanceSection
          title={t("openInvoices")}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!lastPosted || unallocate.isPending}
                onClick={() => setConfirmUndo(true)}
              >
                {t("unallocate")}
              </Button>
              <Button variant="secondary" size="sm" disabled={receipt <= 0} onClick={autoApply}>
                {t("autoApply")}
              </Button>
            </div>
          }
        >
          <FinanceTable
            caption={t("openInvoicesFor", { name: customer?.name ?? t("theCustomer") })}
            columns={columns}
            rows={invoices}
            loading={invoicesLoading}
            getRowId={(row) => row.id}
            empty={
              <p className="text-content-tertiary py-8 text-center text-sm">{t("noOpenInvoices")}</p>
            }
          />
        </FinanceSection>
      </FinancePageBody>

      <AlertDialog open={confirmUndo} onOpenChange={setConfirmUndo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("undoTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("undoDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!lastPosted) return
                unallocate.mutate(lastPosted.id, {
                  onSuccess: () => {
                    toast.success(t("unallocated", { number: lastPosted.number }))
                    setLastPosted(null)
                  },
                  onError: () => toast.error(t("undoFailed")),
                })
              }}
            >
              {t("unallocate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { ReceiptAllocationPage }
