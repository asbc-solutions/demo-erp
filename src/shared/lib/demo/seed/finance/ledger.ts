import type { Row } from "../../demo-db"
import { FIN_ANCHORS } from "./anchors"
import { registerBalances, seededMonthlyDepreciation } from "./assets"
import { VAT_PAYABLE_ACCOUNT, VAT_PAYABLE_CLOSING, VAT_SETTLEMENT_JOURNAL } from "./tax"

/**
 * Ledger — the stored journals, templates, recurring journals and the
 * opening balances they imply.
 *
 * Balance-sheet accounts close on the figures in `CLOSING` (the design's
 * chart of accounts). Profit-and-loss accounts start the year at zero and
 * reach their year-to-date figure through monthly summary journals, split so
 * that March alone nets to the Finance home's net result (2,788,400.00).
 * Every opening balance is then `closing − seeded lines`, so the ledger ties
 * by construction. Accounts owned by another screen (treasuries, AR, AP,
 * advances, custody) are not listed: their balance is read from that screen.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export const FIN_ACTOR = "Karim Fouad"
const PREPARER = "Layla Adham"

/**
 * Balance-sheet balances at 31 Mar 2026 from the seeded journals alone,
 * debit positive. Bank entries not yet on a statement (see banking) post on
 * top of these, e.g. the interest credits that settle 110503.
 */
const CLOSING: Record<string, number> = {
  "110401": 3_480_000,
  "110402": 2_400_000,
  "110501": 180_000,
  "110502": 96_000,
  "110503": 163_000,
  "110601": FIN_ANCHORS.tax.vatReturn.inputVat,
  // Property, plant and equipment tie to the asset register (cost and accumulated depreciation).
  ...registerBalances(),
  "120306": 420_000,
  "210105": -160_000,
  "210201": -FIN_ANCHORS.tax.vatReturn.outputVat,
  "210202": -356_000,
  "210203": -801_000,
  [VAT_PAYABLE_ACCOUNT]: VAT_PAYABLE_CLOSING,
  "210301": -520_000,
  "210302": -396_000,
  "210401": -412_000,
  "210402": -282_000,
  [FIN_ANCHORS.ledger.suspenseAccount]: -FIN_ANCHORS.ledger.suspenseBalance,
  "220101": -3_200_000,
  "220201": -860_000,
  "310101": -10_000_000,
  "310102": -1_200_000,
  "320102": 0,
}

/** Year-to-date P&L at 31 Mar 2026, credit negative. */
const REVENUE: Record<string, number> = {
  "410101": -7_420_000,
  "410102": -2_480_000,
  "410103": -860_000,
  "410104": -240_000,
  "420101": -180_000,
  "420102": -60_000,
  "430101": 280_000,
}

/** Expenses that run at the same amount every month. Depreciation comes from the asset register. */
const FIXED_MONTHLY: Record<string, number> = { "620101": 180_000, "640106": 42_300 }

/** March depreciation is the run still waiting to post, so only these months carry it. */
const DEPRECIATED_MONTHS = new Set(["2026-01", "2026-02"])

const VARIABLE_EXPENSES: Record<string, number> = {
  "510101": 5_420_000,
  "610101": 1_380_000,
  "620102": 63_000,
  "620110": 48_000,
  "630101": 36_000,
  "630102": 22_000,
  "640101": 150_000,
  "640104": 34_000,
  "640201": 58_000,
  "640301": 21_000,
  "640401": 27_000,
  "640501": 44_000,
}

/** Share of the year-to-date revenue booked in March (a strong month). */
const MARCH_REVENUE_SHARE = 0.46
const JANUARY_SHARE_OF_REST = 0.49

const MONTHS = [
  { period: "2026-01", date: "2026-01-31", label: "January" },
  { period: "2026-02", date: "2026-02-28", label: "February" },
  { period: "2026-03", date: "2026-03-31", label: "March" },
] as const

/** Split `targets` into [Jan, Feb, Mar] so March sums exactly to `marchTotal`. */
function splitMonthly(targets: Record<string, number>, marchTotal: number): Record<string, number>[] {
  const codes = Object.keys(targets)
  const yearTotal = codes.reduce((sum, code) => sum + targets[code], 0)
  const share = marchTotal / yearTotal
  const march: Record<string, number> = {}
  let running = 0
  codes.forEach((code, index) => {
    march[code] = index === codes.length - 1 ? r2(marchTotal - running) : r2(targets[code] * share)
    running = r2(running + march[code])
  })
  const jan: Record<string, number> = {}
  const feb: Record<string, number> = {}
  for (const code of codes) {
    const rest = r2(targets[code] - march[code])
    jan[code] = r2(rest * JANUARY_SHARE_OF_REST)
    feb[code] = r2(rest - jan[code])
  }
  return [jan, feb, march]
}

type Line = { account_code: string; description: string; debit: number; credit: number }

const line = (account: string, amount: number, description = ""): Line =>
  amount >= 0
    ? { account_code: account, description, debit: r2(amount), credit: 0 }
    : { account_code: account, description, debit: 0, credit: r2(-amount) }

function journal(number: string, date: string, description: string, source: string, lines: Line[], extra: Record<string, unknown> = {}): Row {
  return {
    id: number,
    number,
    date,
    period: date.slice(0, 7),
    description,
    source,
    source_type: "ledger",
    origin: "auto",
    currency: "EGP",
    rate: 1,
    status: "posted",
    lines,
    created_by: PREPARER,
    posted_by: FIN_ACTOR,
    posted_at: `${date}T18:00:00.000Z`,
    reversal_of: null,
    reason: null,
    ...extra,
  }
}

/** The P&L summary journals for January–March. Cash legs hit CIB and the payroll account. */
function monthlyJournals(): Row[] {
  const netRevenueYear = Object.values(REVENUE).reduce((sum, value) => sum + value, 0)
  const marchRevenue = r2(netRevenueYear * MARCH_REVENUE_SHARE)
  const revenue = splitMonthly(REVENUE, marchRevenue)
  const fixedMarch = Object.values(FIXED_MONTHLY).reduce((sum, value) => sum + value, 0)
  // March result = −(revenue + expenses) must equal the anchored net result.
  const marchVariable = r2(-marchRevenue - FIN_ANCHORS.netResult.amount - fixedMarch)
  const variable = splitMonthly(VARIABLE_EXPENSES, marchVariable)

  let sequence = 500
  const next = () => `JE-2026-${String(++sequence).padStart(6, "0")}`
  const rows: Row[] = []

  const depreciation = seededMonthlyDepreciation()
  const depreciationTotal = r2(Object.values(depreciation).reduce((sum, value) => sum + value, 0))

  MONTHS.forEach(({ period, date, label }, month) => {
    const sales = revenue[month]
    const operating = ["410101", "410102", "410103", "410104", "430101"]
    const salesNet = operating.reduce((sum, code) => sum + sales[code], 0)
    rows.push(
      journal(next(), date, `Sales ledger — ${label}`, "Sales ledger", [
        line("110301", -salesNet, "Invoices issued"),
        ...operating.map((code) => line(code, sales[code])),
      ]),
    )
    rows.push(
      journal(next(), date, `Other income — ${label}`, "Bank and FX", [
        line("110201", -sales["420101"], "Interest credited"),
        line("420101", sales["420101"]),
        line("110301", -sales["420102"], "FX gain on customer receipts"),
        line("420102", sales["420102"]),
      ]),
    )

    const cost = variable[month]
    const purchases = r2(cost["510101"] * 0.98)
    const production = r2(cost["510101"] * 0.995)
    rows.push(
      journal(next(), date, `Purchases and cost of sales — ${label}`, "Inventory", [
        line("110401", purchases, "Raw materials received"),
        line("210101", -purchases),
        line("110402", production, "Transfer to finished goods"),
        line("110401", -production),
        line("510101", cost["510101"], "Cost of goods sold"),
        line("110402", -cost["510101"]),
      ]),
    )

    const salaries = cost["610101"]
    const insurance = r2(salaries * 0.12)
    const tax = r2(salaries * 0.08)
    rows.push(
      journal(next(), date, `Payroll — ${label}`, "Payroll", [
        line("610101", salaries, "Gross salaries"),
        line("110203", -r2(salaries - insurance - tax), "Net pay"),
        line("210401", -insurance),
        line("210402", -tax),
      ]),
    )

    rows.push(
      journal(next(), date, `Rent — ${label}`, "Fixed charges", [
        line("620101", FIXED_MONTHLY["620101"], "Prepaid rent released"),
        line("110501", -FIXED_MONTHLY["620101"]),
      ]),
    )
    if (DEPRECIATED_MONTHS.has(period)) {
      rows.push(
        journal(next(), date, `Depreciation run — ${label}`, `DR-${period}`, [
          line("650101", depreciationTotal, "Monthly depreciation"),
          ...Object.entries(depreciation).map(([account, amount]) => line(account, -amount, "Accumulated depreciation")),
        ], { source_type: "depreciation" }),
      )
    }

    const accrued = ["620102", "620110", "630101", "640101", "640104", "640201", "640301", "640401", "640501"]
    const accruedTotal = r2(accrued.reduce((sum, code) => sum + cost[code], 0) + FIXED_MONTHLY["640106"])
    rows.push(
      journal(next(), date, `Operating expenses — ${label}`, "Accruals", [
        ...accrued.map((code) => line(code, cost[code])),
        line("640106", FIXED_MONTHLY["640106"]),
        line("210302", -accruedTotal, "Accrued"),
        line("630102", cost["630102"], "FX loss on supplier payments"),
        line("210101", -cost["630102"]),
      ]),
    )
    rows.push(
      journal(next(), date, `Accrued services paid — ${label}`, "Accruals", [
        line("210302", accruedTotal, "Settled"),
        line("110201", -accruedTotal),
      ]),
    )
  })
  return rows
}

/** Manual adjustments not yet posted: six drafts and three awaiting approval. */
const MANUAL: [string, string, string, string, number, string, string, string][] = [
  ["JE-2026-000601", "2026-03-24", "Reclassify FX difference — Banque Misr receipts", "USD", 1_544.12, "630102", "110301", "draft"],
  ["JE-2026-000602", "2026-03-25", "Accrue March audit fee", "EGP", 171_176.48, "640101", "210302", "draft"],
  ["JE-2026-000603", "2026-03-26", "Correct misposted office supplies", "EGP", 85_720.64, "640104", "620110", "draft"],
  ["JE-2026-000604", "2026-03-27", "Release prepaid insurance — March", "EGP", 7_038.56, "620110", "110502", "draft"],
  ["JE-2026-000605", "2026-03-28", "Intercompany recharge — Delta Packaging", "EGP", 217_736, "120306", "410103", "draft"],
  ["JE-2026-000606", "2026-03-29", "Clear suspense — unidentified receipt", "EGP", FIN_ANCHORS.ledger.suspenseBalance, "2199", "110301", "draft"],
  ["JE-2026-000607", "2026-03-30", "Accrue March utilities", "EGP", 22_423.76, "620102", "210302", "pending"],
  ["JE-2026-000608", "2026-03-30", "Staff advance reclassification", "EGP", 16_447.52, "610101", "120306", "pending"],
  ["JE-2026-000609", "2026-03-31", "Year-end bonus provision — Q1 share", "EGP", 58_210, "610101", "210301", "pending"],
]

export function buildJournals(): Row[] {
  const manual = MANUAL.map(([number, date, description, currency, amount, debit, credit, status]) =>
    journal(number, date, description, "Manual", [line(debit, amount, description), line(credit, -amount, description)], {
      origin: "manual",
      source_type: "manual",
      currency,
      rate: currency === "USD" ? 48.6 : 1,
      status,
      posted_by: null,
      posted_at: null,
      submitted_at: status === "pending" ? `${date}T10:00:00.000Z` : null,
    }),
  )
  const vatSettlement = journal(
    VAT_SETTLEMENT_JOURNAL.number,
    VAT_SETTLEMENT_JOURNAL.date,
    "VAT settlement — January 2026",
    "VR-2026-01",
    [
      line(VAT_PAYABLE_ACCOUNT, VAT_SETTLEMENT_JOURNAL.amount, "VAT paid to ETA"),
      line("110201", -VAT_SETTLEMENT_JOURNAL.amount, "VAT paid to ETA"),
    ],
    { source_type: "vat_settlement" },
  )
  return [...monthlyJournals(), vatSettlement, ...manual].reverse()
}

/** Posted base-currency lines of the seeded journals, per account, debit positive. */
function seededLineTotals(): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const row of buildJournals()) {
    if (row.status !== "posted") continue
    for (const entry of row.lines as Line[]) {
      totals[entry.account_code] = r2((totals[entry.account_code] ?? 0) + (entry.debit - entry.credit) * Number(row.rate))
    }
  }
  return totals
}

/**
 * Opening balances at 1 Jan 2026 for the accounts the ledger owns. P&L
 * accounts open at zero; retained earnings is not listed — it balances the
 * opening position live.
 */
export function buildOpeningBalances(): Row[] {
  const lines = seededLineTotals()
  return Object.entries(CLOSING).map(([code, closing]) => ({
    id: code,
    account_code: code,
    amount: r2(closing - (lines[code] ?? 0)),
  }))
}

/** The seeded cash legs, so each treasury's movement list shows them too. */
export function ledgerCashLegs(): { entry: string; date: string; description: string; account_code: string; amount: number }[] {
  const legs: { entry: string; date: string; description: string; account_code: string; amount: number }[] = []
  for (const row of buildJournals()) {
    if (row.status !== "posted") continue
    for (const entry of row.lines as Line[]) {
      if (!/^110[12]/.test(entry.account_code)) continue
      legs.push({
        entry: String(row.number),
        date: String(row.date),
        description: String(row.description),
        account_code: entry.account_code,
        amount: r2(entry.debit - entry.credit),
      })
    }
  }
  return legs
}

type TemplateLine = { account_code: string; side: "debit" | "credit"; share: number }

const pair = (debit: string, credit: string): TemplateLine[] => [
  { account_code: debit, side: "debit", share: 1 },
  { account_code: credit, side: "credit", share: 1 },
]

/** A zero amount means the template asks for it each time it is used. */
export const FIN_JOURNAL_TEMPLATE_ROWS: Row[] = [
  { id: "T-01", code: "T-01", name: "Petty cash reimbursement", amount: 0, cadence: "ad_hoc", lines: pair("620110", "110102") },
  { id: "T-02", code: "T-02", name: "Bank charges", amount: 0, cadence: "monthly", lines: pair("630101", "110201") },
  {
    id: "T-03",
    code: "T-03",
    name: "Payroll accrual",
    amount: 1_850_000,
    cadence: "monthly",
    lines: [
      { account_code: "610101", side: "debit", share: 1 },
      { account_code: "210301", side: "credit", share: 0.8 },
      { account_code: "210401", side: "credit", share: 0.2 },
    ],
  },
  { id: "T-04", code: "T-04", name: "Prepaid rent release", amount: 180_000, cadence: "monthly", lines: pair("620101", "110501") },
  { id: "T-05", code: "T-05", name: "Intercompany settlement", amount: 0, cadence: "ad_hoc", lines: pair("120306", "210105") },
]

export const FIN_RECURRING_ROWS: Row[] = [
  { id: "RJ-01", name: "Office rent accrual", cadence: "monthly", next_run: "2026-04-01", debit_account: "620101", credit_account: "110501", amount: 180_000, status: "active" },
  { id: "RJ-02", name: "Depreciation charge", cadence: "monthly", next_run: "2026-04-30", debit_account: "650101", credit_account: "120201", amount: 94_500, status: "active" },
  { id: "RJ-03", name: "Software subscriptions", cadence: "monthly", next_run: "2026-04-05", debit_account: "640106", credit_account: "210302", amount: 42_300, status: "active" },
  { id: "RJ-04", name: "Utilities accrual", cadence: "monthly", next_run: "2026-04-01", debit_account: "620102", credit_account: "210302", amount: 21_000, status: "active" },
  { id: "RJ-05", name: "Audit fee provision", cadence: "quarterly", next_run: "2026-06-30", debit_account: "640101", credit_account: "210302", amount: 150_000, status: "paused" },
]

/** Currency details beyond the rate; the USD fixings feed the recent-fixings chart. */
export const FIN_CURRENCY_DETAILS: Record<string, { symbol: string; decimals: number }> = {
  EGP: { symbol: "E£", decimals: 2 },
  USD: { symbol: "$", decimals: 2 },
  EUR: { symbol: "€", decimals: 2 },
  SAR: { symbol: "﷼", decimals: 2 },
}

export const FIN_USD_FIXINGS: { date: string; rate: number }[] = [
  { date: "2026-03-24", rate: 48.12 },
  { date: "2026-03-25", rate: 48.2 },
  { date: "2026-03-26", rate: 48.31 },
  { date: "2026-03-27", rate: 48.27 },
  { date: "2026-03-28", rate: 48.4 },
  { date: "2026-03-29", rate: 48.46 },
  { date: "2026-03-30", rate: 48.52 },
  { date: "2026-03-31", rate: 48.6 },
]

/** Rate each foreign-currency treasury was last booked at, before this period's revaluation. */
export const FIN_BOOK_RATES: Record<string, number> = { "bnk-bm-usd-4417": 47.871 }
