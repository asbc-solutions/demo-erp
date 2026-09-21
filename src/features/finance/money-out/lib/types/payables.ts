import type { CurrencyCode } from "../../../lib/types/common"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"

export type ApprovalQueue = {
  items: SubledgerDocument[]
  count: number
  total_base: number
  approved_today: number
  sent_back: number
  threshold: number
}

export type PaymentRunCandidates = {
  items: SubledgerDocument[]
  payables_account: string
}

export type PostPaymentRunPayload = {
  treasury_id: string
  bill_ids: string[]
}

export type PaymentRunResult = {
  number: string
  bill_count: number
  supplier_count: number
  total_base: number
  treasury_id: string
  treasury_name: string
  payment_numbers: string[]
}

export type ExpenseStatus = "awaiting_approval" | "posted"

export type Expense = {
  id: string
  number: string
  merchant: string
  description: string
  date: string
  treasury_id: string
  treasury_name: string
  treasury_account: string
  account_code: string
  account_name: string
  amount: number
  net: number
  vat: number
  currency: CurrencyCode
  status: ExpenseStatus
}

export type ExpenseAccount = { code: string; name: string }

export type ExpenseList = {
  items: Expense[]
  awaiting_count: number
  vat_rate: number
  vat_account: string
  accounts: ExpenseAccount[]
}

export type NewExpensePayload = {
  merchant: string
  description: string
  amount: number
  date: string
  treasury_id: string
  account_code: string
  has_receipt: boolean
}
