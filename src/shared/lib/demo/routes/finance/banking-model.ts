import { collection, createRow, findRow, type Row } from "../../demo-db"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { rateFor } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"

/**
 * Treasuries, their movements and the reconciliation counts every screen
 * reads. Balances only change through `postMovement`, which also records the
 * movement, so a treasury's opening balance plus its movements is always its
 * book balance.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

/** New postings are numbered from here, clear of the seeded journal numbers. */
const FIRST_SESSION_ENTRY = 100_300

export type MovementInput = {
  treasury_id: string
  date?: string
  description: string
  source: string
  source_type: string
  source_id?: string | null
  /** Signed, in the treasury's currency: positive in, negative out. */
  amount: number
  /** Legs of one posting (e.g. a transfer) share an entry. */
  entry?: string
}

export function nextEntry(): string {
  const highest = collection(FIN_COLLECTIONS.treasuryMovements)
    .map((row) => Number(String(row.entry).split("-").pop()))
    .filter((value) => value >= FIRST_SESSION_ENTRY)
    .reduce((max, value) => Math.max(max, value), FIRST_SESSION_ENTRY)
  return `JE-2026-${highest + 1}`
}

/** Move money in or out of a treasury and record why. Returns the movement. */
export function postMovement(input: MovementInput): Row {
  const treasury = findRow(FIN_COLLECTIONS.treasuries, input.treasury_id)
  if (!treasury) throw new Error(`Unknown treasury ${input.treasury_id}`)
  const amount = r2(input.amount)
  treasury.balance = r2(Number(treasury.balance) + amount)
  const count = collection(FIN_COLLECTIONS.treasuryMovements).length
  const movement = createRow(FIN_COLLECTIONS.treasuryMovements, {
    treasury_id: treasury.id,
    date: input.date ?? FIN_TODAY,
    entry: input.entry ?? nextEntry(),
    description: input.description,
    source: input.source,
    source_type: input.source_type,
    source_id: input.source_id ?? null,
    amount,
  })
  movement.id = `MV-${String(count + 1).padStart(4, "0")}`
  return movement
}

/** EGP restated in the treasury's currency. */
export function fromBase(treasury: Row, amountBase: number): number {
  return r2(amountBase / rateFor(String(treasury.currency)))
}

export function unmatchedLines(treasuryId?: string): Row[] {
  return collection(FIN_COLLECTIONS.statementLines).filter(
    (line) => line.status === "unmatched" && (!treasuryId || line.treasury_id === treasuryId),
  )
}

/** A treasury as the API returns it: live unmatched count and EGP equivalent. */
export function presentTreasury(treasury: Row): Row {
  const rate = rateFor(String(treasury.currency))
  return {
    ...treasury,
    rate,
    base_balance: r2(Number(treasury.balance) * rate),
    unmatched_lines: unmatchedLines(String(treasury.id)).length,
  }
}

export function presentTreasuries(): Row[] {
  return collection(FIN_COLLECTIONS.treasuries).map(presentTreasury)
}

export type UnreconciledTreasury = { id: string; name: string; count: number; oldest: string }

/** Treasuries with unmatched statement lines, most lines first. */
export function unreconciledTreasuries(): UnreconciledTreasury[] {
  return collection(FIN_COLLECTIONS.treasuries)
    .map((treasury) => {
      const lines = unmatchedLines(String(treasury.id))
      return {
        id: String(treasury.id),
        name: String(treasury.name),
        count: lines.length,
        oldest: lines.map((line) => String(line.date)).sort()[0] ?? "",
      }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function unmatchedTotal(): number {
  return unmatchedLines().length
}

const SOURCE_HREF: Record<string, (movement: Row) => string | null> = {
  receipt: () => "/finance/receipts",
  payment: () => "/finance/payments",
  transfer: () => "/finance/transfers",
  expense: () => "/finance/expenses",
  cheque: (movement) =>
    `/finance/cheques/${String(movement.source_id).startsWith("CHR") ? "received" : "issued"}/${String(movement.source_id)}`,
  custody: (movement) => `/finance/custody/${String(movement.source_id)}`,
  statement: (movement) => `/finance/reconciliation/${String(movement.treasury_id)}`,
  journal: () => null,
}

export function presentMovement(movement: Row): Row {
  return { ...movement, source_href: SOURCE_HREF[String(movement.source_type)]?.(movement) ?? null }
}
