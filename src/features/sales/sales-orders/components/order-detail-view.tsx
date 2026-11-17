"use client"

import * as React from "react"
import { ArrowLeft, Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
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

import { SalesErrorState, useToastMutationError } from "../../components/shared/sales-error-state"
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

function StatusBadge({ status }: Readonly<{ status: OrderStatus }>) {
  const tShared = useTranslations("SalesShared")

  return (
    <Badge variant="neutral" className={cn("rounded-full px-3 font-normal", STATUS_STYLE[status])}>
      {tShared(`orderStatus.${status}`)}
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
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")
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
              <TableHead>{tCommon("description")}</TableHead>
              <TableHead className="w-[90px]">{t("qty")}</TableHead>
              <TableHead className="w-[120px]">{t("unitPrice")}</TableHead>
              <TableHead className="w-[100px]">{t("discountPercentShort")}</TableHead>
              <TableHead className="w-[90px]">{t("taxPercent")}</TableHead>
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
                    aria-label={t("removeRow")}
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
        {t("addRow")}
      </Button>
    </div>
  )
}

function EditLinesFlow({ order }: Readonly<{ order: Order }>) {
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
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
      toast.error(t("invalidQuantity"), {
        description: t("invalidQuantityDescription"),
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
          toast.success(t("linesUpdated"))
          setEditing(null)
        },
        onError: (err) => toastMutationError(err, t("updateLinesFailed")),
      },
    )
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <EditableLinesTable lines={editing.lines} onChange={(lines) => setEditing({ ...editing, lines })} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" variant="primary" disabled={updateOrderLines.isPending} onClick={handleSave}>
            {updateOrderLines.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("saveLines")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setReasonDialogOpen(true)}>
        <Pencil aria-hidden />
        {t("editLines")}
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
              <DialogTitle>{t("editLinesTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <MasterDataSelect
                field="edit_reasons"
                name="editReason"
                label={t("reason")}
                value={editReasonId}
                onValueChange={setEditReasonId}
                placeholder={t("selectReason")}
                emptyMessage={t("noEditReasons")}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedEditReason?.requires_note ? (
                    <>
                      {t("note")} <span className="text-brand-danger">*</span>
                    </>
                  ) : (
                    t("noteOptional")
                  )}
                </span>
                <Textarea name="note" required={selectedEditReason?.requires_note ?? false} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setReasonDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={!editReasonId}>
                {t("continue")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReadOnlyLinesTable({ order }: Readonly<{ order: Order }>) {
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[900px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5">{tCommon("description")}</TableHead>
            <TableHead className="w-[90px] text-end">{t("qty")}</TableHead>
            <TableHead className="w-[120px] text-end">{t("unitPrice")}</TableHead>
            <TableHead className="w-[100px] text-end">{t("discount")}</TableHead>
            <TableHead className="w-[90px] text-end">{t("tax")}</TableHead>
            <TableHead className="w-[130px] px-5 text-end">{t("lineTotal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.lines.length ? (
            order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="px-5 py-3 font-medium text-content-primary">{line.description}</TableCell>
                <TableCell className="py-3 text-end">{line.quantity}</TableCell>
                <TableCell className="py-3 text-end">{formatCurrency(line.unit_price)}</TableCell>
                <TableCell className="py-3 text-end">{line.discount_percent}%</TableCell>
                <TableCell className="py-3 text-end">{line.tax_percent}%</TableCell>
                <TableCell className="px-5 py-3 text-end font-semibold">
                  {formatCurrency(line.line_total)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-content-tertiary">
                {t("noLines")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col items-end gap-1 border-t border-stroke-light px-5 py-4 text-sm">
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("subtotal")}</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("discount")}</span>
          <span>-{formatCurrency(order.discount_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("tax")}</span>
          <span>{formatCurrency(order.tax_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-base font-bold text-content-primary">
          <span>{t("grandTotal")}</span>
          <span>{formatCurrency(order.grand_total)}</span>
        </div>
      </div>
    </div>
  )
}

function ConfirmOrderButton({ order }: Readonly<{ order: Order }>) {
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [lowStockConfirm, setLowStockConfirm] = React.useState(false)
  const confirmOrder = useConfirmOrder()

  const attemptConfirm = (acknowledgeLowStock: boolean) => {
    confirmOrder.mutate(
      { id: order.id, payload: { acknowledge_low_stock: acknowledgeLowStock } },
      {
        onSuccess: () => {
          toast.success(t("confirmedToast"))
          setLowStockConfirm(false)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          if (apiErr.details?.warning === "low_stock" && !acknowledgeLowStock) {
            setLowStockConfirm(true)
            return
          }
          toastMutationError(err, t("confirmFailed"))
        },
      },
    )
  }

  return (
    <>
      <Button type="button" variant="primary" disabled={confirmOrder.isPending} onClick={() => attemptConfirm(false)}>
        {confirmOrder.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {tCommon("confirm")}
      </Button>
      <AlertDialog open={lowStockConfirm} onOpenChange={setLowStockConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>{t("lowStockTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("lowStockDescription")}
          </AlertDialogDescription>
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmOrder.isPending}
              onClick={(event) => {
                event.preventDefault()
                attemptConfirm(true)
              }}
            >
              {t("confirmAnyway")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ActionBar({ order, onBack }: Readonly<{ order: Order; onBack: () => void }>) {
  const t = useTranslations("SalesOrders")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
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
        onError: (err) => toastMutationError(err, t("pdfFailed")),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft className="rtl:rotate-180" aria-hidden />
        {tCommon("back")}
      </Button>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {order.status === "draft" ? <ConfirmOrderButton order={order} /> : null}
        {order.status === "confirmed" ? (
          <Button type="button" variant="primary" onClick={() => setInvoiceOpen(true)}>
            {t("generateInvoice")}
          </Button>
        ) : null}
        {canCancel ? (
          <Button type="button" variant="secondary" onClick={() => setCancelOpen(true)}>
            {t("cancelOrder")}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={getPdf.isPending} onClick={handlePdf}>
          {getPdf.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("pdf")}
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
                    toast.success(
                      invoice.status === "draft" ? t("invoiceCreatedToast") : t("invoiceGeneratedToast"),
                    )
                    setInvoiceOpen(false)
                  },
                  onError: (err) => toastMutationError(err, t("generateInvoiceFailed")),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("generateInvoiceTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {t("dueDateOptional")}
                </span>
                <Input name="dueDate" type="date" />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setInvoiceOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={generateInvoice.isPending}>
                {t("generate")}
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
                    toast.success(t("cancelledToast"))
                    setCancelOpen(false)
                    setCancelReasonId("")
                  },
                  onError: (err) => toastMutationError(err, t("cancelFailed")),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("cancelOrderTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <p className="text-xs text-content-tertiary">{t("cancelFinal")}</p>
              <MasterDataSelect
                field="cancellation_reasons"
                name="reason"
                label={t("reason")}
                value={cancelReasonId}
                onValueChange={setCancelReasonId}
                placeholder={t("selectReason")}
                emptyMessage={t("noCancellationReasons")}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedCancelReason?.requires_note ? (
                    <>
                      {t("note")} <span className="text-brand-danger">*</span>
                    </>
                  ) : (
                    t("noteOptional")
                  )}
                </span>
                <Textarea name="note" required={selectedCancelReason?.requires_note ?? false} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)}>
                {t("keepOrder")}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={cancelOrder.isPending || !cancelReasonId}
              >
                {cancelOrder.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {t("cancelOrderTitle")}
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
  const t = useTranslations("SalesOrders")
  const { data: order, isLoading, isError, refetch } = useOrder(orderId)

  if (isLoading) return <SalesPageSpinner />
  if (isError || !order) {
    return <SalesErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <ActionBar order={order} onBack={onBack} />

      <Card variant="elevated" className="rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-content-primary">{order.number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-content-secondary">{order.customer_name}</p>
          </div>
          {order.status === "confirmed" ? <EditLinesFlow order={order} /> : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-content-quaternary">{t("salesperson")}</p>
            <p className="font-medium text-content-primary">{order.salesperson_name}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">{t("deliveryDate")}</p>
            <p className="font-mono font-medium text-content-primary">
              <DeliveryDate value={order.delivery_date} />
            </p>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-content-primary">{t("lineItems")}</h2>
      <ReadOnlyLinesTable order={order} />

      {order.revisions.length > 0 ? (
        <>
          <h2 className="text-sm font-semibold text-content-primary">{t("revisionHistory")}</h2>
          <div className="flex flex-col divide-y divide-stroke-light rounded-2xl border border-stroke-default bg-surface-white">
            {order.revisions.map((revision) => (
              <div key={revision.id} className="flex flex-col gap-0.5 px-5 py-3 text-sm">
                <span className="font-medium text-content-primary">
                  {revision.edit_reason_label ?? t("linesEdited")}
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
