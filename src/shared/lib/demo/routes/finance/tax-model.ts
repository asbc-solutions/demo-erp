import { collection, findRow, type Row } from "../../demo-db"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_COLLECTIONS } from "./collections"
import { accountBalances } from "./ledger-model"

/**
 * Tax figures every screen reads: the e-invoicing state behind the rejected /
 * not-sent / seal counts, and the March VAT return, which stays a live view
 * of the VAT control accounts until it is filed.
 */

const r2 = (value: number) => Math.round(value * 100) / 100
export const VAT_RATE = 0.14

function dayDiff(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000)
}

export function eInvoiceSettings(): Row {
  return findRow(FIN_COLLECTIONS.eInvoiceSettings, "settings") as Row
}

export function eInvoiceState() {
  const docs = collection(FIN_COLLECTIONS.eDocuments).filter((row) => row.authority === "ETA")
  const count = (status: string) => docs.filter((row) => row.status === status).length
  const settings = eInvoiceSettings()
  return {
    total: docs.length,
    valid: count("valid"),
    rejected: count("rejected"),
    not_sent: count("not_sent"),
    submitted: count("submitted"),
    cancel_requested: count("cancel_requested"),
    cancelled: count("cancelled"),
    seal_expires: String(settings.seal_expires),
    seal_days: dayDiff(FIN_TODAY, String(settings.seal_expires)),
    items_total: Number(settings.items_total),
    items_unmapped: Number(settings.items_unmapped),
  }
}

/** VAT control balances from the ledger: output payable and input recoverable. */
export function vatControls() {
  const balances = accountBalances()
  return {
    output: r2(-(balances.get("210201")?.closing ?? 0)),
    input: r2(balances.get("110601")?.closing ?? 0),
  }
}

export type VatCheck = { id: string; title: string; count: number; href: string; resolved: boolean; clear: boolean }

/** Pre-filing checks. Routing and supplier numbers are counted live; the rest are seeded findings. */
export function vatChecks(): VatCheck[] {
  const live: Record<string, () => number> = {
    "unrouted-codes": () => collection(FIN_COLLECTIONS.taxCodes).filter((row) => !row.account_code).length,
    "supplier-trn": () => collection(FIN_COLLECTIONS.contacts).filter((row) => row.kind === "supplier" && !row.tax_reg_no).length,
  }
  return collection(FIN_COLLECTIONS.vatChecks).map((row) => {
    const count = live[String(row.id)]?.() ?? Number(row.count ?? 0)
    const resolved = Boolean(row.resolved)
    return { id: String(row.id), title: String(row.title), count, href: String(row.href), resolved, clear: count === 0 || resolved }
  })
}

/** A return with its boxes; a draft reads the ledger, a filed one keeps what was filed. */
export function presentReturn(row: Row): Row {
  const live = row.status === "draft" ? vatControls() : null
  const output = live ? live.output : Number(row.output_vat)
  const input = live ? live.input : Number(row.input_vat)
  const taxable = r2(output / VAT_RATE)
  const zero = Number(row.zero_rated)
  const exempt = Number(row.exempt)
  return {
    ...row,
    output_vat: output,
    input_vat: input,
    net: r2(output - input),
    boxes: {
      total_sales: r2(taxable + zero + exempt),
      taxable_sales: taxable,
      output_vat: output,
      zero_rated: zero,
      exempt,
      total_purchases: r2(input / VAT_RATE),
      input_vat: input,
      non_recoverable: Number(row.non_recoverable),
      adjustments: 0,
    },
  }
}

export function draftReturn(): Row | undefined {
  return collection(FIN_COLLECTIONS.vatReturns).find((row) => row.status === "draft")
}

export function openVatChecks(): number {
  return draftReturn() ? vatChecks().filter((check) => !check.clear).length : 0
}
