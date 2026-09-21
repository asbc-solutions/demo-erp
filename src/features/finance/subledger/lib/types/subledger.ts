import type { CurrencyCode } from "../../../lib/types/common"

/** Receivables (customers) and payables (suppliers) share one document model. */
export type Side = "receivable" | "payable"

export type AgingBucketId = "current" | "1-30" | "31-60" | "61-90" | "90+"

export type SubledgerDocumentType = "invoice" | "bill" | "credit_note" | "debit_note" | "advance"

/** An open subledger document. Notes and advances carry negative amounts. */
export type SubledgerDocument = {
  id: string
  number: string
  type: SubledgerDocumentType
  contact_id: string
  contact_name: string
  currency: CurrencyCode
  date: string
  due_date: string | null
  gross: number
  allocated: number
  outstanding: number
  outstanding_base: number
  days_late: number
  bucket: AgingBucketId
  /** Advances sit on their own account and are listed, not netted into the balance. */
  in_balance: boolean
  status: string
  approval?: "pending" | "approved" | "returned"
}

export type ContactSummary = {
  id: string
  code: string
  name: string
  currency: CurrencyCode
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

export type SubledgerOverview = {
  total_base: number
  overdue_base: number
  overdue_count: number
  buckets: { id: AgingBucketId; label: string; amount: number }[]
  control_account: string
  documents_base: number
  ledger_base: number
  contacts: ContactSummary[]
}

export type ContactCard = ContactSummary & {
  rate: number
  control_account: string
  advances_account: string
  items: SubledgerDocument[]
}

/** Credit or debit notes, and advances: credits on the contact's account waiting to be applied. */
export type CreditDocument = {
  id: string
  number: string
  type: "credit_note" | "debit_note" | "advance"
  contact_id: string
  contact_name: string
  currency: CurrencyCode
  date: string
  gross: number
  allocated: number
  outstanding: number
  gross_base: number
  unapplied_base: number
  status: string
}

export type CreditList = {
  items: CreditDocument[]
  count: number
  open_count: number
  total_base: number
  unapplied_base: number
  advances_account?: string
}

/** A receipt or payment voucher. */
export type Voucher = {
  id: string
  number: string
  date: string
  contact_id: string
  contact_name: string
  treasury_id: string
  treasury_name: string
  description: string
  origin: "auto" | "manual"
  amount: number
  amount_base: number
  currency: CurrencyCode
  status: "posted" | "draft"
  allocation: "allocated" | "unallocated"
}

export type VoucherList = {
  items: Voucher[]
  count: number
  total_base: number
  average_base: number
  unallocated_count: number
}

export type NewVoucherPayload = {
  contact_id: string
  treasury_id: string
  amount: number
  date: string
  description: string
}

export type NewNotePayload = {
  contact_id: string
  amount: number
  date: string
  reason: string
}
