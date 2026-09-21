import type { Row } from "../../demo-db"
import { FIN_ANCHORS } from "./anchors"
import { FIN_TODAY } from "./calendar"
import { FIN_CONTACT_ROWS, FIN_CURRENCY_ROWS } from "./master-data"

/**
 * Money in — open receivables documents for the five design customers.
 *
 * The design's invoice amounts are kept as drawn; its dates sat 30 days
 * later (design "today" was 30 Apr), so due dates are expressed as days late
 * against the finance calendar and keep the same ages. Delta Industrial
 * Group is the plug: its invoices absorb the difference so that
 *
 *   overdue invoices                    = receivables.overdue (5,843,638.88)
 *   all invoices − unapplied credit notes = receivables.outstanding (6,318,400.00)
 *
 * exactly, which is what Finance home and the AR overview show. Customer
 * advances are listed with the customer but held on 210103, so they are not
 * netted into the receivables balance.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

const RATES: Record<string, number> = Object.fromEntries(
  FIN_CURRENCY_ROWS.map((row) => [String(row.id), Number(row.rate_to_base)]),
)

export function rateFor(currency: string): number {
  return RATES[currency] ?? 1
}

export function toBase(amount: number, currency: string): number {
  return r2(amount * rateFor(currency))
}

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Split `total` into parts by weight; the last part takes the rounding so they sum exactly. */
function split(total: number, weights: number[]): number[] {
  const sum = weights.reduce((acc, weight) => acc + weight, 0)
  const parts = weights.slice(0, -1).map((weight) => r2((total * weight) / sum))
  return [...parts, r2(total - parts.reduce((acc, part) => acc + part, 0))]
}

const CUSTOMERS = Object.fromEntries(
  FIN_CONTACT_ROWS.filter((row) => row.kind === "customer").map((row) => [String(row.id), row]),
)

/** [invoice number suffix, outstanding, days late (negative = not yet due), allocated] */
type InvoiceSpec = [number, number, number, number?]

const FIXED_INVOICES: Record<string, InvoiceSpec[]> = {
  "C-0101": [
    [1000, 1_464.57, 10, 976.39],
    [1005, 18_717.5, 3],
    [1010, 12_658.16, 70],
    [1015, 9_390.51, 10],
    [1020, 8_243.5, 3],
    [1025, 16_152.22, 70],
    [1030, 6_877.64, 10],
    [1035, 5_459.86, 3],
    [1040, 5_766.06, 70],
  ],
  "C-0103": [
    [1002, 5_636.33, 20],
    [1007, 11_070.56, -29],
    [1012, 9_156.01, 105],
    [1017, 6_064.45, 20],
    [1022, 13_378.08, -29],
    [1027, 11_299.41, 105, 7_532.95],
    [1032, 16_442.11, 20],
    [1037, 12_913.45, -29],
    [1042, 18_877.75, 105],
  ],
  "C-0104": [
    [1003, 1_880.25, 48],
    [1008, 6_241.75, 12],
    [1013, 8_203.1, -8],
    [1018, 2_904.1, 41],
    [1023, 19_471.35, 12],
    [1028, 12_855.29, -15],
    [1033, 1_506.4, 41],
    [1038, 1_874.65, 25],
    [1043, 13_993.52, -22],
  ],
  "C-0105": [
    [1004, 2_527.13, 35],
    [1009, 11_466.95, 15, 7_644.64],
    [1014, 2_842.12, 135],
    [1019, 18_945.3, 35],
    [1024, 10_300.48, 15],
    [1029, 19_747.39, 135],
    [1034, 15_380.52, 35],
    [1039, 18_906.96, 15],
    [1044, 7_645.83, 135],
  ],
}

/** [number, customer, date (already on the finance calendar), gross, unapplied, currency] */
type CreditSpec = [string, string, string, number, number, string]

const CREDIT_NOTES: CreditSpec[] = [
  ["CN-2026-3000", "C-0101", "2026-01-16", 6_745.6, 4_047.36, "EGP"],
  ["CN-2026-3001", "C-0102", "2026-02-08", 5_548.84, 5_548.84, "EGP"],
  ["CN-2026-3002", "C-0103", "2025-12-30", 4_469.64, 4_469.64, "EGP"],
  ["CN-2026-3003", "C-0104", "2026-02-21", 529.7, 529.7, "SAR"],
  ["CN-2026-3004", "C-0105", "2025-12-03", 129.42, 129.42, "USD"],
  ["CN-2026-3005", "C-0101", "2026-02-03", 1_219.02, 1_219.02, "EGP"],
  ["CN-2026-3006", "C-0102", "2026-01-24", 4_240.2, 4_240.2, "EGP"],
  ["CN-2026-3007", "C-0103", "2026-03-07", 4_424.44, 4_424.44, "EGP"],
]

const ADVANCES: CreditSpec[] = [
  ["ADV-C-2026-5000", "C-0101", "2026-02-11", 4_914.86, 2_948.92, "EGP"],
  ["ADV-C-2026-5001", "C-0102", "2026-01-27", 12_999.16, 12_999.16, "EGP"],
  ["ADV-C-2026-5002", "C-0103", "2026-02-26", 9_733.98, 9_733.98, "EGP"],
  ["ADV-C-2026-5003", "C-0104", "2026-01-11", 352.72, 352.72, "SAR"],
  ["ADV-C-2026-5004", "C-0105", "2026-03-15", 118.3, 118.3, "USD"],
  ["ADV-C-2026-5005", "C-0101", "2026-02-06", 7_660.73, 7_660.73, "EGP"],
]

function invoiceRow(customerId: string, [suffix, outstanding, daysLate, allocated = 0]: InvoiceSpec): Row {
  const customer = CUSTOMERS[customerId]
  const currency = String(customer.currency)
  const due = shiftDays(FIN_TODAY, -daysLate)
  return {
    id: `INV-2026-${suffix}`,
    number: `INV-2026-${suffix}`,
    type: "invoice",
    contact_id: customerId,
    currency,
    date: shiftDays(due, -Number(customer.terms_days)),
    due_date: due,
    gross: r2(outstanding + allocated),
    allocated,
    outstanding,
    status: allocated > 0 ? "partial" : "open",
  }
}

function creditRow(type: "credit_note" | "advance", [number, customerId, date, gross, unapplied, currency]: CreditSpec): Row {
  return {
    id: number,
    number,
    type,
    contact_id: customerId,
    currency,
    date,
    due_date: null,
    gross,
    allocated: r2(gross - unapplied),
    outstanding: unapplied,
    status: unapplied < gross ? "partial" : type === "credit_note" ? "unapplied" : "open",
  }
}

const baseOf = (rows: Row[]) =>
  r2(rows.reduce((sum, row) => sum + toBase(Number(row.outstanding), String(row.currency)), 0))

export function buildArDocuments(): Row[] {
  const fixed = Object.entries(FIXED_INVOICES).flatMap(([customerId, specs]) =>
    specs.map((spec) => invoiceRow(customerId, spec)),
  )
  const creditNotes = CREDIT_NOTES.map((spec) => creditRow("credit_note", spec))
  const advances = ADVANCES.map((spec) => creditRow("advance", spec))

  const overdueTarget = FIN_ANCHORS.receivables.overdue
  const netTarget = FIN_ANCHORS.receivables.outstanding
  const fixedOverdue = baseOf(fixed.filter((row) => String(row.due_date) < FIN_TODAY))
  const fixedCurrent = baseOf(fixed.filter((row) => String(row.due_date) >= FIN_TODAY))

  // Delta Industrial Group (EGP) takes whatever the fixed documents leave over.
  // Credit notes are netted into the balance; advances sit on 210103 and are not.
  const deltaOverdue = r2(overdueTarget - fixedOverdue)
  const deltaCurrent = r2(netTarget - overdueTarget + baseOf(creditNotes) - fixedCurrent)
  const [overdueA, overdueB] = split(r2(deltaOverdue - 10_355.56), [0.6, 0.4])
  const current = split(deltaCurrent, [0.22, 0.18, 0.2, 0.14, 0.16, 0.1])

  const delta: InvoiceSpec[] = [
    [1001, overdueA, 33],
    [1006, current[0], -5],
    [1011, overdueB, 48],
    [1016, current[1], -9],
    [1021, 10_355.56, 18],
    [1026, current[2], -12],
    [1031, current[3], -16],
    [1036, current[4], -21],
    [1041, current[5], -27],
  ]

  const invoices = [...fixed, ...delta.map((spec) => invoiceRow("C-0102", spec))].sort(
    (a, b) => String(a.number).localeCompare(String(b.number)),
  )
  return [...invoices, ...creditNotes, ...advances]
}

type ReceiptSeed = [suffix: number, date: string, treasuryId: string, amount: number | null]

/**
 * The 24 receipts listed in the design (Jan–Mar 2026). The last three were
 * cut off in the frame; they take the remainder of the design total.
 */
const RECEIPTS: ReceiptSeed[] = [
  [1022, "2026-01-07", "trs-main-cairo", 242_244.08],
  [1032, "2026-01-10", "trs-petty-cairo", 181_752.32],
  [1042, "2026-01-13", "trs-petty-alex", 36_563.36],
  [1052, "2026-01-15", "bnk-cib-0021", 43_838.24],
  [1062, "2026-01-18", "bnk-bm-usd-4417", 45_223.76],
  [1072, "2026-01-21", "bnk-qnb-payroll", 194_164.64],
  [1082, "2026-01-24", "trs-main-cairo", 187_209.2],
  [1092, "2026-01-27", "trs-petty-cairo", 62_948.96],
  [1122, "2026-02-05", "trs-petty-cairo", 198_120.32],
  [1132, "2026-02-07", "trs-petty-alex", 99_692.48],
  [1142, "2026-02-10", "bnk-cib-0021", 205_249.04],
  [1152, "2026-02-13", "bnk-bm-usd-4417", 15_603.92],
  [1162, "2026-02-16", "bnk-qnb-payroll", 144_573.44],
  [1172, "2026-02-19", "trs-main-cairo", 202_200.56],
  [1182, "2026-02-22", "trs-petty-cairo", 120_327.92],
  [1192, "2026-02-25", "trs-petty-alex", 23_600.48],
  [1222, "2026-03-05", "trs-petty-alex", 22_583.84],
  [1232, "2026-03-08", "bnk-cib-0021", 39_203.84],
  [1242, "2026-03-11", "bnk-bm-usd-4417", 79_792.16],
  [1252, "2026-03-14", "bnk-qnb-payroll", 196_175.84],
  [1262, "2026-03-17", "trs-main-cairo", 188_700.56],
  [1272, "2026-03-20", "trs-petty-cairo", null],
  [1282, "2026-03-23", "trs-petty-alex", null],
  [1292, "2026-03-26", "bnk-cib-0021", null],
]

const RECEIPTS_TOTAL = 2_934_441.84
const CUSTOMER_CYCLE = ["C-0101", "C-0102", "C-0103", "C-0104", "C-0105"]

export function buildReceipts(): Row[] {
  const known = RECEIPTS.reduce((sum, [, , , amount]) => sum + (amount ?? 0), 0)
  const [a, b, c] = split(r2(RECEIPTS_TOTAL - known), [0.42, 0.33, 0.25])
  const filled = [a, b, c]
  let fillIndex = 0
  const unallocatedFrom = RECEIPTS.length - FIN_ANCHORS.receipts.unallocated

  return RECEIPTS.map(([suffix, date, treasuryId, amount], index) => {
    const customerId = CUSTOMER_CYCLE[index % CUSTOMER_CYCLE.length]
    return {
      id: `REC-2026-${suffix}`,
      number: `REC-2026-${suffix}`,
      date,
      contact_id: customerId,
      treasury_id: treasuryId,
      description: `Receipt — ${String(CUSTOMERS[customerId].name)}`,
      origin: "auto",
      amount: amount ?? filled[fillIndex++],
      currency: "EGP",
      status: "posted",
      allocation: index >= unallocatedFrom ? "unallocated" : "allocated",
    }
  }).reverse()
}
