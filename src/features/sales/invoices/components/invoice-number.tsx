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
const PLACEHOLDER = "Not yet numbered"

function hint(status: InvoiceStatus): string {
  if (status === "cancelled") {
    return "This invoice was cancelled before it was posted, so it was never assigned a number."
  }
  if (status === "draft") {
    return "The invoice number is assigned when the invoice is posted."
  }
  return "This invoice has no number — it was never posted."
}

export function InvoiceNumber({
  value,
  status,
  className,
}: Readonly<{ value: string | null; status: InvoiceStatus; className?: string }>) {
  if (value) return <span className={className}>{value}</span>

  const title = hint(status)
  return (
    <span
      className={cn("font-sans font-normal text-content-quaternary italic", className)}
      title={title}
      aria-label={title}
    >
      {PLACEHOLDER}
    </span>
  )
}

/** Screen-reader / clipboard label for an invoice that may not have a number yet. */
export function invoiceLabel(value: string | null, customerName: string): string {
  return value ?? `unnumbered invoice for ${customerName}`
}
