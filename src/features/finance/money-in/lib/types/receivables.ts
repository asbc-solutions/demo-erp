import type { CurrencyCode } from "../../../lib/types/common"

export type AgingBucketId = "current" | "1-30" | "31-60" | "61-90" | "90+"

export type ArDocumentType = "invoice" | "credit_note" | "advance"

/** An open receivables document. Credits carry negative amounts. */
export type ArDocument = {
  id: string
  number: string
  type: ArDocumentType
  customer_id: string
  customer_name: string
  currency: CurrencyCode
  date: string
  due_date: string | null
  gross: number
  allocated: number
  outstanding: number
  outstanding_base: number
  days_late: number
  bucket: AgingBucketId
  status: string
}

export type CustomerSummary = {
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
  oldest_days_late: number
  oldest_bucket: AgingBucketId
}

export type ArOverview = {
  total_base: number
  overdue_base: number
  overdue_count: number
  buckets: { id: AgingBucketId; label: string; amount: number }[]
  control_account: string
  documents_base: number
  ledger_base: number
  customers: CustomerSummary[]
}

export type CustomerCard = CustomerSummary & {
  rate: number
  control_account: string
  items: ArDocument[]
}

export type Collections = {
  overdue_base: number
  overdue_count: number
  over90_base: number
  over90_count: number
  items: ArDocument[]
}

export type CreditDocument = {
  id: string
  number: string
  type: "credit_note" | "advance"
  customer_id: string
  customer_name: string
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
  liability_account?: string
}

export type Receipt = {
  id: string
  number: string
  date: string
  customer_id: string
  customer_name: string
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

export type ReceiptList = {
  items: Receipt[]
  count: number
  total_base: number
  average_base: number
  unallocated_count: number
}

export type NewReceiptPayload = {
  customer_id: string
  treasury_id: string
  amount: number
  date: string
  description: string
}

export type PostReceiptPayload = {
  customer_id: string
  treasury_id: string
  amount: number
  allocations: { invoice_id: string; amount: number }[]
}

export type PostedReceipt = Receipt & { unapplied: number }

export type NewCreditNotePayload = {
  customer_id: string
  amount: number
  date: string
  reason: string
}
