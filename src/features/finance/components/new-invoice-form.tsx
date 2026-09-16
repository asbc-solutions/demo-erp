"use client"

import * as React from "react"
import {
  ArrowLeft,
  Calendar,
  Calculator,
  FileText,
  Hash,
  Loader2,
  Plus,
  Save,
  Send,
  StickyNote,
  Trash2,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { useCreateFinanceInvoice } from "../lib/mutations/invoices"
import type { SaveFinanceInvoicePayload } from "../lib/types"
import { formatCurrency } from "../lib/utils/currency"
import { toastMutationError } from "./shared/finance-error-state"

type LineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

function SectionHeader({
  icon,
  children,
  trailing,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pb-4">
      <div className="flex items-center gap-2">
        <span className="text-brand-primary [&_svg]:size-4">{icon}</span>
        <span className="text-[12px] leading-[18px] font-medium tracking-[0.6px] text-content-tertiary uppercase">
          {children}
        </span>
      </div>
      {trailing}
    </div>
  )
}

const MAX_LINES = 20

export function NewInvoiceForm({ onClose }: { onClose: () => void }) {
  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [issueDate, setIssueDate] = React.useState("2026-08-10")
  const [dueDate, setDueDate] = React.useState("2026-09-09")
  const [notes, setNotes] = React.useState("")
  const [taxRate, setTaxRate] = React.useState(10)
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { id: "li-1", description: "", quantity: 1, unitPrice: 0 },
  ])
  const [pendingAction, setPendingAction] = React.useState<"draft" | "sent" | null>(null)

  const createInvoice = useCreateFinanceInvoice()

  const subtotal = lineItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0,
  )
  const taxAmount = (subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    )
  }

  const addLine = () => {
    if (lineItems.length >= MAX_LINES) return
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const removeLine = (id: string) => {
    setLineItems((prev) =>
      prev.length > 1 ? prev.filter((line) => line.id !== id) : prev,
    )
  }

  // Mirrors the Create Invoice.bru validation table: required fields plus
  // per-line description/quantity>0/unit_price>=0 — applies to draft and sent alike.
  const isFormValid =
    clientName.trim().length > 0 &&
    issueDate.length > 0 &&
    dueDate.length > 0 &&
    dueDate >= issueDate &&
    lineItems.length > 0 &&
    lineItems.every((line) => line.description.trim().length > 0 && line.quantity > 0 && line.unitPrice >= 0)

  const isSendDisabled = !isFormValid || subtotal <= 0

  const buildPayload = (status: "draft" | "sent"): SaveFinanceInvoicePayload => ({
    client_name: clientName.trim(),
    client_email: clientEmail.trim() || undefined,
    issue_date: issueDate,
    due_date: dueDate,
    tax_rate: taxRate,
    notes: notes.trim() || undefined,
    status,
    line_items: lineItems.map((line) => ({
      description: line.description.trim(),
      quantity: line.quantity,
      unit_price: line.unitPrice,
    })),
  })

  const handleSave = (status: "draft" | "sent") => {
    setPendingAction(status)
    createInvoice.mutate(buildPayload(status), {
      onSuccess: (result) => {
        toast.success(
          status === "sent"
            ? `${result.invoice_number} created and sent.`
            : `${result.invoice_number} saved as draft.`,
        )
        onClose()
      },
      onError: (err) =>
        toastMutationError(err, status === "sent" ? "Failed to send invoice" : "Failed to save draft"),
      onSettled: () => setPendingAction(null),
    })
  }

  return (
    <div className="relative flex flex-col p-6">
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-[896px] flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg"
              onClick={onClose}
              aria-label="Back to invoices"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex flex-col">
              <h2 className="text-[20px] leading-7 font-semibold text-content-primary">
                New Invoice
              </h2>
              <p className="text-[12px] leading-[18px] text-content-quaternary">
                Number is assigned automatically when you save
              </p>
            </div>
          </div>
          <Badge
            variant="neutral"
            className="gap-1.5 rounded-lg border border-stroke-default bg-[#f4f4f5] px-2 py-0.5 text-[11px] font-medium text-content-tertiary"
          >
            <FileText className="size-3" />
            Draft
          </Badge>
        </div>

        <Card
          variant="elevated"
          className="rounded-2xl border-stroke-default py-6"
        >
          <SectionHeader icon={<User />}>Client Details</SectionHeader>
          <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1 text-[12px] leading-[18px] text-content-tertiary">
                Client Name <span className="text-brand-danger">*</span>
              </Label>
              <p className="text-[11px] leading-[15.4px] text-content-quaternary">
                The billing recipient
              </p>
              <Input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="e.g. Acme Corporation"
                className="h-9 rounded-lg bg-[#fafafa]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[12px] leading-[18px] text-content-tertiary">
                Client Email
              </Label>
              <p className="text-[11px] leading-[15.4px] text-content-quaternary">
                For invoice delivery
              </p>
              <Input
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="billing@acme.com"
                className="h-9 rounded-lg bg-[#fafafa]"
              />
            </div>
          </div>
        </Card>

        <Card
          variant="elevated"
          className="rounded-2xl border-stroke-default py-6"
        >
          <SectionHeader icon={<Calendar />}>Invoice Details</SectionHeader>
          <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-[12px] leading-[18px] text-content-tertiary">
                Issue Date
              </Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className="h-9 rounded-lg bg-[#fafafa]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[12px] leading-[18px] text-content-tertiary">
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                aria-invalid={dueDate.length > 0 && dueDate < issueDate}
                className="h-9 rounded-lg bg-[#fafafa]"
              />
              {dueDate.length > 0 && dueDate < issueDate ? (
                <span className="text-brand-danger text-[11px]">Due date can&apos;t be before issue date.</span>
              ) : null}
            </div>
          </div>
        </Card>

        <Card
          variant="elevated"
          className="rounded-2xl border-stroke-default py-6"
        >
          <SectionHeader
            icon={<Hash />}
            trailing={
              <span className="text-[11px] leading-[15.4px] text-content-quaternary">
                {lineItems.length}/{MAX_LINES}
              </span>
            }
          >
            Line Items
          </SectionHeader>
          <div className="flex flex-col gap-3 px-6">
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px_100px_40px] gap-3 border-b border-stroke-default pb-3 md:grid">
              <span className="text-[11px] leading-[15.4px] font-medium tracking-[0.55px] text-content-quaternary uppercase">
                Description
              </span>
              <span className="text-right text-[11px] leading-[15.4px] font-medium tracking-[0.55px] text-content-quaternary uppercase">
                Qty
              </span>
              <span className="text-right text-[11px] leading-[15.4px] font-medium tracking-[0.55px] text-content-quaternary uppercase">
                Unit Price
              </span>
              <span className="text-right text-[11px] leading-[15.4px] font-medium tracking-[0.55px] text-content-quaternary uppercase">
                Amount
              </span>
              <span />
            </div>
            {lineItems.map((line) => {
              const amount = line.quantity * line.unitPrice
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_100px_120px_100px_40px]"
                >
                  <Input
                    value={line.description}
                    onChange={(event) =>
                      updateLine(line.id, { description: event.target.value })
                    }
                    placeholder="Item description"
                    className="h-9 rounded-lg bg-[#fafafa] text-xs"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.id, {
                        quantity: Number(event.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-lg bg-[#fafafa] text-right font-mono text-xs"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateLine(line.id, {
                        unitPrice: Number(event.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-lg bg-[#fafafa] text-right font-mono text-xs"
                  />
                  <span className="text-right text-[12px] leading-[18px] font-medium text-content-primary md:px-1">
                    {formatCurrency(amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-lg text-content-tertiary"
                    onClick={() => removeLine(line.id)}
                    disabled={lineItems.length === 1}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )
            })}
            <div className="pt-3">
              <Button
                type="button"
                variant="ghost-primary"
                size="sm"
                className="h-8 rounded-lg px-2.5 text-xs"
                onClick={addLine}
                disabled={lineItems.length >= MAX_LINES}
              >
                <Plus className="size-4" />
                Add Line
              </Button>
            </div>
          </div>
        </Card>

        <Card
          variant="elevated"
          className="rounded-2xl border-stroke-default py-6"
        >
          <SectionHeader icon={<StickyNote />}>Notes</SectionHeader>
          <div className="flex flex-col gap-3 px-6">
            <p className="text-[11px] leading-[15.4px] text-content-quaternary">
              Internal notes (not shown on invoice)
            </p>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Payment terms, additional details, or thank-you note..."
              className="min-h-[64px] rounded-lg bg-[#fafafa] text-xs"
            />
          </div>
        </Card>

        <Card
          variant="elevated"
          className="relative overflow-hidden rounded-2xl border-stroke-default py-6"
        >
          <div
            className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-brand-primary via-violet-500 to-transparent opacity-50"
            aria-hidden
          />
          <div className="flex flex-col gap-4 px-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] leading-[18px] font-medium text-content-tertiary">
                  <Calculator className="size-4 text-brand-primary" />
                  Tax Rate
                </div>
                <span className="text-[12px] font-semibold text-content-primary">
                  {taxRate}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
                className="accent-brand-primary h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#f4f4f5]"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--color-brand-primary) 0%, var(--color-brand-primary) ${(taxRate / 25) * 100}%, #f4f4f5 ${(taxRate / 25) * 100}%, #f4f4f5 100%)`,
                }}
                aria-label="Tax rate"
              />
              <div className="flex justify-between text-[11px] leading-[15.4px] text-content-quaternary">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>
            <div className="h-px w-full bg-stroke-default" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs leading-[18px] text-content-tertiary">
                  Subtotal
                </span>
                <span className="text-[12px] leading-[18px] font-medium tabular-nums text-content-primary">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs leading-[18px] text-content-tertiary">
                  Tax ({taxRate}%)
                </span>
                <span className="text-[12px] leading-[18px] font-medium tabular-nums text-content-primary">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <div className="h-px w-full bg-stroke-default" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[20px] leading-7 font-semibold text-content-primary">
                  Total
                </span>
                <span className="text-brand-primary text-[39px] leading-[43px] font-bold tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg bg-[#fafafa] px-4 text-[12px]"
            onClick={onClose}
            disabled={createInvoice.isPending}
          >
            <X className="size-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg bg-[#fafafa] px-4 text-[12px]"
            disabled={!isFormValid || createInvoice.isPending}
            onClick={() => handleSave("draft")}
          >
            {pendingAction === "draft" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSendDisabled || createInvoice.isPending}
            className={cn(
              "h-10 rounded-lg px-4 text-[12px]",
              (isSendDisabled || createInvoice.isPending) && "opacity-50",
            )}
            onClick={() => handleSave("sent")}
          >
            {pendingAction === "sent" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" />
            )}
            Send Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
