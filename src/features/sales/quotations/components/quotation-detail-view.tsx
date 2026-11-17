"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  Loader2,
  Pencil,
  Plus,
  ShieldQuestion,
  Trash2,
} from "lucide-react"
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
import {
  MasterDataSelect,
  SALES_SELECT_CLASS_NAME,
  useMasterDataEntry,
} from "../../components/shared/master-data-select"
import { formatCurrency } from "../../lib/utils/currency"
import { getQuotationValidity, type QuotationValidity } from "../../lib/utils/quotation-validity"
import { withCurrentSalesperson } from "../../lib/utils/salespeople"
import { useRequestDiscountApproval } from "../../lib/mutations/discount-approvals"
import {
  useAcceptQuotation,
  useAddQuotationLine,
  useConvertQuotation,
  useDeleteQuotation,
  useDuplicateQuotation,
  useQuotationPdf,
  useRejectQuotation,
  useRemoveQuotationLine,
  useSendQuotation,
  useUpdateQuotation,
  useUpdateQuotationLine,
} from "../../lib/mutations/quotations"
import { useQuotation } from "../../lib/queries/quotations"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import { useProductSearch } from "../../lib/queries/products"
import type {
  Quotation,
  QuotationLine,
  QuotationLineInput,
  QuotationStatus,
} from "../../lib/types"

function StatusBadge({ status }: Readonly<{ status: QuotationStatus }>) {
  const tShared = useTranslations("SalesShared")
  const className = cn(
    "rounded-full px-3 font-normal",
    status === "accepted" && "bg-emerald-50 text-emerald-600",
    status === "sent" && "bg-blue-50 text-blue-600",
    status === "draft" && "bg-zinc-100 text-zinc-600",
    status === "expired" && "bg-zinc-200 text-zinc-500",
    status === "converted" && "bg-violet-100 text-violet-600",
    status === "rejected" && "bg-red-100 text-red-600",
  )
  return (
    <Badge variant="neutral" className={className}>
      {tShared(`quotationStatus.${status}`)}
    </Badge>
  )
}

/**
 * Rendered beside {@link StatusBadge}, never in place of it. The server keeps a
 * never-sent quotation on `status: "draft"` past its validity date (see
 * `lib/utils/quotation-validity.ts`), and that status is what drives
 * `actions_available` — overwriting the badge with "Expired" would misreport
 * which actions the backend will actually accept. Two badges say both true
 * things at once: what the server thinks it is, and that its validity lapsed.
 */
function ExpiredBadge({ validity }: Readonly<{ validity: QuotationValidity }>) {
  const tShared = useTranslations("SalesShared")

  return (
    <Badge
      variant="danger"
      className="rounded-full px-3 font-normal"
      title={tShared(`validity.${validity.label.key}`, { count: validity.label.count })}
    >
      <AlertTriangle aria-hidden />
      {tShared("validity.expired")}
    </Badge>
  )
}

function LineEditorFields({
  defaultLine,
  productQuery,
  setProductQuery,
  quantityError,
  onQuantityChange,
}: Readonly<{
  defaultLine?: QuotationLine
  productQuery: string
  setProductQuery: (value: string) => void
  quantityError: string | null
  onQuantityChange: () => void
}>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const [manualMode, setManualMode] = React.useState(!defaultLine?.product_id)
  const [selectedProductId, setSelectedProductId] = React.useState(defaultLine?.product_id ?? "")
  const { data: results = [] } = useProductSearch(productQuery)

  return (
    <>
      <input type="hidden" name="productId" value={manualMode ? "" : selectedProductId} />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-content-secondary">
          {manualMode ? tCommon("description") : t("product")}
        </span>
        {manualMode ? (
          <Input name="description" defaultValue={defaultLine?.description} required placeholder={t("lineDescriptionPlaceholder")} />
        ) : (
          <div className="relative">
            <Input
              value={productQuery}
              onChange={(event) => {
                setProductQuery(event.target.value)
                setSelectedProductId("")
              }}
              placeholder={t("searchProductsPlaceholder")}
              required={!selectedProductId}
            />
            {productQuery && !selectedProductId && results.length > 0 ? (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-stroke-default bg-surface-white shadow-lg">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-start text-sm hover:bg-surface-hover"
                    onClick={() => {
                      setSelectedProductId(product.id)
                      setProductQuery(product.name)
                    }}
                  >
                    <span className="font-medium text-content-primary">{product.name}</span>
                    <span className="text-xs text-content-tertiary">
                      {product.sku} · {formatCurrency(product.default_unit_price)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <button
          type="button"
          className="w-fit text-xs text-brand-primary underline"
          onClick={() => {
            setManualMode((m) => !m)
            setSelectedProductId("")
            setProductQuery("")
          }}
        >
          {manualMode ? t("searchProductInstead") : t("customLineInstead")}
        </button>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("quantity")}</span>
        <Input
          name="quantity"
          type="number"
          min="1"
          step="1"
          defaultValue={defaultLine?.quantity ?? 1}
          required
          aria-invalid={!!quantityError}
          aria-describedby={quantityError ? "quotation-line-quantity-error" : undefined}
          onChange={onQuantityChange}
        />
        {quantityError ? (
          <span id="quotation-line-quantity-error" className="text-xs text-brand-danger">
            {quantityError}
          </span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("unitPrice")}</span>
        <Input
          name="unitPrice"
          type="number"
          min="0"
          step="0.01"
          defaultValue={defaultLine?.unit_price}
          required={manualMode}
          placeholder={manualMode ? undefined : t("fromProduct")}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("discountPercent")}</span>
        <Input name="discountPercent" type="number" min="0" max="100" defaultValue={defaultLine?.discount_percent ?? 0} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("taxPercent")}</span>
        <Input
          name="taxPercent"
          type="number"
          min="0"
          max="100"
          defaultValue={defaultLine?.tax_percent}
          placeholder={manualMode ? undefined : t("fromProductSettings")}
        />
      </label>
    </>
  )
}

function LineDialog({
  open,
  onOpenChange,
  quotationId,
  line,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  quotationId: string
  line: QuotationLine | null
}>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [productQuery, setProductQuery] = React.useState(line ? "" : "")
  const [quantityError, setQuantityError] = React.useState<string | null>(null)
  const addLine = useAddQuotationLine()
  const updateLine = useUpdateQuotationLine()
  const isPending = addLine.isPending || updateLine.isPending

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setProductQuery("")
      setQuantityError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const productId = String(formData.get("productId") ?? "").trim()
    const unitPrice = String(formData.get("unitPrice") ?? "").trim()
    const taxPercent = String(formData.get("taxPercent") ?? "").trim()

    // The API models quantity as a decimal, but stock is tracked in whole units
    // throughout Sales — reject fractions here rather than let them skew line totals.
    const quantity = Number(String(formData.get("quantity") ?? ""))
    if (!Number.isInteger(quantity) || quantity < 1) {
      setQuantityError(t("quantityWhole"))
      return
    }
    setQuantityError(null)

    const payload: QuotationLineInput = {
      product_id: productId || undefined,
      description: productId ? undefined : String(formData.get("description") ?? "").trim(),
      quantity,
      unit_price: unitPrice ? Number.parseFloat(unitPrice) : undefined,
      discount_percent: Number.parseFloat(String(formData.get("discountPercent") ?? "0")) || 0,
      tax_percent: taxPercent ? Number.parseFloat(taxPercent) : undefined,
    }

    const onSettled = {
      onSuccess: () => {
        toast.success(line ? t("lineUpdated") : t("lineAdded"))
        handleOpenChange(false)
      },
      onError: (err: unknown) => toastMutationError(err, t("saveLineFailed")),
    }

    if (line) {
      updateLine.mutate({ id: quotationId, lineId: line.id, payload }, onSettled)
    } else {
      addLine.mutate({ id: quotationId, payload }, onSettled)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{line ? t("editLineTitle") : t("addLineTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LineEditorFields
              defaultLine={line ?? undefined}
              productQuery={productQuery}
              setProductQuery={setProductQuery}
              quantityError={quantityError}
              onQuantityChange={() => setQuantityError(null)}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {line ? tCommon("saveChanges") : t("addLineSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestDiscountApprovalDialog({
  open,
  onOpenChange,
  quotationId,
  lineId,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  quotationId: string
  lineId: string | null
}>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [justification, setJustification] = React.useState("")
  const requestApproval = useRequestDiscountApproval()

  const handleOpenChange = (next: boolean) => {
    if (!next) setJustification("")
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!lineId) return
    requestApproval.mutate(
      { quotationId, lineId, payload: { justification } },
      {
        onSuccess: () => {
          toast.success(t("approvalRequested"))
          handleOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("requestApprovalFailed")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("requestDiscountApproval")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {t("justificationLabel")}
              </span>
              <Textarea
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                minLength={20}
                required
                autoFocus
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={justification.trim().length < 20 || requestApproval.isPending}
            >
              {requestApproval.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {t("requestApproval")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LinesTable({
  quotation,
  onEditLine,
  onRequestApproval,
}: Readonly<{
  quotation: Quotation
  onEditLine: (line: QuotationLine) => void
  onRequestApproval: (lineId: string) => void
}>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const removeLine = useRemoveQuotationLine()
  const isEditable = quotation.actions_available.includes("edit")

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[900px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5">{tCommon("description")}</TableHead>
            <TableHead className="w-[90px] text-end">{t("qty")}</TableHead>
            <TableHead className="w-[120px] text-end">{t("unitPriceColumn")}</TableHead>
            <TableHead className="w-[100px] text-end">{t("discount")}</TableHead>
            <TableHead className="w-[90px] text-end">{t("tax")}</TableHead>
            <TableHead className="w-[130px] text-end">{t("lineTotal")}</TableHead>
            {isEditable ? <TableHead className="w-[140px] px-5 text-end">{tCommon("actions")}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotation.lines.length ? (
            quotation.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="px-5 py-3 font-medium text-content-primary">
                  {line.description}
                </TableCell>
                <TableCell className="py-3 text-end">{line.quantity}</TableCell>
                <TableCell className="py-3 text-end">{formatCurrency(line.unit_price)}</TableCell>
                <TableCell className="py-3 text-end">{line.discount_percent}%</TableCell>
                <TableCell className="py-3 text-end">{line.tax_percent}%</TableCell>
                <TableCell className="py-3 text-end font-semibold">
                  {formatCurrency(line.line_total)}
                </TableCell>
                {isEditable ? (
                  <TableCell className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {line.discount_percent > 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("requestDiscountApproval")}
                          onClick={() => onRequestApproval(line.id)}
                        >
                          <ShieldQuestion aria-hidden />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("editLine")}
                        onClick={() => onEditLine(line)}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("removeLine")}
                        className="text-brand-danger"
                        disabled={removeLine.isPending}
                        onClick={() =>
                          removeLine.mutate(
                            { id: quotation.id, lineId: line.id },
                            { onError: (err) => toastMutationError(err, t("removeLineFailed")) },
                          )
                        }
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isEditable ? 7 : 6} className="h-24 text-center text-content-tertiary">
                {t("noLines")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col items-end gap-1 border-t border-stroke-light px-5 py-4 text-sm">
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("subtotal")}</span>
          <span>{formatCurrency(quotation.subtotal)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("discount")}</span>
          <span>-{formatCurrency(quotation.discount_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>{t("tax")}</span>
          <span>{formatCurrency(quotation.tax_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-base font-bold text-content-primary">
          <span>{t("grandTotal")}</span>
          <span>{formatCurrency(quotation.grand_total)}</span>
        </div>
      </div>
    </div>
  )
}

function EditHeaderDialog({
  open,
  onOpenChange,
  quotation,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; quotation: Quotation }>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const { data: salespeople = [] } = useActiveSalespeople()
  const updateQuotation = useUpdateQuotation()

  const salespersonOptions = React.useMemo(
    () =>
      withCurrentSalesperson(salespeople, {
        id: quotation.salesperson_id,
        name: quotation.salesperson_name,
      }),
    [salespeople, quotation.salesperson_id, quotation.salesperson_name],
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const salespersonId = String(formData.get("salesperson") ?? "")
    if (!salespersonId) {
      toast.error(t("selectSalespersonBeforeSaving"))
      return
    }

    const validityRaw = String(formData.get("validityDays") ?? "").trim()
    const validityDays = validityRaw ? Number.parseInt(validityRaw, 10) : Number.NaN

    updateQuotation.mutate(
      {
        id: quotation.id,
        payload: {
          salesperson_id: salespersonId,
          quotation_date: String(formData.get("quotationDate") ?? "") || undefined,
          validity_days: Number.isNaN(validityDays) ? undefined : validityDays,
          // Sent even when empty — omitting the key leaves the old terms in place,
          // so clearing the textarea would silently do nothing.
          terms_and_conditions: String(formData.get("terms") ?? "").trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(t("updatedToast"))
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("updateFailed")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("editDetailsTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">{t("salesperson")}</span>
              <select name="salesperson" className={SALES_SELECT_CLASS_NAME} defaultValue={quotation.salesperson_id}>
                {salespersonOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{t("quotationDate")}</span>
              <Input name="quotationDate" type="date" defaultValue={quotation.quotation_date} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{t("validityDays")}</span>
              <Input name="validityDays" type="number" min="1" defaultValue={quotation.validity_days} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">{t("termsAndConditions")}</span>
              <Textarea name="terms" defaultValue={quotation.terms_and_conditions ?? ""} />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={updateQuotation.isPending}>
              {updateQuotation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {tCommon("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionBar({ quotation, onBack }: Readonly<{ quotation: Quotation; onBack: () => void }>) {
  const t = useTranslations("SalesQuotations")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [sendOpen, setSendOpen] = React.useState(false)
  const [acceptOpen, setAcceptOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [convertOpen, setConvertOpen] = React.useState(false)

  const sendQuotation = useSendQuotation()
  const acceptQuotation = useAcceptQuotation()
  const rejectQuotation = useRejectQuotation()
  const convertQuotation = useConvertQuotation()
  const duplicateQuotation = useDuplicateQuotation()
  const deleteQuotation = useDeleteQuotation()
  const getPdf = useQuotationPdf()

  const [rejectReasonId, setRejectReasonId] = React.useState("")
  const selectedRejectReason = useMasterDataEntry("rejection_reasons", rejectReasonId)

  const allows = (action: string) => quotation.actions_available.includes(action)
  const awaitingDiscountApproval =
    quotation.discount_approval_id !== null && !quotation.discount_approved
  // A draft keeps its "send" action forever, so nothing server-side stops a
  // quotation whose validity date has already passed from being mailed to a
  // customer as if it were live. Bump the date first.
  const validity = getQuotationValidity(quotation)
  const blockSend = awaitingDiscountApproval || validity.isExpired

  const handleDuplicate = () => {
    duplicateQuotation.mutate(quotation.id, {
      onSuccess: (dup) => toast.success(t("duplicatedAs", { number: dup.number })),
      onError: (err) => toastMutationError(err, t("duplicateFailed")),
    })
  }

  const handlePdf = () => {
    getPdf.mutate(
      { id: quotation.id },
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
        {allows("delete") ? (
          <Button type="button" variant="secondary" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden />
            {tCommon("delete")}
          </Button>
        ) : null}
        {allows("send") ? (
          <Button
            type="button"
            variant="primary"
            disabled={blockSend}
            title={
              awaitingDiscountApproval
                ? t("sendBlockedApproval")
                : validity.isExpired
                  ? t("sendBlockedExpired", { date: quotation.validity_date })
                  : undefined
            }
            onClick={() => setSendOpen(true)}
          >
            {t("send")}
          </Button>
        ) : null}
        {allows("reject") ? (
          <Button type="button" variant="secondary" onClick={() => setRejectOpen(true)}>
            {tCommon("reject")}
          </Button>
        ) : null}
        {allows("accept") ? (
          <Button type="button" variant="primary" onClick={() => setAcceptOpen(true)}>
            {t("accept")}
          </Button>
        ) : null}
        {allows("convert") ? (
          <Button type="button" variant="primary" onClick={() => setConvertOpen(true)}>
            {t("convertToOrder")}
          </Button>
        ) : null}
        {allows("duplicate") ? (
          <Button type="button" variant="secondary" disabled={duplicateQuotation.isPending} onClick={handleDuplicate}>
            <Copy aria-hidden />
            {t("duplicate")}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={getPdf.isPending} onClick={handlePdf}>
          {getPdf.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("pdf")}
        </Button>
      </div>

      {/* Send */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const sentVia = String(new FormData(event.currentTarget).get("sentVia")) as "email" | "whatsapp" | "manual"
              sendQuotation.mutate(
                { id: quotation.id, payload: { sent_via: sentVia } },
                {
                  onSuccess: () => {
                    toast.success(t("sentToast"))
                    setSendOpen(false)
                  },
                  onError: (err) => toastMutationError(err, t("sendFailed")),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("sendTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">{t("sentVia")}</span>
                <select name="sentVia" className={SALES_SELECT_CLASS_NAME} defaultValue="email">
                  <option value="email">{t("sentViaEmail")}</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="manual">{t("sentViaManual")}</option>
                </select>
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setSendOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={sendQuotation.isPending}>
                {t("send")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accept */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const reference = String(new FormData(event.currentTarget).get("reference") ?? "").trim()
              acceptQuotation.mutate(
                { id: quotation.id, payload: { acceptance_reference: reference || undefined } },
                {
                  onSuccess: () => {
                    toast.success(t("acceptedToast"))
                    setAcceptOpen(false)
                  },
                  onError: (err) => toastMutationError(err, t("acceptFailed")),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("acceptTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {t("acceptReference")}
                </span>
                <Input name="reference" placeholder={t("acceptReferencePlaceholder")} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAcceptOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={acceptQuotation.isPending}>
                {t("accept")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open)
          if (!open) setRejectReasonId("")
        }}
      >
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const note = String(new FormData(event.currentTarget).get("note") ?? "").trim()
              rejectQuotation.mutate(
                {
                  id: quotation.id,
                  payload: {
                    rejection_reason_id: rejectReasonId,
                    rejection_note: note || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success(t("rejectedToast"))
                    setRejectOpen(false)
                    setRejectReasonId("")
                  },
                  onError: (err) => toastMutationError(err, t("rejectFailed")),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("rejectTitle")}</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <MasterDataSelect
                field="rejection_reasons"
                name="reason"
                label={t("reason")}
                value={rejectReasonId}
                onValueChange={setRejectReasonId}
                placeholder={t("selectReason")}
                emptyMessage={t("noRejectionReasons")}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedRejectReason?.requires_note ? (
                    <>
                      {t("note")} <span className="text-brand-danger">*</span>
                    </>
                  ) : (
                    t("noteOptional")
                  )}
                </span>
                <Textarea name="note" required={selectedRejectReason?.requires_note ?? false} />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={rejectQuotation.isPending || !rejectReasonId}
              >
                {rejectQuotation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {tCommon("reject")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert */}
      <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>{t("convertTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("convertDescription")}
          </AlertDialogDescription>
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={convertQuotation.isPending}
              onClick={(event) => {
                event.preventDefault()
                convertQuotation.mutate(quotation.id, {
                  onSuccess: () => {
                    toast.success(t("convertedToast"))
                    setConvertOpen(false)
                  },
                  onError: (err) => toastMutationError(err, t("convertFailed")),
                })
              }}
            >
              {t("convert")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteQuotation.isPending}
              onClick={(event) => {
                event.preventDefault()
                deleteQuotation.mutate(quotation.id, {
                  onSuccess: () => {
                    toast.success(t("draftDeleted"))
                    onBack()
                  },
                  onError: (err) => toastMutationError(err, t("deleteFailed")),
                })
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function QuotationDetailView({
  quotationId,
  onBack,
}: Readonly<{ quotationId: string; onBack: () => void }>) {
  const t = useTranslations("SalesQuotations")
  const tShared = useTranslations("SalesShared")
  const { data: quotation, isLoading, isError, refetch } = useQuotation(quotationId)
  const [lineDialog, setLineDialog] = React.useState<{ open: boolean; line: QuotationLine | null }>({
    open: false,
    line: null,
  })
  const [approvalLineId, setApprovalLineId] = React.useState<string | null>(null)
  const [editHeaderOpen, setEditHeaderOpen] = React.useState(false)

  if (isLoading) return <SalesPageSpinner />
  if (isError || !quotation) {
    return <SalesErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
  }

  const isEditable = quotation.actions_available.includes("edit")
  const validity = getQuotationValidity(quotation)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <ActionBar quotation={quotation} onBack={onBack} />

      <Card variant="elevated" className="rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-content-primary">{quotation.number}</h1>
              <StatusBadge status={quotation.status} />
              {validity.isExpired ? <ExpiredBadge validity={validity} /> : null}
            </div>
            <p className="text-sm text-content-secondary">{quotation.customer_name}</p>
          </div>
          {isEditable ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditHeaderOpen(true)}>
              <Pencil aria-hidden />
              {t("editDetails")}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-content-quaternary">{t("salesperson")}</p>
            <p className="font-medium text-content-primary">{quotation.salesperson_name}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">{t("quotationDateLabel")}</p>
            <p className="font-mono font-medium text-content-primary">{quotation.quotation_date}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">{t("validityDate")}</p>
            <p className="font-mono font-medium text-content-primary">{quotation.validity_date}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">{t("daysLeft")}</p>
            <p
              className={cn(
                "font-medium text-content-primary",
                validity.isExpired && "text-brand-danger",
              )}
            >
              {tShared(`validity.${validity.label.key}`, { count: validity.label.count })}
            </p>
          </div>
        </div>
        {quotation.terms_and_conditions ? (
          <p className="mt-4 text-xs text-content-tertiary">{quotation.terms_and_conditions}</p>
        ) : null}
      </Card>

      {validity.isExpired ? (
        <div className="flex items-start gap-2 rounded-xl border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-xs text-brand-danger">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>
            {t("expiredBannerPassed", { date: quotation.validity_date })}{" "}
            {quotation.status === "draft"
              ? t("expiredBannerDraft")
              : t("expiredBannerStatus", {
                  status: tShared(`quotationStatus.${quotation.status}`),
                })}
            {isEditable ? ` ${t("expiredBannerEditHint")}` : ""}
          </span>
        </div>
      ) : null}

      {quotation.discount_approval_id !== null ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl border px-4 py-3 text-xs",
            quotation.discount_approved
              ? "border-brand-success/30 bg-brand-success/10 text-brand-success"
              : "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
          )}
        >
          <ShieldQuestion className="size-4 shrink-0" aria-hidden />
          <span>
            {quotation.discount_approved
              ? t("discountApproved")
              : t("discountAwaiting")}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content-primary">{t("lineItems")}</h2>
        {isEditable ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLineDialog({ open: true, line: null })}
          >
            <Plus aria-hidden />
            {t("addLineTitle")}
          </Button>
        ) : null}
      </div>

      <LinesTable
        quotation={quotation}
        onEditLine={(line) => setLineDialog({ open: true, line })}
        onRequestApproval={setApprovalLineId}
      />

      <LineDialog
        open={lineDialog.open}
        onOpenChange={(open) => setLineDialog((s) => ({ ...s, open }))}
        quotationId={quotation.id}
        line={lineDialog.line}
      />
      <RequestDiscountApprovalDialog
        open={approvalLineId !== null}
        onOpenChange={(open) => !open && setApprovalLineId(null)}
        quotationId={quotation.id}
        lineId={approvalLineId}
      />
      <EditHeaderDialog open={editHeaderOpen} onOpenChange={setEditHeaderOpen} quotation={quotation} />
    </div>
  )
}
