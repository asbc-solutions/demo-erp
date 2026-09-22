import { collection, createRow, findRow, type Row } from "../../demo-db"
import { FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import {
  AP_CONTROL_ACCOUNT,
  AR_CONTROL_ACCOUNT,
  CUSTOMER_ADVANCES_ACCOUNT,
  EMPLOYEE_CUSTODY_ACCOUNT,
  INPUT_VAT_ACCOUNT,
  SUPPLIER_ADVANCES_ACCOUNT,
} from "../../seed/finance/master-data"
import { rateFor } from "../../seed/finance/receivables"
import { fromBase, nextEntry, postMovement, presentMovement } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"
import { documents, totals } from "./subledger-model"

/**
 * The general ledger. Journals come from two places:
 *
 *  - stored journals: manual entries, reversals, templates, recurring drafts,
 *    revaluations and the seeded monthly summaries;
 *  - derived journals: one per treasury movement entry (receipts, payments,
 *    transfers, cheques, expenses, bank entries) that has no stored journal.
 *
 * Accounts owned by another screen (the treasuries, receivables, payables,
 * advances and custody) take their balance from that screen and their opening
 * balance is whatever makes the posted lines reach it. Retained earnings
 * balances the opening position, so debits always equal credits.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export const RETAINED_EARNINGS = "320101"
const ROUNDING_LOSS = "630102"
const ROUNDING_GAIN = "420102"
export const TREASURY_ACCOUNT = /^110[12]\d\d$/

export type JournalLine = { account_code: string; description: string; debit: number; credit: number }

const line = (account: string, amount: number, description = ""): JournalLine =>
  amount >= 0
    ? { account_code: account, description, debit: r2(amount), credit: 0 }
    : { account_code: account, description, debit: 0, credit: r2(-amount) }

/** Where bank entries not yet on a statement post their other side, by description. */
const BANK_ENTRY_COUNTER: [RegExp, string][] = [
  [/payroll/i, "210301"],
  [/bank charges/i, "210302"],
  [/interest/i, "110503"],
  [/standing order out|cheque cleared|supplier payment/i, AP_CONTROL_ACCOUNT],
]

function counterForBankEntry(description: string): string {
  return BANK_ENTRY_COUNTER.find(([pattern]) => pattern.test(description))?.[1] ?? AR_CONTROL_ACCOUNT
}

export function storedJournals(): Row[] {
  return collection(FIN_COLLECTIONS.journals)
}

function treasuryByAccount(code: string): Row | undefined {
  return collection(FIN_COLLECTIONS.treasuries).find((row) => row.account_code === code)
}

/** Counter lines for one treasury movement, in EGP. */
function counterLines(movement: Row, base: number): JournalLine[] {
  switch (movement.source_type) {
    case "receipt":
      return [line(AR_CONTROL_ACCOUNT, -base, String(movement.description))]
    case "payment":
      return [line(AP_CONTROL_ACCOUNT, -base, String(movement.description))]
    case "cheque":
      return [line(base > 0 ? AR_CONTROL_ACCOUNT : AP_CONTROL_ACCOUNT, -base, String(movement.description))]
    case "custody":
      return [line(EMPLOYEE_CUSTODY_ACCOUNT, -base, String(movement.description))]
    case "expense": {
      const expense = findRow(FIN_COLLECTIONS.expenses, String(movement.source_id))
      if (!expense) return [line("620110", -base)]
      return [
        line(String(expense.account_code), Number(expense.net), String(expense.description)),
        line(INPUT_VAT_ACCOUNT, Number(expense.vat), "Input VAT"),
      ]
    }
    case "statement": {
      const entry = findRow(FIN_COLLECTIONS.bookEntries, String(movement.entry))
      return [line(String(entry?.counter_account ?? "2199"), -base, String(movement.description))]
    }
    case "journal":
      return [line(counterForBankEntry(String(movement.description)), -base, String(movement.description))]
    default:
      return []
  }
}

function describeGroup(movements: Row[]): string {
  const first = movements[0]
  if (first.source_type === "transfer") {
    const out = movements.find((row) => Number(row.amount) < 0)
    const into = movements.find((row) => Number(row.amount) > 0)
    const name = (row?: Row) => findRow(FIN_COLLECTIONS.treasuries, String(row?.treasury_id))?.name ?? ""
    return `Transfer ${String(name(out))} → ${String(name(into))}`
  }
  if (first.source_type === "payment" && movements.length > 1) {
    return `Payment run — ${movements.length} supplier payments via ${String(findRow(FIN_COLLECTIONS.treasuries, String(first.treasury_id))?.name ?? "")}`
  }
  return String(first.description)
}

/** Journals built from treasury movements that have no stored journal of their own. */
function derivedJournals(): Row[] {
  const stored = new Set(storedJournals().map((row) => String(row.number)))
  const reversed = new Set(storedJournals().map((row) => row.reversal_of).filter(Boolean).map(String))
  const groups = new Map<string, Row[]>()
  for (const movement of collection(FIN_COLLECTIONS.treasuryMovements)) {
    const entry = String(movement.entry)
    if (stored.has(entry)) continue
    groups.set(entry, [...(groups.get(entry) ?? []), movement])
  }

  return Array.from(groups, ([entry, movements]) => {
    const currencies = new Set<string>()
    let lines: JournalLine[] = []
    for (const movement of movements) {
      const treasury = findRow(FIN_COLLECTIONS.treasuries, String(movement.treasury_id))
      const currency = String(treasury?.currency ?? "EGP")
      currencies.add(currency)
      const base = r2(Number(movement.amount) * rateFor(currency))
      lines.push(line(String(treasury?.account_code ?? ""), base, String(movement.description)))
      lines.push(...counterLines(movement, base))
    }
    const residual = r2(lines.reduce((sum, row) => sum + row.debit - row.credit, 0))
    if (Math.abs(residual) >= 0.01) {
      lines.push(line(residual > 0 ? ROUNDING_GAIN : ROUNDING_LOSS, -residual, "Rounding"))
    }
    // A journal on one foreign-currency account is kept in that currency.
    const [only] = [...currencies]
    const foreign = currencies.size === 1 && only !== "EGP"
    const rate = foreign ? rateFor(only) : 1
    if (foreign) {
      lines = lines.map((row) => ({ ...row, debit: r2(row.debit / rate), credit: r2(row.credit / rate) }))
    }
    const first = movements[movements.length - 1]
    const origin = first.source_type === "transfer" || first.source_type === "statement" ? "manual" : "auto"
    return {
      id: entry,
      number: entry,
      date: movements.map((row) => String(row.date)).sort()[0],
      period: String(first.date).slice(0, 7),
      description: describeGroup(movements),
      source: first.source_type === "journal" ? "Bank entry" : String(first.source),
      source_type: String(first.source_type),
      source_href: first.source_type === "journal" ? null : presentMovement(first).source_href,
      origin,
      currency: foreign ? only : "EGP",
      rate,
      status: reversed.has(entry) ? "reversed" : "posted",
      lines,
      created_by: origin === "manual" ? FIN_ACTOR : "System",
      posted_by: origin === "manual" ? FIN_ACTOR : "System",
      posted_at: `${String(first.date)}T12:00:00.000Z`,
      reversal_of: null,
      reason: null,
      derived: true,
    }
  })
}

/** Every journal, newest first. */
export function allJournals(): Row[] {
  const stored = storedJournals().map((row): Row => ({
    ...row,
    status: row.status === "posted" && storedJournals().some((other) => other.reversal_of === row.number) ? "reversed" : row.status,
  }))
  return [...stored, ...derivedJournals()].sort(
    (a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)),
  )
}

export function findJournal(number: string): Row | undefined {
  return allJournals().find((row) => row.number === number)
}

/** Debit and credit totals of a journal, in its own currency and in EGP. */
export function journalTotals(journal: Row) {
  const lines = (journal.lines as JournalLine[]) ?? []
  const debit = r2(lines.reduce((sum, row) => sum + row.debit, 0))
  const credit = r2(lines.reduce((sum, row) => sum + row.credit, 0))
  const rate = Number(journal.rate ?? 1)
  return { debit, credit, debit_base: r2(debit * rate), credit_base: r2(credit * rate) }
}

const counts = (status: string) => (journal: Row) => journal.status === status || (status === "posted" && journal.status === "reversed")

export type PostedLine = {
  entry: string
  date: string
  period: string
  description: string
  source: string
  account_code: string
  debit: number
  credit: number
}

/** Posted lines in EGP; reversed journals still count (their reversal offsets them). */
export function postedLines(): PostedLine[] {
  const rows: PostedLine[] = []
  for (const journal of allJournals().filter(counts("posted"))) {
    const rate = Number(journal.rate ?? 1)
    for (const entry of journal.lines as JournalLine[]) {
      rows.push({
        entry: String(journal.number),
        date: String(journal.date),
        period: String(journal.period ?? String(journal.date).slice(0, 7)),
        description: entry.description || String(journal.description),
        source: String(journal.source ?? ""),
        account_code: entry.account_code,
        debit: r2(entry.debit * rate),
        credit: r2(entry.credit * rate),
      })
    }
  }
  return rows
}

function advancesBase(side: "receivable" | "payable"): number {
  return r2(
    documents(side)
      .filter((doc) => doc.type === "advance")
      .reduce((sum, doc) => sum + Number(doc.outstanding) * rateFor(String(doc.currency)), 0),
  )
}

function custodyOutstanding(): number {
  return r2(
    collection(FIN_COLLECTIONS.custody).reduce(
      (sum, holder) => sum + ((holder.movements as Row[]) ?? []).reduce((inner, row) => inner + Number(row.amount), 0),
      0,
    ),
  )
}

/** Balances read from the screen that owns the account, debit positive. */
function ownedBalance(code: string): number | null {
  const treasury = treasuryByAccount(code)
  if (treasury) return r2(Number(treasury.balance) * rateFor(String(treasury.currency)))
  if (code === AR_CONTROL_ACCOUNT) return totals("receivable").total_base
  if (code === AP_CONTROL_ACCOUNT) return -totals("payable").total_base
  if (code === CUSTOMER_ADVANCES_ACCOUNT) return -advancesBase("receivable")
  if (code === SUPPLIER_ADVANCES_ACCOUNT) return advancesBase("payable")
  if (code === EMPLOYEE_CUSTODY_ACCOUNT) return custodyOutstanding()
  return null
}

export function isOwnedAccount(code: string): boolean {
  return ownedBalance(code) !== null
}

export type AccountBalance = { opening: number; debit: number; credit: number; closing: number }

/** Opening, posted movement and closing for every postable account, in EGP. */
export function accountBalances(): Map<string, AccountBalance> {
  const lines = new Map<string, { debit: number; credit: number }>()
  for (const entry of postedLines()) {
    const current = lines.get(entry.account_code) ?? { debit: 0, credit: 0 }
    lines.set(entry.account_code, { debit: r2(current.debit + entry.debit), credit: r2(current.credit + entry.credit) })
  }
  const openings = new Map(collection(FIN_COLLECTIONS.ledgerOpenings).map((row) => [String(row.account_code), Number(row.amount)]))
  const result = new Map<string, AccountBalance>()
  let openingSum = 0
  for (const account of collection(FIN_COLLECTIONS.accounts).filter((row) => !row.is_group)) {
    const code = String(account.code)
    if (code === RETAINED_EARNINGS) continue
    const moved = lines.get(code) ?? { debit: 0, credit: 0 }
    const net = r2(moved.debit - moved.credit)
    const owned = ownedBalance(code)
    const opening = owned !== null ? r2(owned - net) : (openings.get(code) ?? 0)
    openingSum = r2(openingSum + opening)
    result.set(code, { opening, debit: moved.debit, credit: moved.credit, closing: r2(opening + net) })
  }
  const moved = lines.get(RETAINED_EARNINGS) ?? { debit: 0, credit: 0 }
  const opening = r2(-openingSum)
  result.set(RETAINED_EARNINGS, {
    opening,
    debit: moved.debit,
    credit: moved.credit,
    closing: r2(opening + moved.debit - moved.credit),
  })
  return result
}

const PL_CLASSES = new Set(["4", "5", "6"])

/** Profit (positive) or loss for a period, from posted P&L lines. */
export function periodResult(period: string): number {
  return r2(
    -postedLines()
      .filter((entry) => entry.period === period && PL_CLASSES.has(entry.account_code[0]))
      .reduce((sum, entry) => sum + entry.debit - entry.credit, 0),
  )
}

// ─── Posting ─────────────────────────────────────────────────────────────────

export function validateLines(lines: JournalLine[]): string | null {
  if (lines.length < 2) return "An entry needs at least two lines."
  for (const entry of lines) {
    const account = findRow(FIN_COLLECTIONS.accounts, entry.account_code)
    if (!account || account.is_group) return `Account ${entry.account_code || "(blank)"} cannot be posted to.`
    if (entry.debit < 0 || entry.credit < 0) return "Amounts cannot be negative."
    if ((entry.debit > 0) === (entry.credit > 0)) return "Each line is either a debit or a credit."
  }
  const debit = r2(lines.reduce((sum, row) => sum + row.debit, 0))
  const credit = r2(lines.reduce((sum, row) => sum + row.credit, 0))
  if (debit !== credit) return `This entry doesn't balance. Debits total ${debit.toFixed(2)} and credits ${credit.toFixed(2)}.`
  return null
}

/** Cash legs of a posted journal move their treasury, sharing the journal's number. */
function postCashLegs(journal: Row) {
  const rate = Number(journal.rate ?? 1)
  for (const entry of journal.lines as JournalLine[]) {
    const treasury = treasuryByAccount(entry.account_code)
    if (!treasury || journal.revaluation) continue
    postMovement({
      treasury_id: String(treasury.id),
      date: String(journal.date),
      description: entry.description || String(journal.description),
      source: String(journal.number),
      source_type: "journal",
      source_id: String(journal.number),
      amount: fromBase(treasury, r2((entry.debit - entry.credit) * rate)),
      entry: String(journal.number),
    })
  }
}

export type NewJournal = {
  date: string
  description: string
  lines: JournalLine[]
  status: "draft" | "pending" | "posted"
  origin?: "manual" | "auto"
  source?: string
  source_type?: string
  reversal_of?: string | null
  reason?: string | null
  revaluation?: boolean
}

export function createJournal(input: NewJournal): Row {
  const number = nextEntry()
  const journal = createRow(FIN_COLLECTIONS.journals, {
    number,
    date: input.date,
    period: input.date.slice(0, 7),
    description: input.description,
    source: input.source ?? "Manual",
    source_type: input.source_type ?? "manual",
    origin: input.origin ?? "manual",
    currency: "EGP",
    rate: 1,
    status: input.status,
    lines: input.lines.map((row) => ({ ...row, debit: r2(row.debit), credit: r2(row.credit) })),
    created_by: FIN_ACTOR,
    posted_by: input.status === "posted" ? FIN_ACTOR : null,
    posted_at: input.status === "posted" ? FIN_NOW : null,
    submitted_at: input.status === "pending" ? FIN_NOW : null,
    reversal_of: input.reversal_of ?? null,
    reason: input.reason ?? null,
    revaluation: Boolean(input.revaluation),
  })
  journal.id = number
  if (input.status === "posted") postCashLegs(journal)
  return journal
}

/** Post a stored draft or pending journal. */
export function postStored(journal: Row) {
  Object.assign(journal, { status: "posted", posted_by: FIN_ACTOR, posted_at: FIN_NOW })
  postCashLegs(journal)
}

/** A mirror entry on the given date; the original stays, marked reversed. */
export function reverseJournal(journal: Row, date: string, reason: string): Row {
  const lines = (journal.lines as JournalLine[]).map((row) => ({
    account_code: row.account_code,
    description: row.description,
    debit: r2(row.credit * Number(journal.rate ?? 1)),
    credit: r2(row.debit * Number(journal.rate ?? 1)),
  }))
  return createJournal({
    date: date || FIN_TODAY,
    description: `Reversal of ${String(journal.number)} — ${String(journal.description)}`,
    lines,
    status: "posted",
    source: String(journal.number),
    source_type: "reversal",
    reversal_of: String(journal.number),
    reason,
  })
}
