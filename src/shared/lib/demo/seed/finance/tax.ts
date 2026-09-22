import type { Row } from "../../demo-db"
import { FIN_CONTACT_ROWS } from "./master-data"

/**
 * Tax & compliance — tax codes, the three VAT returns of Q1, the ETA and
 * ZATCA e-document registers, withholding certificates, declarations and
 * audit files.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export const VAT_PAYABLE_ACCOUNT = "210204"

/** [code, name, kind, rate %, account, jurisdiction]. STAMP has no account routing yet. */
const CODES: [string, string, string, number, string | null, string][] = [
  ["VAT14", "Standard VAT 14%", "vat", 14, "210201", "EG"],
  ["VAT0", "Export 0%", "vat", 0, "210201", "EG"],
  ["VATEX", "Exempt", "vat", 0, "210201", "EG"],
  ["TBL5", "Table tax 5%", "table", 5, "210201", "EG"],
  ["WHT1", "Withholding 1% goods", "withholding", 1, "210202", "EG"],
  ["WHT3", "Withholding 3% services", "withholding", 3, "210202", "EG"],
  ["WHT5", "Withholding 5% professional", "withholding", 5, "210202", "EG"],
  ["STAMP", "Stamp tax", "stamp", 0.4, null, "EG"],
  ["SAVAT15", "KSA VAT 15%", "vat", 15, "210201", "SA"],
]

export const FIN_TAX_CODE_ROWS: Row[] = CODES.map(([code, name, kind, rate, account, jurisdiction]) => ({
  id: code,
  code,
  name,
  kind,
  rate,
  basis: "exclusive",
  account_code: account,
  jurisdiction,
  status: "active",
}))

/** Q1 VAT returns. March is live from the ledger; January and February were filed. */
export const FIN_VAT_RETURN_ROWS: Row[] = [
  {
    id: "VR-2026-01",
    period: "2026-01",
    start: "2026-01-01",
    end: "2026-01-31",
    due: "2026-03-02",
    status: "settled",
    output_vat: 1_612_400,
    input_vat: 1_044_180,
    zero_rated: 412_000,
    exempt: 0,
    non_recoverable: 18_400,
    acknowledgement: "ETA-ACK-2026-01-58813",
    filed_at: "2026-02-24T10:12:00.000Z",
    settlement_entry: "JE-2026-000530",
  },
  {
    id: "VR-2026-02",
    period: "2026-02",
    start: "2026-02-01",
    end: "2026-02-28",
    due: "2026-03-30",
    status: "filed",
    output_vat: 1_708_900,
    input_vat: 1_121_050,
    zero_rated: 412_000,
    exempt: 0,
    non_recoverable: 18_400,
    acknowledgement: "ETA-ACK-2026-02-61207",
    filed_at: "2026-03-26T09:40:00.000Z",
    settlement_entry: null,
  },
  {
    id: "VR-2026-03",
    period: "2026-03",
    start: "2026-03-01",
    end: "2026-03-31",
    due: "2026-04-30",
    status: "draft",
    output_vat: null,
    input_vat: null,
    zero_rated: 412_000,
    exempt: 0,
    non_recoverable: 18_400,
    acknowledgement: null,
    filed_at: null,
    settlement_entry: null,
  },
]

/** The January settlement, already paid from CIB. */
export const VAT_SETTLEMENT_JOURNAL = {
  number: "JE-2026-000530",
  date: "2026-02-26",
  amount: 1_612_400 - 1_044_180,
}

/** VAT payable to the authority at 31 Mar: February's net, not yet paid. */
export const VAT_PAYABLE_CLOSING = -(1_708_900 - 1_121_050)

/** Pre-filing checks for the March return: [id, title, count, source link]. */
export const FIN_VAT_CHECK_ROWS: Row[] = [
  { id: "no-tax-code", title: "Invoices with no tax code", count: 3, href: "/finance/ar", resolved: false },
  { id: "unrouted-codes", title: "Tax codes with no account routing", count: null, href: "/finance/tax/codes", resolved: false },
  { id: "orphan-credit-notes", title: "Credit notes without an original", count: 0, href: "/finance/ar/credit-notes", resolved: false },
  { id: "supplier-trn", title: "Suppliers missing a tax registration number", count: null, href: "/finance/ap", resolved: false },
  { id: "late-entries", title: "Entries dated in period but posted after filing", count: 0, href: "/finance/journals", resolved: false },
  { id: "rounding", title: "Rounding differences above tolerance", count: 1, href: "/finance/ledger?account=210201", resolved: false },
]

// ─── E-documents ─────────────────────────────────────────────────────────────

const HEX = "0da741eb852fc963"
const hex = (seed: number, length: number) =>
  Array.from({ length }, (_, index) => HEX[(seed * 5 + index * 7 + Math.floor(index / 16)) % HEX.length]).join("")

/** Totals the design shows; the rest are generated deterministically. */
const FIXED_TOTALS: Record<number, number> = {
  1: 510_976.82, 2: 122_187.57, 3: 580_263.28, 4: 589_102.39, 5: 689_418.74, 6: 119_684.31, 7: 370_978.98, 8: 199_816.28,
  52: 623_102.48, 53: 523_806.11, 54: 626_079.97, 55: 500_977.65, 56: 326_232.61, 59: 739_011.84, 61: 416_092.34, 63: 182_845.06,
}

function statusFor(n: number): string {
  if (n <= 51) return "valid"
  if (n <= 55) return "rejected"
  if (n <= 58) return "submitted"
  if (n <= 60) return "cancel_requested"
  if (n === 61 || n === 64) return "cancelled"
  return "not_sent"
}

const ERRORS: Record<number, { code: string; message: string; path: string }> = {
  52: { code: "4004", message: "Item code EGS-1120 is not registered for your activity.", path: "invoiceLines[2].itemCode" },
  53: { code: "4004", message: "Item code EGS-1120 is not registered for your activity.", path: "invoiceLines[2].itemCode" },
  54: { code: "4004", message: "Item code EGS-1120 is not registered for your activity.", path: "invoiceLines[2].itemCode" },
  55: { code: "2201", message: "Document total does not equal the sum of line net amounts plus tax.", path: "totalAmount" },
}

const ISSUED: Record<number, string> = { 56: "2026-03-26", 57: "2026-03-27", 58: "2026-03-28", 59: "2026-03-29", 60: "2026-03-30", 61: "2026-03-01", 62: "2026-03-02", 63: "2026-03-03", 64: "2026-03-04" }

export function buildEDocuments(): Row[] {
  const customers = FIN_CONTACT_ROWS.filter((row) => row.kind === "customer")
  const eta = Array.from({ length: 64 }, (_, index) => {
    const n = index + 1
    const status = statusFor(n)
    const issued = ISSUED[n] ?? (n >= 52 && n <= 55 ? `2026-03-${String(n - 30).padStart(2, "0")}` : `2026-03-${String(((n - 1) % 28) + 1).padStart(2, "0")}`)
    const buyer = customers[(n - 1) % customers.length]
    const sent = status !== "not_sent"
    const cleared = ["valid", "cancel_requested", "cancelled"].includes(status)
    const error = ERRORS[n]
    const attempts = status === "rejected" ? 2 : sent ? 1 : 0
    const history: Row[] = [{ id: "built", event: "Document built", actor: "System", date: issued, note: `${n === 1 || n === 56 ? "credit note" : "invoice"} INV-2026-${999 + n}` }]
    if (sent) history.push({ id: "submitted", event: "Submitted to ETA", actor: "System", date: issued, note: `attempt ${attempts}` })
    if (cleared) history.push({ id: "cleared", event: "Cleared", actor: "ETA", date: issued, note: "" })
    if (status === "rejected") history.push({ id: "rejected", event: "Rejected", actor: "ETA", date: issued, note: `error ${error.code}` })
    if (status === "cancel_requested") history.push({ id: "cancel", event: "Cancellation requested", actor: "Karim Fouad", date: "2026-03-30", note: "Duplicate of an earlier invoice" })
    if (status === "cancelled") history.push({ id: "cancelled", event: "Cancelled", actor: "ETA", date: "2026-03-20", note: "Cancellation accepted" })
    return {
      id: `EG-2026-${String(n).padStart(5, "0")}`,
      number: `EG-2026-${String(n).padStart(5, "0")}`,
      authority: "ETA",
      kind: "e_invoice",
      type: n === 1 || n === 56 ? "credit_note" : "invoice",
      buyer_id: buyer.id,
      buyer_name: buyer.name,
      issued,
      total: FIXED_TOTALS[n] ?? r2(100_000 + ((n * 7_919_311) % 60_000_000) / 100),
      currency: "EGP",
      source_document: `INV-2026-${999 + n}`,
      status,
      attempts,
      submission_uuid: sent ? hex(n, 40) : null,
      document_uuid: cleared ? hex(n + 3, 64) : null,
      long_id: cleared ? String(10_000_000_000 + n * 15_821) : null,
      hash: cleared ? hex(n + 7, 44) : null,
      errors: error ? [{ ...error, fixed: false }] : [],
      history,
    }
  })
  const zatca = Array.from({ length: 9 }, (_, index) => {
    const n = index + 1
    const issued = `2026-03-${String(n * 3).padStart(2, "0")}`
    return {
      id: `SA-2026-${String(n).padStart(5, "0")}`,
      number: `SA-2026-${String(n).padStart(5, "0")}`,
      authority: "ZATCA",
      kind: "e_invoice",
      type: "invoice",
      buyer_id: "C-0104",
      buyer_name: "Gulf Technical Est.",
      issued,
      total: r2(12_000 + n * 4_137.5),
      currency: "SAR",
      source_document: `INV-2026-${1100 + n}`,
      status: "valid",
      attempts: 1,
      submission_uuid: hex(n + 40, 40),
      document_uuid: hex(n + 43, 64),
      long_id: String(20_000_000_000 + n * 9_311),
      hash: hex(n + 47, 44),
      errors: [],
      history: [
        { id: "built", event: "Document built", actor: "System", date: issued, note: `invoice INV-2026-${1100 + n}` },
        { id: "submitted", event: "Reported to ZATCA", actor: "System", date: issued, note: "attempt 1" },
        { id: "cleared", event: "Cleared", actor: "ZATCA", date: issued, note: "" },
      ],
    }
  })
  return [...eta, ...zatca]
}

export const FIN_EINVOICE_SETTINGS: Row = {
  id: "settings",
  seal_expires: "2026-04-14",
  items_total: 240,
  items_unmapped: 22,
  unregistered_codes: ["EGS-1120"],
}

/** Declarations other than VAT returns, which are read from the returns themselves. */
export const FIN_DECLARATION_ROWS: Row[] = [
  { id: "DEC-WHT-Q1", name: "Withholding tax", authority: "ETA", period: "Q1 2026", due: "2026-04-30", filed_on: null, href: "/finance/tax/withholding" },
  { id: "DEC-PAY-02", name: "Payroll tax", authority: "ETA", period: "Feb 2026", due: "2026-03-15", filed_on: "2026-03-12", href: null },
  { id: "DEC-CIT-25", name: "Corporate income tax", authority: "ETA", period: "FY2025", due: "2026-04-30", filed_on: null, href: null },
  { id: "DEC-KSA-02", name: "VAT return (KSA)", authority: "ZATCA", period: "Feb 2026", due: "2026-03-31", filed_on: null, href: null },
]

/** Bills with a withholding certificate already issued: every fourth, as in the design. */
export const FIN_WHT_CERTIFICATE_ROWS: Row[] = Array.from({ length: 8 }, (_, index) => ({
  id: `BILL-2026-${2000 + index * 4}`,
  bill_id: `BILL-2026-${2000 + index * 4}`,
  number: `WHT-C-2026-${String(index + 1).padStart(3, "0")}`,
  issued_on: "2026-03-28",
}))

export const FIN_AUDIT_FILE_ROWS: Row[] = [
  { id: "AF-01", name: "SAF-T general ledger", kind: "saft_gl", standard: "OECD SAF-T", period: "2026-02", generated_on: "2026-03-03", status: "ready" },
  { id: "AF-02", name: "ETA e-invoice archive", kind: "eta_archive", standard: "ETA v1.1", period: "2026-02", generated_on: "2026-03-02", status: "ready" },
  { id: "AF-03", name: "VAT transaction listing", kind: "vat_listing", standard: "ETA", period: "2026-02", generated_on: "2026-03-03", status: "ready" },
  { id: "AF-04", name: "SAF-T general ledger", kind: "saft_gl", standard: "OECD SAF-T", period: "2026-03", generated_on: null, status: "generating" },
]
