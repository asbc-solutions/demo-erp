import type { CurrencyCode, FinanceTreasury } from "../../../lib/types/common"

export type BankingOverview = {
  total_base: number
  accounts: number
  banks: number
  tills: number
  unmatched_lines: number
  currencies: CurrencyCode[]
  treasuries: FinanceTreasury[]
}

export type MovementSourceType =
  | "receipt"
  | "payment"
  | "transfer"
  | "cheque"
  | "expense"
  | "custody"
  | "statement"
  | "journal"

/** One posting on a treasury. Positive amounts are money in. */
export type TreasuryMovement = {
  id: string
  treasury_id: string
  date: string
  entry: string
  description: string
  source: string
  source_type: MovementSourceType
  source_href: string | null
  amount: number
}

export type TreasuryDetail = FinanceTreasury & {
  opening_balance: number
  days_since_reconciled: number | null
  movements: TreasuryMovement[]
}

// ─── Reconciliation ─────────────────────────────────────────────────────────

export type StatementLine = {
  id: string
  reference: string
  treasury_id: string
  date: string
  description: string
  amount: number
  status: "unmatched" | "matched" | "reconciled"
  matched_entry_id: string | null
  auto?: boolean
}

export type BookEntry = {
  id: string
  entry: string
  treasury_id: string
  date: string
  description: string
  amount: number
  status: "unmatched" | "matched" | "reconciled"
}

export type MatchSuggestion = {
  line_id: string
  entry_id: string
  score: number
  label: "exact" | "likely" | "possible"
  reasons: string[]
}

export type UnmatchedCause = "other_way" | "amount_differs" | "resembles" | "no_candidate"

export type MatchedPair = {
  line: StatementLine
  entry: { id: string | null; entry: string; description: string; amount: number }
  difference: number
  auto: boolean
}

export type ReconciliationWorkspace = {
  treasury: FinanceTreasury
  accounts: { id: string; name: string; unmatched_lines: number }[]
  statement: { items: StatementLine[]; count: number; total: number }
  book: { items: BookEntry[]; count: number; total: number }
  difference: number
  matched: MatchedPair[]
  matched_count: number
  total_count: number
  suggestions: MatchSuggestion[]
  causes: { id: UnmatchedCause; line_ids: string[] }[]
  can_finish: boolean
}

export type ImportedLine = {
  reference: string
  date: string
  memo: string
  amount: number
  match: "auto" | "review" | "duplicate"
}

export type StatementImport = {
  id: string
  treasury_id: string
  treasury_name: string
  currency: CurrencyCode
  imported_at: string
  lines: ImportedLine[]
  parsed: number
  auto_matched: number
  review: number
  skipped: number
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export type Transfer = {
  id: string
  number: string
  date: string
  from_treasury_id: string
  to_treasury_id: string
  from_name: string
  to_name: string
  amount: number
  currency: CurrencyCode
  received: number
  note: string
  entry?: string
}

export type NewTransferPayload = {
  from_treasury_id: string
  to_treasury_id: string
  amount: number
  date: string
  note: string
}

// ─── Cheques ─────────────────────────────────────────────────────────────────

export type ChequeDirection = "received" | "issued"

export type Cheque = {
  id: string
  number: string
  direction: ChequeDirection
  contact_id: string
  party_name: string
  bank: string
  treasury_id: string
  treasury_name: string
  issue_date: string
  due_date: string
  amount: number
  currency: CurrencyCode
  status: string
  history: { status: string; date: string }[]
  days_to_due: number | null
  due_soon: boolean
  next: string[]
  /** The journal entry, once the cheque has collected or cleared. */
  entry: string | null
}

export type ChequeRegister = {
  items: Cheque[]
  count: number
  total_base: number
  due_soon: number
  problems: number
}

export type NewChequePayload = {
  direction: ChequeDirection
  number: string
  contact_id: string
  bank: string
  amount: number
  issue_date: string
  due_date: string
  treasury_id: string
}

export type ChequeBook = {
  id: string
  code: string
  bank: string
  treasury_id: string | null
  first: number
  last: number
  direction: ChequeDirection
  size: number
  used: number
  remaining: number
  next_number: number | null
}

export type NewChequeBookPayload = {
  treasury_id: string
  first: number
  leaves: number
  direction: ChequeDirection
}

// ─── Custody ─────────────────────────────────────────────────────────────────

export type CustodyMovementType = "advance" | "settle" | "return" | "write_off"

export type CustodyHolder = {
  id: string
  employee_id: string
  name: string
  role: string
  treasury_id: string
  since: string | null
  advanced: number
  settled: number
  outstanding: number
  status: "open" | "cleared"
  movements: { id: string; date: string; memo: string; type: CustodyMovementType; amount: number }[]
}

export type CustodyList = {
  items: CustodyHolder[]
  open_count: number
  outstanding: number
  account: string
}

export type Employee = { id: string; code: string; name: string; role: string }

export type NewCustodyPayload = {
  employee_id: string
  amount: number
  treasury_id: string
  date: string
  description: string
}

export type SettleCustodyPayload = {
  expenses: number
  cash_returned: number
  treasury_id: string
  date: string
}
