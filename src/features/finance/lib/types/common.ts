/**
 * Types shared by every finance section. Section-specific shapes live next to
 * their section under `features/finance/<section>/lib/types`.
 */

export type CurrencyCode = "EGP" | "USD" | "EUR" | "SAR" | "AED" | "GBP"

/** `YYYY-MM`, the key of an accounting period. */
export type PeriodKey = string

export type PeriodStatus = "open" | "closing" | "closed" | "locked" | "future"

export type FinanceEntity = {
  id: string
  code: string
  name: string
  base_currency: CurrencyCode
}

export type FinancePeriod = {
  id: PeriodKey
  label: string
  status: PeriodStatus
  start_date: string
  end_date: string
}

/** The entity and period every finance screen is scoped to. */
export type FinanceScope = {
  entityId: string
  period: PeriodKey
}

/** An amount in a document currency, optionally restated in the entity's base currency. */
export type Money = {
  amount: number
  currency: CurrencyCode
  base_amount?: number
  rate?: number
}

export type ContactKind = "customer" | "supplier" | "both" | "employee"

export type FinanceContact = {
  id: string
  code: string
  name: string
  kind: ContactKind
  tax_reg_no: string | null
  currency: CurrencyCode
  terms_days: number
  credit_limit?: number
}

export type FinanceTreasury = {
  id: string
  code: string
  kind: "bank" | "cash"
  name: string
  /** The bank's short name ("CIB"); null for cash treasuries. */
  bank: string | null
  account_code: string
  /** Last four digits of the bank account number. */
  account_last4: string | null
  currency: CurrencyCode
  balance: number
  /** EGP equivalent at the current rate. */
  base_balance: number
  rate: number
  last_reconciled: string | null
  /** Statement lines not yet matched to a book entry, counted live. */
  unmatched_lines: number
}

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense"

export type FinanceAccount = {
  id: string
  code: string
  name: string
  type: AccountType
  parent_code: string | null
  is_group: boolean
  currency: CurrencyCode | null
}

export type AttentionTone = "danger" | "warning" | "info"

export type AttentionItem = {
  id: string
  label: string
  count: number
  tone: AttentionTone
  href?: string
}

export type HistoryEvent = {
  id: string
  title: string
  actor: string
  at: string
  reference?: string
}
