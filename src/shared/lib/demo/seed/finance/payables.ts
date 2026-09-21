import type { Row } from "../../demo-db"
import { FIN_CONTACT_ROWS } from "./master-data"

/**
 * Money out — the design's 31 open bills, 6 debit notes and 5 supplier
 * advances. The design is internally consistent here:
 *
 *   bills (4,178,500.00) − unapplied debit notes (264,300.00) = 3,914,200.00
 *
 * which is the payables figure on Finance home, and the bills due in the next
 * seven days add up to its 454,959.32 "due this week". Dates are drawn as if
 * today were 30 Apr 2026, so they move 30 days earlier onto the finance
 * calendar. Supplier advances are held on 120302 and are not netted.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Design dates sit 30 days ahead of the finance calendar. */
const onCalendar = (designDate: string) => shiftDays(designDate, -30)

const SUPPLIERS = FIN_CONTACT_ROWS.filter((row) => row.kind === "supplier")
const supplierAt = (index: number) => SUPPLIERS[index % SUPPLIERS.length]

/** Bills awaiting a decision in the approval queue (the design's four). */
const PENDING_APPROVAL = new Set([2000, 2001, 2002, 2003])

/** [suffix, due date as drawn, outstanding, allocated] — suppliers cycle in design order. */
const BILLS: [number, string, number, number?][] = [
  [2000, "2026-04-24", 51_024.2, 34_016.13],
  [2001, "2026-04-12", 144_757.35],
  [2002, "2026-05-09", 44_532.68],
  [2003, "2026-03-22", 229_859.44],
  [2004, "2026-05-02", 187_156.44],
  [2005, "2026-03-09", 69_390.51],
  [2006, "2026-04-18", 88_041.52],
  [2007, "2026-02-11", 146_758.01],
  [2008, "2026-05-24", 65_132.14],
  [2009, "2026-01-08", 149_737.81],
  [2010, "2025-12-06", 106_448.25],
  [2011, "2026-04-24", 41_003.66],
  [2012, "2026-04-12", 116_495.55],
  [2013, "2026-05-09", 218_204.23],
  [2014, "2026-03-22", 95_583.7],
  [2015, "2026-05-02", 114_380.17],
  [2016, "2026-03-09", 173_112.79],
  [2017, "2026-04-18", 195_591.19],
  [2018, "2026-02-11", 195_557.16],
  [2019, "2026-05-24", 36_540.85],
  [2020, "2026-01-08", 74_503.88],
  [2021, "2025-12-06", 111_872.48],
  [2022, "2026-04-24", 214_082.83],
  [2023, "2026-04-12", 212_944.88],
  [2024, "2026-05-09", 79_721.94],
  [2025, "2026-03-22", 280_785.47],
  [2026, "2026-05-02", 153_422.71],
  [2027, "2026-03-09", 259_577.34],
  [2028, "2026-04-18", 99_169.23],
  [2029, "2026-02-11", 147_313.89],
  [2030, "2026-05-24", 75_797.7],
]

/** [number, supplier index, date as drawn, gross, unapplied] */
const DEBIT_NOTES: [string, number, string, number, number][] = [
  ["DN-2026-4000", 0, "2026-02-15", 21_472.46, 12_883.48],
  ["DN-2026-4001", 1, "2026-03-10", 40_350.99, 40_350.99],
  ["DN-2026-4002", 2, "2026-01-29", 61_493.92, 61_493.92],
  ["DN-2026-4003", 3, "2026-03-23", 19_868.45, 19_868.45],
  ["DN-2026-4004", 4, "2026-01-02", 82_819.67, 82_819.67],
  ["DN-2026-4005", 0, "2026-03-05", 46_883.49, 46_883.49],
]

const ADVANCES: [string, number, string, number, number][] = [
  ["ADV-S-2026-6000", 0, "2026-03-13", 67_659.27, 40_595.56],
  ["ADV-S-2026-6001", 1, "2026-02-26", 36_278.11, 36_278.11],
  ["ADV-S-2026-6002", 2, "2026-03-28", 68_722.11, 68_722.11],
  ["ADV-S-2026-6003", 3, "2026-02-10", 109_701.59, 109_701.59],
  ["ADV-S-2026-6004", 4, "2026-04-14", 32_702.63, 32_702.63],
]

export function buildApDocuments(): Row[] {
  const bills = BILLS.map(([suffix, due, outstanding, allocated = 0], index) => {
    const supplier = supplierAt(index)
    const dueDate = onCalendar(due)
    const pending = PENDING_APPROVAL.has(suffix)
    return {
      id: `BILL-2026-${suffix}`,
      number: `BILL-2026-${suffix}`,
      type: "bill",
      contact_id: supplier.id,
      currency: "EGP",
      date: shiftDays(dueDate, -Number(supplier.terms_days)),
      due_date: dueDate,
      gross: r2(outstanding + allocated),
      allocated,
      outstanding,
      status: allocated > 0 ? "partial" : "open",
      approval: pending ? "pending" : "approved",
      decided_at: null,
    }
  })

  const credit = (type: "debit_note" | "advance") =>
    ([number, supplierIndex, date, gross, unapplied]: [string, number, string, number, number]) => ({
      id: number,
      number,
      type,
      contact_id: supplierAt(supplierIndex).id,
      currency: "EGP",
      date: onCalendar(date),
      due_date: null,
      gross,
      allocated: r2(gross - unapplied),
      outstanding: unapplied,
      status: unapplied < gross ? "partial" : type === "debit_note" ? "unapplied" : "open",
    })

  return [...bills, ...DEBIT_NOTES.map(credit("debit_note")), ...ADVANCES.map(credit("advance"))]
}

type PaymentSeed = [suffix: number, date: string, treasuryId: string, amount: number]

/** The 24 payment vouchers listed in the design (Jan–Mar 2026). */
const PAYMENTS: PaymentSeed[] = [
  [1023, "2026-01-07", "trs-petty-cairo", 37_724],
  [1033, "2026-01-10", "trs-petty-alex", 144_378.56],
  [1043, "2026-01-13", "bnk-cib-0021", 13_275.44],
  [1053, "2026-01-16", "bnk-bm-usd-4417", 201_300.56],
  [1063, "2026-01-19", "bnk-qnb-payroll", 123_746.72],
  [1073, "2026-01-21", "trs-main-cairo", 78_773.36],
  [1083, "2026-01-24", "trs-petty-cairo", 95_577.2],
  [1093, "2026-01-27", "trs-petty-alex", 207_359.84],
  [1123, "2026-02-05", "trs-petty-alex", 208_487.6],
  [1133, "2026-02-08", "bnk-cib-0021", 158_662.4],
  [1143, "2026-02-11", "bnk-bm-usd-4417", 170_670.08],
  [1153, "2026-02-13", "bnk-qnb-payroll", 72_389.12],
  [1163, "2026-02-16", "trs-main-cairo", 46_784.48],
  [1173, "2026-02-19", "trs-petty-cairo", 158_151.68],
  [1183, "2026-02-22", "trs-petty-alex", 137_432.48],
  [1193, "2026-02-25", "bnk-cib-0021", 8_420],
  [1223, "2026-03-06", "bnk-cib-0021", 20_503.76],
  [1233, "2026-03-08", "bnk-bm-usd-4417", 242_725.28],
  [1243, "2026-03-11", "bnk-qnb-payroll", 224_019.92],
  [1253, "2026-03-14", "trs-main-cairo", 220_492.16],
  [1263, "2026-03-17", "trs-petty-cairo", 7_829.36],
  [1273, "2026-03-20", "trs-petty-alex", 34_156.4],
  [1283, "2026-03-23", "bnk-cib-0021", 242_770.88],
  [1293, "2026-03-26", "bnk-bm-usd-4417", 109_821.44],
]

export function buildPayments(): Row[] {
  return PAYMENTS.map(([suffix, date, treasuryId, amount], index) => {
    const supplier = supplierAt(index)
    return {
      id: `PAY-2026-${suffix}`,
      number: `PAY-2026-${suffix}`,
      date,
      contact_id: supplier.id,
      treasury_id: treasuryId,
      description: `Payment — ${String(supplier.name)}`,
      origin: "auto",
      amount,
      currency: "EGP",
      status: "posted",
      allocation: "allocated",
    }
  }).reverse()
}
