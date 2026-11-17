import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import type { InvoiceStatus } from "../../lib/types"

/**
 * An invoice only gets its number when it is **posted**:
 * `POST /sales/invoices/:id/post` is documented as the step that
 * "بيحجز الرقم النهائي `INV-{YYYY}-{####}`" (see `bruno/Sales/Invoices/Post
 * Invoice.bru`). A `draft` therefore has none, and neither does an invoice
 * cancelled while still a draft — `Cancel Invoice.bru` allows cancelling from
 * `draft`/`posted`/`sent`, so only the draft path is numberless.
 *
 * That is correct and must not be "fixed" by numbering drafts: fiscal numbering
 * has to be gapless and sequential, so a draft that may yet be deleted or
 * cancelled cannot be allowed to burn a number.
 *
 * What was wrong is that the UI rendered the null as nothing at all — a blank
 * table cell, and an entirely **empty `<h1>`** on the detail page, which left a
 * draft invoice with no identifier anywhere on screen. See
 * `docs/backend-sales-quotation-expiry-and-delivery-date.md` §3.
 */
type InvoicesTranslator = ReturnType<typeof useTranslations<"SalesInvoices">>

function hint(status: InvoiceStatus, t: InvoicesTranslator): string {
  if (status === "cancelled") {
    return t("numberHintCancelled")
  }
  if (status === "draft") {
    return t("numberHintDraft")
  }
  return t("numberHintNeverPosted")
}

export function InvoiceNumber({
  value,
  status,
  className,
}: Readonly<{ value: string | null; status: InvoiceStatus; className?: string }>) {
  const t = useTranslations("SalesInvoices")

  if (value) return <span className={className}>{value}</span>

  const title = hint(status, t)
  return (
    <span
      className={cn("font-sans font-normal text-content-quaternary italic", className)}
      title={title}
      aria-label={title}
    >
      {t("notYetNumbered")}
    </span>
  )
}

/** Screen-reader / clipboard label for an invoice that may not have a number yet. */
export function invoiceLabel(
  value: string | null,
  customerName: string,
  t: InvoicesTranslator,
): string {
  return value ?? t("unnumberedFor", { customer: customerName })
}
