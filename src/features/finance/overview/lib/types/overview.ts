import type { AttentionItem, CurrencyCode } from "../../../lib/types/common"

export type CashWeek = {
  id: string
  week: string
  closing: number
  net_movement: number
  forecast: boolean
}

export type CloseTaskStatus = "done" | "in_progress" | "blocked" | "not_started"

export type CloseTask = {
  id: string
  position: number
  title: string
  status: CloseTaskStatus
  owner: string
  href: string
}

export type ActivityEvent = {
  id: string
  at: string
  actor: string
  action: string
  subject: string
}

export type FinanceHome = {
  cash: { total: number; currency: CurrencyCode; accounts: number; updated_at: string }
  receivables: { outstanding: number; overdue: number }
  payables: { outstanding: number; due_this_week: number }
  net_result: { period_label: string; amount: number }
  attention: AttentionItem[]
  cash_weeks: CashWeek[]
  close: { period_label: string; done: number; total: number; tasks: CloseTask[] }
  activity: ActivityEvent[]
}

export type TreasuryKind = "bank" | "cash"

export type TreasuryPosition = {
  id: string
  kind: TreasuryKind
  name: string
  account_code: string
  currency: CurrencyCode
  balance: number
  base_amount: number
  unmatched_lines: number
}

export type CashPosition = {
  total: number
  base_currency: CurrencyCode
  banks: { amount: number; count: number }
  cash_on_hand: { amount: number; count: number }
  currencies: { code: CurrencyCode; amount: number; base_amount: number }[]
  unreconciled_lines: number
  treasuries: TreasuryPosition[]
}

export type BillStatus = "pending_approval" | "approved" | "revised"

export type PendingBill = {
  id: string
  number: string
  supplier_id: string
  supplier_name: string
  amount: number
  currency: CurrencyCode
  due_date: string
  status: BillStatus
}

export type CloseReadinessCheck = {
  id: string
  title: string
  detail: string
  href: string
}

export type CloseReadiness = {
  period_label: string
  checks: CloseReadinessCheck[]
}

export type FinanceException = {
  id: string
  label: string
  href: string
}
