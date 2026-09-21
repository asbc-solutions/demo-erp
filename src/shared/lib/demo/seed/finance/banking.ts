import type { Row } from "../../demo-db"
import { FIN_CONTACT_ROWS, FIN_TREASURY_ROWS } from "./master-data"
import { buildPayments } from "./payables"
import { buildReceipts, rateFor } from "./receivables"

/**
 * Banking — treasury movements, cash sweeps, cheques, reconciliation data and
 * employee custody.
 *
 * Every treasury balance in master data is the book balance today. Its
 * movement history is built from the vouchers, transfers, cheques and bank
 * entries seeded here, and the opening balance is whatever the balance was
 * before them, so `opening + movements = balance` holds for every account.
 * The cash sweeps are sized so the tills open at a sensible float and the
 * main treasury opens at the design's 400,000.00.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

const CIB = "bnk-cib-0021"
const BANQUE_MISR = "bnk-bm-usd-4417"

export const FIN_EMPLOYEE_ROWS: Row[] = [
  { id: "E-01", code: "E-01", name: "Mona Salah", role: "Sales rep" },
  { id: "E-02", code: "E-02", name: "Tarek Aziz", role: "Field engineer" },
  { id: "E-03", code: "E-03", name: "Hala Mostafa", role: "Treasury officer" },
  { id: "E-04", code: "E-04", name: "Nour Adel", role: "Finance manager" },
  { id: "E-05", code: "E-05", name: "Karim Fouad", role: "Chief accountant" },
  { id: "E-06", code: "E-06", name: "Layla Adham", role: "Financial controller" },
]

// ─── Transfers ───────────────────────────────────────────────────────────────

/** [number, date, from, to, amount (from's currency), note] */
const SWEEPS: [string, string, string, string, number, string][] = [
  ["TRA-2026-1101", "2026-01-15", "trs-main-cairo", CIB, 200_000, "Cash deposited to CIB"],
  ["TRA-2026-1110", "2026-01-22", CIB, "trs-petty-alex", 212_932.67, "Petty cash top-up — Alexandria"],
  ["TRA-2026-1120", "2026-01-29", "trs-petty-cairo", CIB, 230_000, "Cash deposited to CIB"],
  ["TRA-2026-1144", "2026-02-11", "trs-main-cairo", CIB, 187_984.4, "Cash deposited to CIB"],
  ["TRA-2026-1188", "2026-02-24", "trs-petty-cairo", CIB, 200_379.89, "Cash deposited to CIB"],
  ["TRA-2026-1206", "2026-03-04", CIB, "trs-petty-alex", 200_000, "Petty cash top-up — Alexandria"],
]

const treasury = (id: string) => FIN_TREASURY_ROWS.find((row) => row.id === id) as Row

/** Amount in `from`'s currency restated in `to`'s currency. */
export function convert(amount: number, from: string, to: string): number {
  return from === to ? amount : r2((amount * rateFor(from)) / rateFor(to))
}

export function buildTransfers(): Row[] {
  return SWEEPS.map(([number, date, from, to, amount, note]) => ({
    id: number,
    number,
    date,
    from_treasury_id: from,
    to_treasury_id: to,
    amount,
    currency: treasury(from).currency,
    received: convert(amount, String(treasury(from).currency), String(treasury(to).currency)),
    note,
  })).reverse()
}

// ─── Cheques ─────────────────────────────────────────────────────────────────

type ChequeSeed = [number: string, contactIndex: number, issued: string, due: string, amount: number, status: string]

const RECEIVED: ChequeSeed[] = [
  ["400001", 0, "2026-03-01", "2026-04-10", 70_915.24, "in_hand"],
  ["400002", 1, "2026-03-02", "2026-04-11", 123_302.08, "deposited"],
  ["400003", 2, "2026-03-03", "2026-04-12", 147_130.3, "under_collection"],
  ["400004", 3, "2026-03-04", "2026-04-13", 33_916.42, "collected"],
  ["400005", 4, "2026-03-05", "2026-04-14", 16_441.3, "bounced"],
  ["400006", 0, "2026-03-06", "2026-04-15", 136_904.32, "returned"],
  ["400007", 1, "2026-03-07", "2026-04-16", 135_426.88, "in_hand"],
  ["400008", 2, "2026-03-08", "2026-04-17", 155_681.02, "deposited"],
  ["400009", 3, "2026-03-01", "2026-04-10", 158_075.02, "under_collection"],
  ["400010", 4, "2026-03-02", "2026-04-11", 52_701.94, "collected"],
  ["400011", 0, "2026-03-03", "2026-04-12", 91_282.6, "bounced"],
  ["400012", 1, "2026-03-04", "2026-04-13", 61_871.14, "returned"],
  ["400013", 2, "2026-03-05", "2026-04-14", 46_157.68, "in_hand"],
  ["400014", 3, "2026-03-06", "2026-04-15", 45_015.04, "deposited"],
]

const ISSUED: ChequeSeed[] = [
  ["500001", 0, "2026-03-10", "2026-04-20", 60_049.28, "written"],
  ["500002", 1, "2026-03-11", "2026-04-21", 50_215.36, "delivered"],
  ["500003", 2, "2026-03-12", "2026-04-22", 168_501.44, "presented"],
  ["500004", 3, "2026-03-13", "2026-04-23", 145_778.24, "cleared"],
  ["500005", 4, "2026-03-14", "2026-04-24", 124_594.4, "bounced"],
  ["500006", 0, "2026-03-15", "2026-04-25", 170_776.64, "cancelled"],
  ["500007", 1, "2026-03-16", "2026-04-26", 94_930.08, "written"],
  ["500008", 2, "2026-03-17", "2026-04-20", 132_511.68, "delivered"],
  ["500009", 3, "2026-03-10", "2026-04-21", 34_646.72, "presented"],
  ["500010", 4, "2026-03-11", "2026-04-22", 132_425.12, "cleared"],
  ["500011", 0, "2026-03-12", "2026-04-23", 94_683.04, "bounced"],
]

/** The statuses a cheque passes through to reach each one, in order. */
export const CHEQUE_PATHS: Record<string, string[]> = {
  in_hand: ["in_hand"],
  deposited: ["in_hand", "deposited"],
  under_collection: ["in_hand", "deposited", "under_collection"],
  collected: ["in_hand", "deposited", "under_collection", "collected"],
  bounced: ["in_hand", "deposited", "under_collection", "bounced"],
  returned: ["in_hand", "deposited", "under_collection", "bounced", "returned"],
  written: ["written"],
  delivered: ["written", "delivered"],
  presented: ["written", "delivered", "presented"],
  cleared: ["written", "delivered", "presented", "cleared"],
  cancelled: ["written", "cancelled"],
}

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Seeded cheques settle this many days after the step before, so history is ordered and in the past. */
const STEP_DAYS = 3

export function buildCheques(): Row[] {
  const customers = FIN_CONTACT_ROWS.filter((row) => row.kind === "customer")
  const suppliers = FIN_CONTACT_ROWS.filter((row) => row.kind === "supplier")
  const cheque =
    (direction: "received" | "issued", parties: Row[]) =>
    ([number, index, issued, due, amount, status]: ChequeSeed): Row => {
      const party = parties[index]
      return {
        id: `${direction === "received" ? "CHR" : "CHI"}-${number}`,
        number,
        direction,
        contact_id: party.id,
        party_name: party.name,
        bank: "CIB",
        treasury_id: CIB,
        issue_date: issued,
        due_date: due,
        amount,
        currency: "EGP",
        status,
        history: CHEQUE_PATHS[status].map((step, position) => ({
          status: step,
          date: shiftDays(issued, position * STEP_DAYS),
        })),
      }
    }
  return [...RECEIVED.map(cheque("received", customers)), ...ISSUED.map(cheque("issued", suppliers))]
}

export const FIN_CHEQUE_BOOK_ROWS: Row[] = [
  { id: "CB-01", code: "CB-01", bank: "CIB", treasury_id: CIB, first: 400001, last: 400050, direction: "received" },
  { id: "CB-02", code: "CB-02", bank: "CIB", treasury_id: CIB, first: 500001, last: 500050, direction: "issued" },
  { id: "CB-03", code: "CB-03", bank: "NBE", treasury_id: null, first: 700001, last: 700025, direction: "issued" },
]

// ─── Reconciliation ─────────────────────────────────────────────────────────

/** [reference, treasury, date, description, amount (signed, treasury currency)] */
const STATEMENT_LINES: [string, string, string, string, number][] = [
  ["STMT90210", CIB, "2026-03-03", "Customer transfer", 8_000],
  ["STMT90223", CIB, "2026-03-03", "Standing order in", 165_000],
  ["STMT90211", CIB, "2026-03-05", "Cheque deposit", 137_000],
  ["STMT90224", CIB, "2026-03-05", "Interest credit", 104_000],
  ["STMT90212", CIB, "2026-03-07", "POS settlement", 76_000],
  ["STMT90225", CIB, "2026-03-07", "Customer transfer", 43_000],
  ["STMT90213", CIB, "2026-03-09", "Standing order in", 15_000],
  ["STMT90226", CIB, "2026-03-09", "Cheque deposit", 172_000],
  ["STMT90214", CIB, "2026-03-11", "Interest credit", 144_000],
  ["STMT90227", CIB, "2026-03-11", "POS settlement", 111_000],
  ["STMT90215", CIB, "2026-03-13", "Customer transfer", 83_000],
  ["STMT90216", CIB, "2026-03-15", "Cheque deposit", 22_000],
  ["STMT90217", CIB, "2026-03-17", "POS settlement", 151_000],
  ["STMT90218", CIB, "2026-03-19", "Standing order in", 90_000],
  ["STMT90219", CIB, "2026-03-21", "Interest credit", 29_000],
  ["STMT90220", CIB, "2026-03-23", "Customer transfer", 158_000],
  ["STMT90221", CIB, "2026-03-25", "Cheque deposit", 97_000],
  ["STMT90222", CIB, "2026-03-27", "POS settlement", 36_000],
  ["BMS-44170", BANQUE_MISR, "2026-03-12", "Incoming SWIFT Mediterranean Trading", 1_850],
  ["BMS-44171", BANQUE_MISR, "2026-03-18", "Bank charges", -45],
  ["BMS-44172", BANQUE_MISR, "2026-03-24", "FX conversion to EGP", -6_000],
]

/** Posted entries on the bank accounts that the statement has not yet confirmed. */
const BOOK_ENTRIES: [string, string, string, string, number][] = [
  ["JE-2026-001213", CIB, "2026-03-03", "Payroll debit", -165_000],
  ["JE-2026-001200", CIB, "2026-03-04", "Customer transfer", 8_000.5],
  ["JE-2026-001201", CIB, "2026-03-05", "Bank charges", -137_000],
  ["JE-2026-001214", CIB, "2026-03-05", "Interest credit", 104_000],
  ["JE-2026-001202", CIB, "2026-03-07", "POS settlement", 76_000],
  ["JE-2026-001215", CIB, "2026-03-07", "Customer transfer", 43_000.5],
  ["JE-2026-001203", CIB, "2026-03-09", "Standing order in", 15_000],
  ["JE-2026-001216", CIB, "2026-03-10", "Bank charges", -172_000],
  ["JE-2026-001217", CIB, "2026-03-11", "POS settlement", 111_000],
  ["JE-2026-001204", CIB, "2026-03-12", "Standing order out", -144_000],
  ["JE-2026-001205", CIB, "2026-03-13", "Customer transfer", 83_000.5],
  ["JE-2026-001206", CIB, "2026-03-15", "Cheque deposit", 22_000],
  ["JE-2026-001207", CIB, "2026-03-17", "Cheque cleared", -151_000],
  ["JE-2026-001208", CIB, "2026-03-20", "Standing order in", 90_000],
  ["JE-2026-001209", CIB, "2026-03-21", "Interest credit", 29_000],
  ["JE-2026-001210", CIB, "2026-03-23", "Supplier payment", -158_000.5],
  ["JE-2026-001211", CIB, "2026-03-25", "Cheque deposit", 97_000],
  ["JE-2026-001212", CIB, "2026-03-28", "POS settlement", 36_000],
  ["JE-2026-001218", BANQUE_MISR, "2026-03-12", "Receipt Mediterranean Trading", 1_850],
  ["JE-2026-001219", BANQUE_MISR, "2026-03-19", "Bank charges", -45],
]

export function buildStatementLines(): Row[] {
  return STATEMENT_LINES.map(([reference, treasuryId, date, description, amount]) => ({
    id: reference,
    reference,
    treasury_id: treasuryId,
    date,
    description,
    amount,
    status: "unmatched",
    matched_entry_id: null,
    dismissed_entry_ids: [],
    import_id: null,
  }))
}

export function buildBookEntries(): Row[] {
  return BOOK_ENTRIES.map(([entry, treasuryId, date, description, amount]) => ({
    id: entry,
    entry,
    treasury_id: treasuryId,
    date,
    description,
    amount,
    status: "unmatched",
    matched_line_id: null,
  }))
}

/** The generated statement "Upload statement" reads: [reference, date, memo, amount, already on the books]. */
export const STATEMENT_IMPORT_TEMPLATE: [string, string, string, number, boolean][] = [
  ["ST90028", "2026-03-02", "Standing order", -28_240, true],
  ["ST90041", "2026-03-03", "Customer transfer", 39_030, true],
  ["ST90054", "2026-03-04", "POS settlement", 49_820, false],
  ["ST90067", "2026-03-05", "Wire transfer", -60_610, true],
  ["ST90080", "2026-03-06", "Cheque deposit", 71_400, true],
  ["ST90093", "2026-03-07", "Bank charges", -82_190, false],
  ["ST90009", "2026-03-08", "Bank charges", -12_470, false],
  ["ST90022", "2026-03-09", "Standing order", -23_260, true],
  ["ST90035", "2026-03-10", "Customer transfer", 34_050, true],
  ["ST90048", "2026-03-11", "POS settlement", 44_840, false],
  ["ST90061", "2026-03-12", "Wire transfer", -55_630, true],
  ["ST90074", "2026-03-13", "Cheque deposit", 66_420, true],
]

// ─── Employee custody ────────────────────────────────────────────────────────

/** [employee, treasury, advances [date, amount], settlements [date, amount]] */
const CUSTODY: [string, string, [string, number][], [string, number][]][] = [
  ["E-01", "trs-main-cairo", [["2026-01-10", 20_000]], [["2026-03-20", 8_000]]],
  ["E-02", "trs-main-cairo", [["2026-02-11", 35_000]], [["2026-03-05", 20_000], ["2026-03-26", 11_500]]],
  ["E-03", "trs-main-cairo", [["2026-03-12", 50_000]], [["2026-03-24", 32_500]]],
  ["E-04", "trs-main-cairo", [["2026-01-13", 65_000]], [["2026-02-15", 40_000], ["2026-02-28", 25_000]]],
]

export function buildCustody(): Row[] {
  return CUSTODY.map(([employeeId, treasuryId, advances, settlements]) => {
    const employee = FIN_EMPLOYEE_ROWS.find((row) => row.id === employeeId) as Row
    let sequence = 0
    const movement = (type: string, memo: string) => ([date, amount]: [string, number]) => ({
      id: `${employeeId}-${++sequence}`,
      date,
      memo,
      type,
      amount: type === "advance" ? amount : -amount,
    })
    return {
      id: employeeId,
      employee_id: employeeId,
      name: employee.name,
      role: employee.role,
      treasury_id: treasuryId,
      movements: [
        ...advances.map(movement("advance", "Custody advance")),
        ...settlements.map(movement("settle", "Expense settlement")),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }
  })
}

// ─── Treasury movements ──────────────────────────────────────────────────────

type MovementSeed = {
  treasury_id: string
  date: string
  description: string
  source: string
  source_type: string
  source_id: string | null
  /** Signed, in the treasury's currency. */
  amount: number
  entry?: string
}

/**
 * The seeded history of every treasury, oldest first, each with a journal
 * entry number. Seeded vouchers are in EGP, so movements on the USD account
 * are restated at the current rate.
 */
export function buildTreasuryMovements(): Row[] {
  const seeds: MovementSeed[] = []
  const inCurrency = (treasuryId: string, amountEgp: number) =>
    convert(amountEgp, "EGP", String(treasury(treasuryId).currency))

  for (const receipt of buildReceipts()) {
    seeds.push({
      treasury_id: String(receipt.treasury_id),
      date: String(receipt.date),
      description: String(receipt.description),
      source: String(receipt.number),
      source_type: "receipt",
      source_id: String(receipt.id),
      amount: inCurrency(String(receipt.treasury_id), Number(receipt.amount)),
    })
  }
  for (const payment of buildPayments()) {
    seeds.push({
      treasury_id: String(payment.treasury_id),
      date: String(payment.date),
      description: String(payment.description),
      source: String(payment.number),
      source_type: "payment",
      source_id: String(payment.id),
      amount: -inCurrency(String(payment.treasury_id), Number(payment.amount)),
    })
  }
  for (const transfer of buildTransfers()) {
    const from = treasury(String(transfer.from_treasury_id))
    const to = treasury(String(transfer.to_treasury_id))
    const common = { date: String(transfer.date), source: String(transfer.number), source_type: "transfer", source_id: String(transfer.id) }
    seeds.push({ ...common, treasury_id: String(from.id), description: `Transfer to ${String(to.name)}`, amount: -Number(transfer.amount) })
    seeds.push({ ...common, treasury_id: String(to.id), description: `Transfer from ${String(from.name)}`, amount: Number(transfer.received) })
  }
  for (const cheque of buildCheques()) {
    const history = cheque.history as { status: string; date: string }[]
    const done = history[history.length - 1]
    if (cheque.status !== "collected" && cheque.status !== "cleared") continue
    seeds.push({
      treasury_id: String(cheque.treasury_id),
      date: String(done?.date),
      description: `Cheque ${String(cheque.number)} — ${String(cheque.party_name)}`,
      source: `CHQ-${String(cheque.number)}`,
      source_type: "cheque",
      source_id: String(cheque.id),
      amount: cheque.status === "collected" ? Number(cheque.amount) : -Number(cheque.amount),
    })
  }
  for (const entry of buildBookEntries()) {
    seeds.push({
      treasury_id: String(entry.treasury_id),
      date: String(entry.date),
      description: String(entry.description),
      source: "Manual",
      source_type: "journal",
      source_id: null,
      amount: Number(entry.amount),
      entry: String(entry.entry),
    })
  }

  seeds.sort((a, b) => a.date.localeCompare(b.date) || a.source.localeCompare(b.source))
  let journal = 0
  const entryFor = new Map<string, string>()
  return seeds.map((seed, index) => {
    // Both legs of a transfer share one entry.
    const key = seed.source_type === "transfer" ? seed.source : `${seed.source}-${index}`
    const entry =
      seed.entry ?? entryFor.get(key) ?? `JE-2026-${String(++journal * 4 + 1).padStart(6, "0")}`
    entryFor.set(key, entry)
    return {
      id: `MV-${String(index + 1).padStart(4, "0")}`,
      treasury_id: seed.treasury_id,
      date: seed.date,
      entry,
      description: seed.description,
      source: seed.source,
      source_type: seed.source_type,
      source_id: seed.source_id,
      amount: r2(seed.amount),
    }
  })
}
