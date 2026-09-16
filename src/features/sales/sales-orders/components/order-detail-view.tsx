"use client"

import * as React from "react"
import { ArrowLeft, Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, toastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { formatCurrency } from "../../lib/utils/currency"
import {
  useCancelOrder,
  useConfirmOrder,
  useGenerateInvoice,
  useOrderPdf,
  useUpdateOrderLines,
} from "../../lib/mutations/orders"
import { useOrder } from "../../lib/queries/orders"
import { MasterDataSelect, useMasterDataEntry } from "../../components/shared/master-data-select"
import type { ApiError } from "@/src/shared/lib/types/api"
import type { Order, OrderStatus } from "../../lib/types"
import { DeliveryDate } from "./delivery-date"

const STATUS_STYLE: Record<OrderStatus, string> = {
  draft: "bg-surface-hover text-content-secondary",
  pending_confirmation: "bg-amber-100 text-amber-600 dark:bg-amber-950/45 dark:text-amber-300",
  confirmed: "bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300",
  invoiced: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
  closed: "bg-stroke-default text-content-tertiary",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-950/45 dark:text-red-300",
}

function StatusBadge({ status, label }: Readonly<{ status: OrderStatus; label: string }>) {
  return (
    <Badge variant="neutral" className={cn("rounded-full px-3 font-normal", STATUS_STYLE[status])}>
      {label}
    </Badge>
  )
}

type EditableLine = {
  key: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
}

function toEditableLines(order: Order): EditableLine[] {
  return order.lines.map((line) => ({
    key: line.id,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_percent: line.discount_percent,
    tax_percent: line.tax_percent,
  }))
}

function EditableLinesTable({
  lines,
  onChange,
}: Readonly<{ lines: EditableLine[]; onChange: (lines: EditableLine[]) => void }>) {
  const updateLine = (key: string, patch: Partial<EditableLine>) => {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }
  const removeLine = (key: string) => onChange(lines.filter((line) => line.key !== key))
  const addLine = () =>
    onChange([
      ...lines,
      { key: `new-${Date.now()}`, description: "", quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 },
    ])

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-stroke-default">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Description</TableHead>
              <TableHead className="w-[90px]">Qty</TableHead>
              <TableHead className="w-[120px]">Unit Price</TableHead>
              <TableHead className="w-[100px]">Disc. %</TableHead>
              <TableHead className="w-[90px]">Tax %</TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.key}>
                <TableCell className="py-2">
                  <Input
                    value={line.description}
                    onChange={(event) => updateLine(line.key, { description: event.target.value })}
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, { quantity: Number.parseInt(event.target.value, 10) || 0 })
                    }
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(event) => updateLine(line.key, { unit_price: Number.parseFloat(event.target.value) || 0 })}
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={line.discount_percent}
                    onChange={(event) =>
                      updateLine(line.key, { discount_percent: Number.parseFloat(event.target.value) || 0 })
                    }
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={line.tax_percent}
                    onChange={(event) =>
                      updateLine(line.key, { tax_percent: Number.parseFloat(event.target.value) || 0 })
                    }
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove row"
                    className="text-brand-danger"
                    onClick={() => removeLine(line.key)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={addLine}>
        <Plus aria-hidden />
        Add Row
      </Button>
    </div>
  )
}

function EditLinesFlow({ order }: Readonly<{ order: Order }>) {
  const [reasonDialogOpen, setReasonDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<{ editReasonId: string; note: string; lines: EditableLine[] } | null>(
    null,
  )
  const updateOrderLines = useUpdateOrderLines()

  const [editReasonId, setEditReasonId] = React.useState("")
  const selectedEditReason = useMasterDataEntry("edit_reasons", editReasonId)

  const handleStartEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const note = String(new FormData(event.currentTarget).get("note") ?? "").trim()
    setEditing({ editReasonId, note, lines: toEditableLines(order) })
    setReasonDialogOpen(false)
  }

  const handleSave = () => {
    if (!editing) return

    const savedLines = editing.lines.filter((line) => line.description.trim())
    if (savedLines.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1)) {
      toast.error("Invalid quantity", {
        description: "Every line quantity must be a whole number of 1 or more.",
      })
      return
    }

    updateOrderLines.mutate(
      {
        id: order.id,
        payload: {
          edit_reason_id: editing.editReasonId,
          note: editing.note || undefined,
          lines: savedLines
            .map((line) => ({
              product_id: line.product_id,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              discount_percent: line.discount_percent,
              tax_percent: line.tax_percent,
            })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Order lines updated")
          setEditing(null)
        },
        onError: (err) => toastMutationError(err, "Failed to update order lines"),
      },
    )
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <EditableLinesTable lines={editing.lines} onChange={(lines) => setEditing({ ...editing, lines })} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={updateOrderLines.isPending} onClick={handleSave}>
            {updateOrderLines.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Save lines
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setReasonDialogOpen(true)}>
        <Pencil aria-hidden />
        Edit Lines
      </Button>
      <Dialog
        open={reasonDialogOpen}
        onOpenChange={(open) => {
          setReasonDialogOpen(open)
          if (!open) setEditReasonId("")
        }}
      >
        <DialogContent className="max-w-sm">
          <form onSubmit={handleStartEdit}>
            <DialogHeader>
              <DialogTitle>Edit order lines</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <MasterDataSelect
                field="edit_reasons"
                name="editReason"
                label="Reason"
                value={editReasonId}
                onValueChange={setEditReasonId}
                placeholder="Select a reason…"
                emptyMessage="No edit reasons are configured yet, so order lines can’t be edited. Ask an administrator to add them to the sales master data."
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedEditReason?.requires_note ? (
                    <>
                      Note <span className="text-brand-danger">*</span>
                    </>
                  ) : (
                    "Note (optional)"
                  )}
                </span>
                <Textarea name="note" required={selectedEditReason?.requires_note ?? false} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setReasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!editReasonId}>
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReadOnlyLinesTable({ order }: Readonly<{ order: Order }>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[900px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5">Description</TableHead>
            <TableHead className="w-[90px] text-right">Qty</TableHead>
            <TableHead className="w-[120px] text-right">Unit Price</TableHead>
            <TableHead className="w-[100px] text-right">Discount</TableHead>
            <TableHead className="w-[90px] text-right">Tax</TableHead>
            <TableHead className="w-[130px] px-5 text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.lines.length ? (
            order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="px-5 py-3 font-medium text-content-primary">{line.description}</TableCell>
                <TableCell className="py-3 text-right">{line.quantity}</TableCell>
                <TableCell className="py-3 text-right">{formatCurrency(line.unit_price)}</TableCell>
                <TableCell className="py-3 text-right">{line.discount_percent}%</TableCell>
                <TableCell className="py-3 text-right">{line.tax_percent}%</TableCell>
                <TableCell className="px-5 py-3 text-right font-semibold">
                  {formatCurrency(line.line_total)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-content-tertiary">
                No line items.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col items-end gap-1 border-t border-stroke-light px-5 py-4 text-sm">
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Discount</span>
          <span>-{formatCurrency(order.discount_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Tax</span>
          <span>{formatCurrency(order.tax_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-base font-bold text-content-primary">
          <span>Grand Total</span>
          <span>{formatCurrency(order.grand_total)}</span>
        </div>
      </div>
    </div>
  )
}

function ConfirmOrderButton({ order }: Readonly<{ order: Order }>) {
  const [lowStockConfirm, setLowStockConfirm] = React.useState(false)
  const confirmOrder = useConfirmOrder()

  const attemptConfirm = (acknowledgeLowStock: boolean) => {
    confirmOrder.mutate(
      { id: order.id, payload: { acknowledge_low_stock: acknowledgeLowStock } },
      {
        onSuccess: () => {
          toast.success("Order confirmed")
          setLowStockConfirm(false)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          if (apiErr.details?.warning === "low_stock" && !acknowledgeLowStock) {
            setLowStockConfirm(true)
            return
          }
          toastMutationError(err, "Failed to confirm order")
        },
      },
    )
  }

  return (
    <>
      <Button type="button" variant="primary" disabled={confirmOrder.isPending} onClick={() => attemptConfirm(false)}>
        {confirmOrder.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Confirm
      </Button>
      <AlertDialog open={lowStockConfirm} onOpenChange={setLowStockConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>Some items are low or out of stock</AlertDialogTitle>
          <AlertDialogDescription>
            Confirming will proceed anyway. Review stock levels first if you&apos;re unsure.
          </AlertDialogDescription>
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmOrder.isPending}
              onClick={(event) => {
                event.preventDefault()
                attemptConfirm(true)
              }}
            >
              Confirm anyway
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ActionBar({ order, onBack }: Readonly<{ order: Order; onBack: () => void }>) {
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [invoiceOpen, setInvoiceOpen] = React.useState(false)
  const cancelOrder = useCancelOrder()
  const generateInvoice = useGenerateInvoice()
  const getPdf = useOrderPdf()

  const [cancelReasonId, setCancelReasonId] = React.useState("")
  const selectedCancelReason = useMasterDataEntry("cancellation_reasons", cancelReasonId)

  const canCancel = order.status === "draft" || order.status === "pending_confirmation" || order.status === "confirmed"

  const handlePdf = () => {
    getPdf.mutate(
      { id: order.id },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, "Failed to generate PDF"),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden />
        Back
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {order.status === "draft" ? <ConfirmOrderButton order={order} /> : null}
        {order.status === "confirmed" ? (
          <Button type="button" variant="primary" onClick={() => setInvoiceOpen(true)}>
            Generate Invoice
          </Button>
        ) : null}
        {canCancel ? (
          <Button type="button" variant="secondary" onClick={() => setCancelOpen(true)}>
            Cancel Order
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={getPdf.isPending} onClick={handlePdf}>
          {getPdf.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download aria-hidden />}
          PDF
        </Button>
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const dueDate = String(new FormData(event.currentTarget).get("dueDate") ?? "").trim()
              generateInvoice.mutate(
                { id: order.id, payload: dueDate ? { due_date: dueDate } : {} },
                {
                  onSuccess: (invoice) => {
                    toast.success(`Invoice ${invoice.status === "draft" ? "created" : ""} — draft ready to post`)
                    setInvoiceOpen(false)
                  },
                  onError: (err) => toastMutationError(err, "Failed to generate invoice"),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>Generate invoice</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  Due date (optional — defaults from settings)
                </span>
                <Input name="dueDate" type="date" />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setInvoiceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={generateInvoice.isPending}>
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open)
          if (!open) setCancelReasonId("")
        }}
      >
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const note = String(new FormData(event.currentTarget).get("note") ?? "").trim()
              cancelOrder.mutate(
                {
                  id: order.id,
                  payload: {
                    cancellation_reason_id: cancelReasonId,
                    cancellation_note: note || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success("Order cancelled")
                    setCancelOpen(false)
                    setCancelReasonId("")
                  },
                  onError: (err) => toastMutationError(err, "Failed to cancel order"),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>Cancel order</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <p className="text-xs text-content-tertiary">This is final and cannot be undone.</p>
              <MasterDataSelect
                field="cancellation_reasons"
                name="reason"
                label="Reason"
                value={cancelReasonId}
                onValueChange={setCancelReasonId}
                placeholder="Select a reason…"
                emptyMessage="No cancellation reasons are configured yet, so this order can’t be cancelled. Ask an administrator to add them to the sales master data."
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedCancelReason?.requires_note ? (
                    <>
                      Note <span className="text-brand-danger">*</span>
                    </>
                  ) : (
                    "Note (optional)"
                  )}
                </span>
                <Textarea name="note" required={selectedCancelReason?.requires_note ?? false} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)}>
                Keep order
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={cancelOrder.isPending || !cancelReasonId}
              >
                {cancelOrder.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Cancel order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function OrderDetailView({
  orderId,
  onBack,
}: Readonly<{ orderId: string; onBack: () => void }>) {
  const { data: order, isLoading, isError, refetch } = useOrder(orderId)

  if (isLoading) return <SalesPageSpinner />
  if (isError || !order) {
    return <SalesErrorState message="Failed to load order." onRetry={() => void refetch()} />
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <ActionBar order={order} onBack={onBack} />

      <Card variant="elevated" className="rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-content-primary">{order.number}</h1>
              <StatusBadge status={order.status} label={order.status_label} />
            </div>
            <p className="text-sm text-content-secondary">{order.customer_name}</p>
          </div>
          {order.status === "confirmed" ? <EditLinesFlow order={order} /> : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-content-quaternary">Salesperson</p>
            <p className="font-medium text-content-primary">{order.salesperson_name}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">Delivery Date</p>
            <p className="font-mono font-medium text-content-primary">
              <DeliveryDate value={order.delivery_date} />
            </p>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-content-primary">Line Items</h2>
      <ReadOnlyLinesTable order={order} />

      {order.revisions.length > 0 ? (
        <>
          <h2 className="text-sm font-semibold text-content-primary">Revision History</h2>
          <div className="flex flex-col divide-y divide-stroke-light rounded-2xl border border-stroke-default bg-surface-white">
            {order.revisions.map((revision) => (
              <div key={revision.id} className="flex flex-col gap-0.5 px-5 py-3 text-sm">
                <span className="font-medium text-content-primary">
                  {revision.edit_reason_label ?? "Lines edited"}
                </span>
                {revision.note ? <span className="text-xs text-content-tertiary">{revision.note}</span> : null}
                <span className="text-xs text-content-quaternary">{revision.created_at}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
