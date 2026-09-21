import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { rateFor, toBase } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"
import {
  SIDES,
  contactSummary,
  documents,
  presentDocument,
  r2,
  summaries,
  totals,
  type Side,
} from "./subledger-model"

/** Next document number in a series, e.g. CN-2026-3008 after CN-2026-3007. */
export function nextNumber(prefix: string, rows: Row[], start: number, step: number): string {
  const highest = rows
    .filter((row) => String(row.number).startsWith(prefix))
    .map((row) => Number(String(row.number).split("-").pop()))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), start)
  return `${prefix}${highest + step}`
}

export function presentVoucher(voucher: Row): Row {
  const contact = findRow(FIN_COLLECTIONS.contacts, String(voucher.contact_id))
  const treasury = findRow(FIN_COLLECTIONS.treasuries, String(voucher.treasury_id))
  return {
    ...voucher,
    contact_name: contact?.name ?? "",
    treasury_name: treasury?.name ?? "",
    amount_base: toBase(Number(voucher.amount), String(voucher.currency)),
  }
}

type SubledgerPaths = {
  base: string
  contact: string
  notes: string
  advances: string
  vouchers: string
  notePrefix: string
  noteStart: number
  voucherPrefix: string
  voucherStart: number
}

/**
 * The routes both subledgers share: overview, contact card, write-off, notes
 * (credit / debit), advances and vouchers (receipts / payments).
 */
export function subledgerRoutes(side: Side, paths: SubledgerPaths): DemoRoute[] {
  const config = SIDES[side]

  const creditList = (type: string) => {
    const items = documents(side)
      .filter((doc) => doc.type === type)
      .map((doc): Row & { gross_base: number; unapplied_base: number } => {
        const contact = findRow(FIN_COLLECTIONS.contacts, String(doc.contact_id))
        const currency = String(doc.currency)
        return {
          ...doc,
          contact_name: contact?.name ?? "",
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

  return [
    route("get", `${paths.base}/overview`, () => {
      const figures = totals(side)
      return {
        data: {
          ...figures,
          control_account: config.controlAccount,
          documents_base: figures.total_base,
          // Every document posts to the control account, so they agree by construction.
          ledger_base: figures.total_base,
          contacts: summaries(side),
        },
      }
    }),

    route("get", `${paths.contact}/:id`, (req) => {
      const contact = findRow(FIN_COLLECTIONS.contacts, req.vars.id)
      if (!contact || contact.kind !== config.contactKind) return { status: 404, data: null }
      const items = documents(side)
        .filter((doc) => doc.contact_id === contact.id && Number(doc.outstanding) > 0)
        .filter((doc) => doc.approval !== "returned")
        .map((doc) => presentDocument(side, doc))
      return {
        data: {
          ...contactSummary(side, contact),
          rate: rateFor(String(contact.currency)),
          control_account: config.controlAccount,
          advances_account: config.advancesAccount,
          items,
        },
      }
    }),

    route("post", `${paths.contact}/:id/write-off`, (req) => {
      let written = 0
      for (const doc of documents(side)) {
        if (doc.contact_id !== req.vars.id || doc.type !== config.primary) continue
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

    route("get", paths.notes, () => ({ data: creditList(config.note) })),

    route("post", paths.notes, (req) => {
      const contact = findRow(FIN_COLLECTIONS.contacts, String(req.body.contact_id))
      const amount = r2(Number(req.body.amount))
      if (!contact || !(amount > 0)) return { status: 422, data: null }
      const number = nextNumber(paths.notePrefix, documents(side), paths.noteStart, 1)
      const note = createRow(config.documents, {
        id: number,
        number,
        type: config.note,
        contact_id: contact.id,
        currency: contact.currency,
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

    route("get", paths.advances, () => ({
      data: { ...creditList("advance"), advances_account: config.advancesAccount },
    })),

    route("get", paths.vouchers, () => {
      const items = collection(config.vouchers).map(presentVoucher)
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

    /** New voucher — saved as a draft; it posts from the journal later. */
    route("post", paths.vouchers, (req) => {
      const contact = findRow(FIN_COLLECTIONS.contacts, String(req.body.contact_id))
      const amount = r2(Number(req.body.amount))
      if (!contact || !(amount > 0)) return { status: 422, data: null }
      const number = nextNumber(paths.voucherPrefix, collection(config.vouchers), paths.voucherStart, 10)
      const voucher = createRow(config.vouchers, {
        number,
        date: String(req.body.date ?? FIN_TODAY),
        contact_id: contact.id,
        treasury_id: String(req.body.treasury_id),
        description: String(req.body.description ?? ""),
        origin: "manual",
        amount,
        currency: contact.currency,
        status: "draft",
        allocation: "unallocated",
      })
      voucher.id = number
      return { data: presentVoucher(voucher) }
    }),
  ]
}
