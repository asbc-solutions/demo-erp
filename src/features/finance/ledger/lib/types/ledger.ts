import type { Messages, useTranslations } from "next-intl"

import type { AccountType, CurrencyCode } from "../../../lib/types/common"

export type LedgerTranslator = ReturnType<typeof useTranslations<"FinanceLedger">>

type LedgerMessages = Messages["FinanceLedger"]
/** A flat (non-enum-map) key of the `FinanceLedger` namespace. */
export type LedgerMessageKey = {
  [K in keyof LedgerMessages]: LedgerMessages[K] extends string ? K : never
}[keyof LedgerMessages]

export type LedgerAccount = {
  id: string
  code: string
  name: string
  type: AccountType
  parent_code: string | null
  is_group: boolean
  level: number
  /** "auto" when another screen owns the balance (treasuries, subledgers, custody). */
  routing: "auto" | "manual"
  debit: number
  credit: number
  balance: number
}

export type JournalStatus = "draft" | "pending" | "posted" | "reversed"

export type JournalLine = {
  account_code: string
  account_name?: string
  description: string
  debit: number
  credit: number
}

export type JournalSummary = {
  id: string
  number: string
  date: string
  period: string
  description: string
  source: string
  source_type: string
  source_href?: string | null
  origin: "auto" | "manual"
  currency: CurrencyCode
  rate: number
  status: JournalStatus
  debit: number
  credit: number
  debit_base: number
  credit_base: number
  line_count: number
}

export type JournalList = {
  items: JournalSummary[]
  total: number
  by_status: { status: JournalStatus; count: number }[]
  currencies: CurrencyCode[]
}

export type JournalDetail = Omit<JournalSummary, "line_count"> & {
  lines: JournalLine[]
  created_by: string
  posted_by: string | null
  posted_at: string | null
  submitted_at?: string | null
  reversal_of: string | null
  reversed_by: string | null
  reason: string | null
  can_reverse: boolean
  editable: boolean
  derived?: boolean
}

export type JournalFilters = { status: string; origin: string; currency: string; q: string }

export type NewJournalPayload = {
  date: string
  description: string
  status: "draft" | "pending" | "posted"
  lines: JournalLine[]
}

export type LedgerLine = {
  entry: string
  date: string
  description: string
  source: string
  debit: number
  credit: number
  balance: number
}

export type GeneralLedger = {
  account: { code: string; name: string; type: AccountType; normal_side: "debit" | "credit" }
  contact_name: string | null
  opening: number
  lines: LedgerLine[]
  debit_total: number
  credit_total: number
  closing: number
}

export type TemplateLine = { account_code: string; account_name: string; side: "debit" | "credit"; share: number }

export type JournalTemplate = {
  id: string
  code: string
  name: string
  amount: number
  cadence: "ad_hoc" | "monthly" | "quarterly"
  lines: TemplateLine[]
}

export type NewTemplatePayload = {
  name: string
  debit_account: string
  credit_account: string
  amount: number
  cadence: string
}

export type RecurringJournal = {
  id: string
  name: string
  cadence: "monthly" | "quarterly"
  next_run: string
  debit_account: string
  debit_name: string
  credit_account: string
  credit_name: string
  amount: number
  status: "active" | "paused"
}

export type RecurringList = {
  items: RecurringJournal[]
  active_count: number
  monthly_value: number
  next_run: string | null
  next_run_names: string[]
}

export type NewRecurringPayload = {
  name: string
  cadence: "monthly" | "quarterly"
  next_run: string
  debit_account: string
  credit_account: string
  amount: number
}

export type OpeningBalances = {
  as_at: string
  items: { code: string; name: string; normal_side: "debit" | "credit"; debit: number; credit: number; owned: boolean }[]
  debit: number
  credit: number
  difference: number
  locked: boolean
  locked_at: string | null
}

export type CurrencyRow = {
  id: string
  code: CurrencyCode
  name: string
  rate_to_base: number
  is_base: boolean
  symbol: string
  decimals: number
}

export type CurrencyList = {
  items: CurrencyRow[]
  fixings: { date: string; rate: number }[]
  refreshed_at: string
}

export type RevaluationRow = {
  treasury_id: string
  name: string
  account_code: string
  currency: CurrencyCode
  balance: number
  book_rate: number
  spot_rate: number
  unrealized: number
}

export type FxRevaluation = {
  date: string
  items: RevaluationRow[]
  net: number
  posted: { journal: string; date: string; net: number }[]
}

export type ImportKind = "tax_codes" | "cost_centers" | "dimensions"
