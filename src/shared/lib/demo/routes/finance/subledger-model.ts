import { collection, findRow, type Row } from "../../demo-db"
import { FIN_TODAY } from "../../seed/finance/calendar"
import {
  AP_CONTROL_ACCOUNT,
  AR_CONTROL_ACCOUNT,
  CUSTOMER_ADVANCES_ACCOUNT,
  SUPPLIER_ADVANCES_ACCOUNT,
} from "../../seed/finance/master-data"
import { toBase } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"

/**
 * Receivables and payables computed from the open documents on every request,
 * so every screen (Finance home, the AR/AP overviews, contact cards,
 * collections, payment runs, the assistant) reads the same live figures after
 * a receipt, payment, note or write-off.
 *
 * Primary documents (invoices, bills) carry the balance; notes are netted
 * against it; advances are listed with the contact but held on their own
 * account, so they never change the subledger balance.
 */

export const r2 = (value: number) => Math.round(value * 100) / 100

export type Side = "receivable" | "payable"

type SideConfig = {
  documents: string
  vouchers: string
  contactKind: "customer" | "supplier"
  primary: "invoice" | "bill"
  note: "credit_note" | "debit_note"
  controlAccount: string
  advancesAccount: string
}

export const SIDES: Record<Side, SideConfig> = {
  receivable: {
    documents: FIN_COLLECTIONS.arDocuments,
    vouchers: FIN_COLLECTIONS.receipts,
    contactKind: "customer",
    primary: "invoice",
    note: "credit_note",
    controlAccount: AR_CONTROL_ACCOUNT,
    advancesAccount: CUSTOMER_ADVANCES_ACCOUNT,
  },
  payable: {
    documents: FIN_COLLECTIONS.apDocuments,
    vouchers: FIN_COLLECTIONS.payments,
    contactKind: "supplier",
    primary: "bill",
    note: "debit_note",
    controlAccount: AP_CONTROL_ACCOUNT,
    advancesAccount: SUPPLIER_ADVANCES_ACCOUNT,
  },
}

export type AgingBucketId = "current" | "1-30" | "31-60" | "61-90" | "90+"

export const AGING_BUCKETS: { id: AgingBucketId; label: string }[] = [
  { id: "current", label: "Current" },
  { id: "1-30", label: "1–30 days" },
  { id: "31-60", label: "31–60 days" },
  { id: "61-90", label: "61–90 days" },
  { id: "90+", label: "90+ days" },
]

function dayDiff(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  )
}

export function daysLate(dueDate: string | null): number {
  return dueDate ? Math.max(0, dayDiff(dueDate, FIN_TODAY)) : 0
}

export function bucketFor(late: number): AgingBucketId {
  if (late <= 0) return "current"
  if (late <= 30) return "1-30"
  if (late <= 60) return "31-60"
  if (late <= 90) return "61-90"
  return "90+"
}

export function documents(side: Side): Row[] {
  return collection(SIDES[side].documents)
}

/** Open means something is still owed — and, for payables, the bill has not been sent back. */
function isOpen(doc: Row): boolean {
  return Number(doc.outstanding) > 0 && doc.approval !== "returned"
}

/** A document as the API returns it: sign-adjusted, restated in EGP, aged. */
export function presentDocument(side: Side, doc: Row): Row {
  const primary = doc.type === SIDES[side].primary
  const sign = primary ? 1 : -1
  const late = primary && Number(doc.outstanding) > 0 ? daysLate(doc.due_date as string | null) : 0
  const contact = findRow(FIN_COLLECTIONS.contacts, String(doc.contact_id))
  return {
    ...doc,
    contact_name: contact?.name ?? "",
    gross: sign * Number(doc.gross),
    allocated: sign * Number(doc.allocated),
    outstanding: sign * Number(doc.outstanding),
    outstanding_base: sign * toBase(Number(doc.outstanding), String(doc.currency)),
    days_late: late,
    bucket: primary ? bucketFor(late) : "current",
    in_balance: doc.type !== "advance",
  }
}

export function openDocuments(side: Side, contactId?: string): Row[] {
  return documents(side)
    .filter(isOpen)
    .filter((doc) => !contactId || doc.contact_id === contactId)
    .map((doc) => presentDocument(side, doc))
}

const sumBase = (docs: Row[]) => r2(docs.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0))
const sumDoc = (docs: Row[]) => r2(docs.reduce((sum, doc) => sum + Number(doc.outstanding), 0))

export type ContactSummary = {
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
  advances_base: number
  oldest_days_late: number
  oldest_bucket: AgingBucketId
}

export function contactSummary(side: Side, contact: Row): ContactSummary {
  const docs = openDocuments(side, String(contact.id))
  const inBalance = docs.filter((doc) => doc.in_balance)
  const overdue = docs.filter((doc) => Number(doc.days_late) > 0)
  const oldest = Math.max(0, ...overdue.map((doc) => Number(doc.days_late)))
  return {
    id: String(contact.id),
    code: String(contact.code),
    name: String(contact.name),
    currency: String(contact.currency),
    terms_days: Number(contact.terms_days),
    tax_reg_no: (contact.tax_reg_no as string | null) ?? null,
    credit_limit: Number(contact.credit_limit ?? 0),
    open_items: docs.length,
    balance: sumDoc(inBalance),
    balance_base: sumBase(inBalance),
    overdue: sumDoc(overdue),
    overdue_base: sumBase(overdue),
    advances_base: -sumBase(docs.filter((doc) => !doc.in_balance)),
    oldest_days_late: oldest,
    oldest_bucket: bucketFor(oldest),
  }
}

export function contacts(side: Side): Row[] {
  return collection(FIN_COLLECTIONS.contacts).filter((row) => row.kind === SIDES[side].contactKind)
}

export function summaries(side: Side): ContactSummary[] {
  return contacts(side).map((contact) => contactSummary(side, contact))
}

/** Subledger balance and overdue in EGP, plus aging buckets that add up to the balance. */
export function totals(side: Side) {
  const docs = openDocuments(side).filter((doc) => doc.in_balance)
  const overdue = docs.filter((doc) => Number(doc.days_late) > 0)
  return {
    total_base: sumBase(docs),
    overdue_base: sumBase(overdue),
    overdue_count: overdue.length,
    buckets: AGING_BUCKETS.map((bucket) => ({
      ...bucket,
      amount: sumBase(docs.filter((doc) => doc.bucket === bucket.id)),
    })),
  }
}

/** Primary documents falling due within the next `days` days (not yet overdue). */
export function dueWithin(side: Side, days: number): number {
  return sumBase(
    openDocuments(side).filter((doc) => {
      if (doc.type !== SIDES[side].primary || !doc.due_date) return false
      const ahead = dayDiff(FIN_TODAY, String(doc.due_date))
      return ahead >= 0 && ahead <= days
    }),
  )
}
