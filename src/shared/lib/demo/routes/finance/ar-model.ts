import { collection, findRow, type Row } from "../../demo-db"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { toBase } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"

/**
 * Receivables computed from the open documents on every request, so every
 * screen (Finance home, AR overview, customer card, collections, the
 * assistant) reads the same live figures after a receipt, credit note or
 * write-off.
 */

export const r2 = (value: number) => Math.round(value * 100) / 100

export type AgingBucketId = "current" | "1-30" | "31-60" | "61-90" | "90+"

export const AGING_BUCKETS: { id: AgingBucketId; label: string }[] = [
  { id: "current", label: "Current" },
  { id: "1-30", label: "1–30 days" },
  { id: "31-60", label: "31–60 days" },
  { id: "61-90", label: "61–90 days" },
  { id: "90+", label: "90+ days" },
]

export function daysLate(dueDate: string | null): number {
  if (!dueDate) return 0
  const diff =
    (new Date(`${FIN_TODAY}T00:00:00Z`).getTime() - new Date(`${dueDate}T00:00:00Z`).getTime()) /
    86_400_000
  return Math.max(0, Math.round(diff))
}

export function bucketFor(late: number): AgingBucketId {
  if (late <= 0) return "current"
  if (late <= 30) return "1-30"
  if (late <= 60) return "31-60"
  if (late <= 90) return "61-90"
  return "90+"
}

export function arDocuments(): Row[] {
  return collection(FIN_COLLECTIONS.arDocuments)
}

/** A document as the API returns it: sign-adjusted, restated in EGP, aged. */
export function presentDocument(doc: Row): Row {
  const sign = doc.type === "invoice" ? 1 : -1
  const late = doc.type === "invoice" && Number(doc.outstanding) > 0 ? daysLate(doc.due_date as string | null) : 0
  const currency = String(doc.currency)
  const customer = findRow(FIN_COLLECTIONS.contacts, String(doc.customer_id))
  return {
    ...doc,
    customer_name: customer?.name ?? "",
    gross: sign * Number(doc.gross),
    allocated: sign * Number(doc.allocated),
    outstanding: sign * Number(doc.outstanding),
    outstanding_base: sign * toBase(Number(doc.outstanding), currency),
    days_late: late,
    bucket: doc.type === "invoice" ? bucketFor(late) : "current",
  }
}

export function openDocuments(customerId?: string): Row[] {
  return arDocuments()
    .filter((doc) => Number(doc.outstanding) > 0)
    .filter((doc) => !customerId || doc.customer_id === customerId)
    .map(presentDocument)
}

export type CustomerSummary = {
  id: string
  code: string
  name: string
  currency: string
  terms_days: number
  tax_reg_no: string | null
  credit_limit: number
  open_items: number
  balance: number
  balance_base: number
  overdue: number
  overdue_base: number
  oldest_days_late: number
  oldest_bucket: AgingBucketId
}

export function customerSummary(customer: Row): CustomerSummary {
  const docs = openDocuments(String(customer.id))
  const overdueDocs = docs.filter((doc) => Number(doc.days_late) > 0)
  const oldest = Math.max(0, ...overdueDocs.map((doc) => Number(doc.days_late)))
  return {
    id: String(customer.id),
    code: String(customer.code),
    name: String(customer.name),
    currency: String(customer.currency),
    terms_days: Number(customer.terms_days),
    tax_reg_no: (customer.tax_reg_no as string | null) ?? null,
    credit_limit: Number(customer.credit_limit ?? 0),
    open_items: docs.length,
    balance: r2(docs.reduce((sum, doc) => sum + Number(doc.outstanding), 0)),
    balance_base: r2(docs.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
    overdue: r2(overdueDocs.reduce((sum, doc) => sum + Number(doc.outstanding), 0)),
    overdue_base: r2(overdueDocs.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
    oldest_days_late: oldest,
    oldest_bucket: bucketFor(oldest),
  }
}

export function customers(): Row[] {
  return collection(FIN_COLLECTIONS.contacts).filter((row) => row.kind === "customer")
}

export function arSummaries(): CustomerSummary[] {
  return customers().map(customerSummary)
}

/** Net receivables and overdue in EGP, plus the aging buckets that add up to the net. */
export function arTotals() {
  const docs = openDocuments()
  const buckets = AGING_BUCKETS.map((bucket) => ({
    ...bucket,
    amount: r2(
      docs
        .filter((doc) => doc.bucket === bucket.id)
        .reduce((sum, doc) => sum + Number(doc.outstanding_base), 0),
    ),
  }))
  const overdueDocs = docs.filter((doc) => Number(doc.days_late) > 0)
  return {
    total_base: r2(docs.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
    overdue_base: r2(overdueDocs.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
    overdue_count: overdueDocs.length,
    buckets,
  }
}
