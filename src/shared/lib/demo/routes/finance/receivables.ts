import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { AR_CONTROL_ACCOUNT, CUSTOMER_ADVANCES_ACCOUNT } from "../../seed/finance/master-data"
import { rateFor, toBase } from "../../seed/finance/receivables"
import {
  arDocuments,
  arSummaries,
  arTotals,
  customerSummary,
  openDocuments,
  presentDocument,
  r2,
} from "./ar-model"
import { FIN_COLLECTIONS } from "./collections"

/** Next document number in a series, e.g. CN-2026-3008 after CN-2026-3007. */
function nextNumber(prefix: string, rows: Row[], start: number, step: number): string {
  const highest = rows
    .map((row) => Number(String(row.number).split("-").pop()))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), start)
  return `${prefix}${highest + step}`
}

function presentReceipt(receipt: Row): Row {
  const customer = findRow(FIN_COLLECTIONS.contacts, String(receipt.customer_id))
  const treasury = findRow(FIN_COLLECTIONS.treasuries, String(receipt.treasury_id))
  return {
    ...receipt,
    customer_name: customer?.name ?? "",
    treasury_name: treasury?.name ?? "",
    amount_base: toBase(Number(receipt.amount), String(receipt.currency)),
  }
}

/** Credit notes or advances with EGP totals. */
function creditList(type: "credit_note" | "advance") {
  const items = arDocuments()
    .filter((doc) => doc.type === type)
    .map((doc): Row & { gross_base: number; unapplied_base: number } => {
      const customer = findRow(FIN_COLLECTIONS.contacts, String(doc.customer_id))
      const currency = String(doc.currency)
      return {
        ...doc,
        customer_name: customer?.name ?? "",
        gross_base: toBase(Number(doc.gross), currency),
        unapplied_base: toBase(Number(doc.outstanding), currency),
      }
    })
  return {
    items,
    count: items.length,
    open_count: items.filter((item) => Number(item.outstanding) > 0).length,
    total_base: r2(items.reduce((sum, item) => sum + item.gross_base, 0)),
    unapplied_base: r2(items.reduce((sum, item) => sum + item.unapplied_base, 0)),
  }
}

/** Apply amounts to open invoices, oldest documents first when asked. */
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

/** 02 · Money in — receivables, receipts, allocation, collections, credits. */
export const financeReceivablesRoutes: DemoRoute[] = [
  route("get", "/finance/contacts", (req) => {
    const kind = req.params.kind ? String(req.params.kind) : null
    return {
      data: collection(FIN_COLLECTIONS.contacts).filter((row) => !kind || row.kind === kind),
    }
  }),

  route("get", "/finance/treasuries", () => ({ data: collection(FIN_COLLECTIONS.treasuries) })),

  route("get", "/finance/ar/overview", () => {
    const totals = arTotals()
    return {
      data: {
        ...totals,
        control_account: AR_CONTROL_ACCOUNT,
        documents_base: totals.total_base,
        // Every document posts to the control account, so they agree by construction.
        ledger_base: totals.total_base,
        customers: arSummaries(),
      },
    }
  }),

  route("get", "/finance/ar/customers/:id", (req) => {
    const customer = findRow(FIN_COLLECTIONS.contacts, req.vars.id)
    if (!customer || customer.kind !== "customer") {
      return { status: 404, data: null }
    }
    const items = arDocuments()
      .filter((doc) => doc.customer_id === customer.id && Number(doc.outstanding) > 0)
      .map(presentDocument)
    return {
      data: {
        ...customerSummary(customer),
        rate: rateFor(String(customer.currency)),
        control_account: AR_CONTROL_ACCOUNT,
        items,
      },
    }
  }),

  route("post", "/finance/ar/customers/:id/write-off", (req) => {
    let written = 0
    for (const doc of arDocuments()) {
      if (doc.customer_id !== req.vars.id || doc.type !== "invoice") continue
      if (Number(doc.outstanding) <= 0) continue
      written = r2(written + toBase(Number(doc.outstanding), String(doc.currency)))
      Object.assign(doc, {
        written_off: doc.outstanding,
        outstanding: 0,
        status: "written_off",
        write_off_reason: String(req.body.reason ?? ""),
      })
    }
    return { data: { written_off_base: written } }
  }),

  route("get", "/finance/ar/open-invoices", (req) => ({
    data: openDocuments(req.params.customer_id ? String(req.params.customer_id) : undefined)
      .filter((doc) => doc.type === "invoice")
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))),
  })),

  route("get", "/finance/ar/collections", () => {
    const overdue = openDocuments()
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

  route("get", "/finance/ar/credit-notes", () => ({ data: creditList("credit_note") })),

  route("post", "/finance/ar/credit-notes", (req) => {
    const customer = findRow(FIN_COLLECTIONS.contacts, String(req.body.customer_id))
    const amount = r2(Number(req.body.amount))
    if (!customer || !(amount > 0)) return { status: 422, data: null }
    const number = nextNumber("CN-2026-", arDocuments().filter((doc) => doc.type === "credit_note"), 3000, 1)
    const note = createRow(FIN_COLLECTIONS.arDocuments, {
      id: number,
      number,
      type: "credit_note",
      customer_id: customer.id,
      currency: customer.currency,
      date: String(req.body.date ?? FIN_TODAY),
      due_date: null,
      gross: amount,
      allocated: 0,
      outstanding: amount,
      status: "unapplied",
      reason: String(req.body.reason ?? ""),
    })
    note.id = number
    return { data: note }
  }),

  route("get", "/finance/ar/advances", () => ({
    data: { ...creditList("advance"), liability_account: CUSTOMER_ADVANCES_ACCOUNT },
  })),

  route("get", "/finance/receipts", () => {
    const items = collection(FIN_COLLECTIONS.receipts).map(presentReceipt)
    const posted = items.filter((item) => item.status === "posted")
    const total = r2(posted.reduce((sum, item) => sum + Number(item.amount_base), 0))
    return {
      data: {
        items,
        count: items.length,
        total_base: total,
        average_base: posted.length ? r2(total / posted.length) : 0,
        unallocated_count: items.filter((item) => item.allocation === "unallocated").length,
      },
    }
  }),

  /** New receipt voucher — saved as a draft; it posts from the journal later. */
  route("post", "/finance/receipts", (req) => {
    const customer = findRow(FIN_COLLECTIONS.contacts, String(req.body.customer_id))
    const amount = r2(Number(req.body.amount))
    if (!customer || !(amount > 0)) return { status: 422, data: null }
    const number = nextNumber("REC-2026-", collection(FIN_COLLECTIONS.receipts), 1022, 10)
    const receipt = createRow(FIN_COLLECTIONS.receipts, {
      number,
      date: String(req.body.date ?? FIN_TODAY),
      customer_id: customer.id,
      treasury_id: String(req.body.treasury_id),
      description: String(req.body.description ?? ""),
      origin: "manual",
      amount,
      currency: customer.currency,
      status: "draft",
      allocation: "unallocated",
    })
    receipt.id = number
    return { data: presentReceipt(receipt) }
  }),

  /** Receipt allocation — posts the receipt, applies it, and moves the cash. */
  route("post", "/finance/ar/receipts", (req) => {
    const customer = findRow(FIN_COLLECTIONS.contacts, String(req.body.customer_id))
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const amount = r2(Number(req.body.amount))
    if (!customer || !treasury || !(amount > 0)) return { status: 422, data: null }

    const allocations = (req.body.allocations as { invoice_id: string; amount: number }[]) ?? []
    const snapshot = allocations.map((allocation) => ({
      invoice_id: allocation.invoice_id,
      amount: r2(Number(allocation.amount)),
    }))
    const applied = applyAllocations(snapshot)
    const currency = String(customer.currency)
    const inTreasuryCurrency = r2((amount * rateFor(currency)) / rateFor(String(treasury.currency)))
    treasury.balance = r2(Number(treasury.balance) + inTreasuryCurrency)

    const number = nextNumber("REC-2026-", collection(FIN_COLLECTIONS.receipts), 1022, 10)
    const receipt = createRow(FIN_COLLECTIONS.receipts, {
      number,
      date: FIN_TODAY,
      customer_id: customer.id,
      treasury_id: treasury.id,
      description: `Receipt — ${String(customer.name)}`,
      origin: "manual",
      amount,
      currency,
      status: "posted",
      allocation: applied >= amount ? "allocated" : "unallocated",
      allocations: snapshot,
      applied,
    })
    receipt.id = number
    return { data: { ...presentReceipt(receipt), unapplied: r2(amount - applied) } }
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
    return { data: presentReceipt(receipt) }
  }),
]
