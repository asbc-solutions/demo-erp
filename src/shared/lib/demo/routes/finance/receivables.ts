import { collection, createRow, findRow } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { convert } from "../../seed/finance/banking"
import { postMovement } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"
import { nextNumber, presentVoucher, subledgerRoutes } from "./subledger"
import { openDocuments, r2 } from "./subledger-model"

/** Apply amounts to open invoices; returns what was actually applied. */
function applyAllocations(allocations: { invoice_id: string; amount: number }[]): number {
  let applied = 0
  for (const allocation of allocations) {
    const invoice = findRow(FIN_COLLECTIONS.arDocuments, allocation.invoice_id)
    if (!invoice || invoice.type !== "invoice") continue
    const amount = r2(Math.min(Number(allocation.amount), Number(invoice.outstanding)))
    if (amount <= 0) continue
    invoice.allocated = r2(Number(invoice.allocated) + amount)
    invoice.outstanding = r2(Number(invoice.outstanding) - amount)
    invoice.status = Number(invoice.outstanding) <= 0 ? "paid" : "partial"
    applied = r2(applied + amount)
  }
  return applied
}

/** 02 · Money in — the shared subledger routes plus allocation and collections. */
export const financeReceivablesRoutes: DemoRoute[] = [
  route("get", "/finance/contacts", (req) => {
    const kind = req.params.kind ? String(req.params.kind) : null
    return {
      data: collection(FIN_COLLECTIONS.contacts).filter((row) => !kind || row.kind === kind),
    }
  }),

  ...subledgerRoutes("receivable", {
    base: "/finance/ar",
    contact: "/finance/ar/customers",
    notes: "/finance/ar/credit-notes",
    advances: "/finance/ar/advances",
    vouchers: "/finance/receipts",
    notePrefix: "CN-2026-",
    noteStart: 3000,
    voucherPrefix: "REC-2026-",
    voucherStart: 1022,
  }),

  route("get", "/finance/ar/open-invoices", (req) => ({
    data: openDocuments("receivable", req.params.contact_id ? String(req.params.contact_id) : undefined)
      .filter((doc) => doc.type === "invoice")
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))),
  })),

  route("get", "/finance/ar/collections", () => {
    const overdue = openDocuments("receivable")
      .filter((doc) => Number(doc.days_late) > 0)
      .sort((a, b) => Number(b.outstanding_base) - Number(a.outstanding_base))
    const over90 = overdue.filter((doc) => doc.bucket === "90+")
    return {
      data: {
        overdue_base: r2(overdue.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
        overdue_count: overdue.length,
        over90_base: r2(over90.reduce((sum, doc) => sum + Number(doc.outstanding_base), 0)),
        over90_count: over90.length,
        items: overdue,
      },
    }
  }),

  /** Receipt allocation — posts the receipt, applies it, and moves the cash. */
  route("post", "/finance/ar/receipts", (req) => {
    const customer = findRow(FIN_COLLECTIONS.contacts, String(req.body.contact_id))
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const amount = r2(Number(req.body.amount))
    if (!customer || !treasury || !(amount > 0)) return { status: 422, data: null }

    const allocations = ((req.body.allocations as { invoice_id: string; amount: number }[]) ?? []).map(
      (allocation) => ({ invoice_id: allocation.invoice_id, amount: r2(Number(allocation.amount)) }),
    )
    const applied = applyAllocations(allocations)
    const currency = String(customer.currency)
    const number = nextNumber("REC-2026-", collection(FIN_COLLECTIONS.receipts), 1022, 10)
    postMovement({
      treasury_id: String(treasury.id),
      description: `Receipt — ${String(customer.name)}`,
      source: number,
      source_type: "receipt",
      source_id: number,
      amount: convert(amount, currency, String(treasury.currency)),
    })
    const receipt = createRow(FIN_COLLECTIONS.receipts, {
      number,
      date: FIN_TODAY,
      contact_id: customer.id,
      treasury_id: treasury.id,
      description: `Receipt — ${String(customer.name)}`,
      origin: "manual",
      amount,
      currency,
      status: "posted",
      allocation: applied >= amount ? "allocated" : "unallocated",
      allocations,
      applied,
    })
    receipt.id = number
    return { data: { ...presentVoucher(receipt), unapplied: r2(amount - applied) } }
  }),

  /** Undo an allocation: invoices go back, the receipt returns to the unallocated pool. */
  route("post", "/finance/ar/receipts/:id/unallocate", (req) => {
    const receipt = findRow(FIN_COLLECTIONS.receipts, req.vars.id)
    if (!receipt) return { status: 404, data: null }
    for (const allocation of (receipt.allocations as { invoice_id: string; amount: number }[]) ?? []) {
      const invoice = findRow(FIN_COLLECTIONS.arDocuments, allocation.invoice_id)
      if (!invoice) continue
      invoice.allocated = r2(Number(invoice.allocated) - allocation.amount)
      invoice.outstanding = r2(Number(invoice.outstanding) + allocation.amount)
      invoice.status = Number(invoice.allocated) > 0 ? "partial" : "open"
    }
    Object.assign(receipt, { allocations: [], applied: 0, allocation: "unallocated" })
    return { data: presentVoucher(receipt) }
  }),
]
