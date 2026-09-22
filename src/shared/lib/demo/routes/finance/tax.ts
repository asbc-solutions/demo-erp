import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import { VAT_PAYABLE_ACCOUNT } from "../../seed/finance/tax"
import { periodProblem } from "./close-model"
import { FIN_COLLECTIONS } from "./collections"
import { createJournal, postedLines } from "./ledger-model"
import { documents } from "./subledger-model"
import { eInvoiceSettings, eInvoiceState, presentReturn, vatChecks } from "./tax-model"

const r2 = (value: number) => Math.round(value * 100) / 100
const refuse = (message: string) => ({ status: 422, data: { message } })

function dayDiff(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000)
}

function addYears(iso: string, years: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

const hexOf = (text: string, length: number) =>
  Array.from({ length }, (_, index) => "0123456789abcdef"[(text.charCodeAt(index % text.length) * (index + 3)) % 16]).join("")

// ─── Withholding ─────────────────────────────────────────────────────────────

const WHT_CODES = [
  { code: "WHT1", rate: 0.01 },
  { code: "WHT3", rate: 0.03 },
  { code: "WHT5", rate: 0.05 },
]

function withholdingRows(): Row[] {
  const certificates = new Map(collection(FIN_COLLECTIONS.whtCertificates).map((row) => [String(row.bill_id), row]))
  return documents("payable")
    .filter((doc) => doc.type === "bill")
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .map((bill, index) => {
      const { code, rate } = WHT_CODES[index % WHT_CODES.length]
      const certificate = certificates.get(String(bill.id))
      return {
        id: bill.id,
        bill: bill.number,
        supplier: findRow(FIN_COLLECTIONS.contacts, String(bill.contact_id))?.name ?? "",
        date: bill.date,
        gross: Number(bill.gross),
        code,
        rate: rate * 100,
        amount: r2(Number(bill.gross) * rate),
        status: certificate ? "certified" : "accrued",
        certificate: certificate?.number ?? null,
      }
    })
}

// ─── E-documents ─────────────────────────────────────────────────────────────

const unfixed = (doc: Row) => ((doc.errors as Row[]) ?? []).filter((error) => !error.fixed)

function presentDocument(doc: Row): Row {
  return { ...doc, open_errors: unfixed(doc).length }
}

/** Resubmission clears a document whose errors are all fixed; otherwise it fails the same way. */
function resubmit(doc: Row): boolean {
  const attempts = Number(doc.attempts) + 1
  const history = [...((doc.history as Row[]) ?? [])]
  history.push({ id: `submitted-${attempts}`, event: "Submitted to ETA", actor: FIN_ACTOR, date: FIN_TODAY, note: `attempt ${attempts}` })
  const open = unfixed(doc)
  if (open.length > 0) {
    history.push({ id: `rejected-${attempts}`, event: "Rejected", actor: String(doc.authority), date: FIN_TODAY, note: `error ${String(open[0].code)}` })
    Object.assign(doc, { status: "rejected", attempts, history, submission_uuid: hexOf(`${String(doc.id)}${attempts}`, 40) })
    return false
  }
  history.push({ id: `cleared-${attempts}`, event: "Cleared", actor: String(doc.authority), date: FIN_TODAY, note: "" })
  Object.assign(doc, {
    status: "valid",
    attempts,
    history,
    submission_uuid: hexOf(`${String(doc.id)}${attempts}`, 40),
    document_uuid: hexOf(`${String(doc.id)}doc`, 64),
    long_id: String(10_000_600_000 + attempts * 311),
    hash: hexOf(`${String(doc.id)}hash`, 44),
  })
  return true
}

function errorGroups(docs: Row[]) {
  const groups = new Map<string, { code: string; message: string; path: string; ids: string[]; value: number }>()
  for (const doc of docs.filter((row) => row.status === "rejected")) {
    for (const error of (doc.errors as Row[]) ?? []) {
      const key = String(error.code)
      const group = groups.get(key) ?? { code: key, message: String(error.message), path: String(error.path), ids: [], value: 0 }
      group.ids.push(String(doc.id))
      group.value = r2(group.value + Number(doc.total))
      groups.set(key, group)
    }
  }
  // An item-code error is fixed once centrally; a total mismatch needs each document corrected.
  return [...groups.values()].map((group) => ({ ...group, bulk: group.code === "4004" }))
}

// ─── Declarations ────────────────────────────────────────────────────────────

function declarationStatus(due: string, filed: boolean): { status: string; days: number | null } {
  if (filed) return { status: "filed", days: null }
  const days = dayDiff(FIN_TODAY, due)
  return { status: days < 0 ? "overdue" : days <= 7 ? "due" : "upcoming", days }
}

function declarationRows(): Row[] {
  const vat = collection(FIN_COLLECTIONS.vatReturns).map((row): Row => {
    const filed = row.status !== "draft"
    const label = new Date(`${String(row.start)}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })
    return {
      id: row.id,
      name: "VAT return",
      authority: "ETA",
      period: label,
      due: row.due,
      filed_on: filed ? String(row.filed_at).slice(0, 10) : null,
      href: `/finance/tax/vat-return?period=${String(row.period)}`,
      can_file: false,
      ...declarationStatus(String(row.due), filed),
    }
  })
  const others = collection(FIN_COLLECTIONS.declarations).map((row): Row => ({
    ...row,
    can_file: !row.filed_on && !row.href,
    ...declarationStatus(String(row.due), Boolean(row.filed_on)),
  }))
  return [...vat, ...others].sort((a, b) => String(a.due).localeCompare(String(b.due)))
}

// ─── Audit files ─────────────────────────────────────────────────────────────

const AUDIT_KINDS: Record<string, { name: string; standard: string }> = {
  saft_gl: { name: "SAF-T general ledger", standard: "OECD SAF-T" },
  eta_archive: { name: "ETA e-invoice archive", standard: "ETA v1.1" },
  vat_listing: { name: "VAT transaction listing", standard: "ETA" },
}

function auditRecords(kind: string, period: string): { headers: string[]; rows: unknown[][] } {
  if (kind === "saft_gl") {
    const lines = postedLines().filter((row) => row.period === period)
    return {
      headers: ["Entry", "Date", "Account", "Description", "Debit", "Credit"],
      rows: lines.map((row) => [row.entry, row.date, row.account_code, row.description, row.debit, row.credit]),
    }
  }
  // Every sales invoice and credit note in the period was issued electronically.
  const sales = documents("receivable").filter((doc) => doc.type !== "advance" && String(doc.date).startsWith(period))
  const name = (id: unknown) => String(findRow(FIN_COLLECTIONS.contacts, String(id))?.name ?? "")
  if (kind === "eta_archive") {
    return {
      headers: ["Document", "Type", "Buyer", "Issued", "Total", "Currency"],
      rows: sales.map((doc) => [doc.number, doc.type, name(doc.contact_id), doc.date, doc.gross, doc.currency]),
    }
  }
  const purchases = documents("payable").filter((doc) => doc.type === "bill" && String(doc.date).startsWith(period))
  return {
    headers: ["Document", "Direction", "Counterparty", "Date", "Net", "VAT", "Total"],
    rows: [...sales, ...purchases].map((doc) => {
      const total = Number(doc.gross)
      const net = r2(total / 1.14)
      return [doc.number, doc.type === "bill" ? "purchase" : "sale", name(doc.contact_id), doc.date, net, r2(total - net), total]
    }),
  }
}

function presentAuditFile(file: Row): Row {
  const ready = file.status === "ready"
  return { ...file, records: ready ? auditRecords(String(file.kind), String(file.period)).rows.length : null }
}

/** 07 · Tax & compliance — VAT, withholding, e-invoicing, declarations, codes and audit files. */
export const financeTaxRoutes: DemoRoute[] = [
  route("get", "/finance/tax/vat-returns", () => ({
    data: collection(FIN_COLLECTIONS.vatReturns).map((row) => ({ id: row.id, period: row.period, end: row.end, status: row.status })),
  })),

  route("get", "/finance/tax/vat-returns/:id", (req) => {
    const row = findRow(FIN_COLLECTIONS.vatReturns, req.vars.id)
    if (!row) return { status: 404, data: null }
    return { data: { ...presentReturn(row), checks: row.status === "draft" ? vatChecks() : [] } }
  }),

  route("post", "/finance/tax/vat-returns/:id/checks/:check/resolve", (req) => {
    const check = findRow(FIN_COLLECTIONS.vatChecks, req.vars.check)
    if (!check) return { status: 404, data: null }
    Object.assign(check, { resolved: true, resolved_by: FIN_ACTOR, resolved_at: FIN_NOW })
    return { data: vatChecks() }
  }),

  /** Filing moves the VAT control balances to the payable due to the authority. */
  route("post", "/finance/tax/vat-returns/:id/file", (req) => {
    const row = findRow(FIN_COLLECTIONS.vatReturns, req.vars.id)
    if (!row || row.status !== "draft") return refuse("Only a draft return can be filed.")
    const open = vatChecks().filter((check) => !check.clear).length
    if (open > 0) return refuse(`${open} pre-filing checks are unresolved. Every check must be clear before the return can be filed.`)
    const closed = periodProblem(FIN_TODAY)
    if (closed) return refuse(closed)
    const figures = presentReturn(row)
    const output = Number(figures.output_vat)
    const input = Number(figures.input_vat)
    const net = r2(output - input)
    const journal = createJournal({
      date: FIN_TODAY,
      description: `VAT return filed — ${String(row.period)}`,
      lines: [
        { account_code: "210201", description: "Output VAT", debit: output, credit: 0 },
        { account_code: "110601", description: "Input VAT", debit: 0, credit: input },
        net >= 0
          ? { account_code: VAT_PAYABLE_ACCOUNT, description: "VAT payable to ETA", debit: 0, credit: net }
          : { account_code: VAT_PAYABLE_ACCOUNT, description: "VAT refundable", debit: -net, credit: 0 },
      ],
      status: "posted",
      origin: "auto",
      source: String(row.id),
      source_type: "vat_return",
    })
    Object.assign(row, {
      status: "filed",
      output_vat: output,
      input_vat: input,
      filed_at: FIN_NOW,
      acknowledgement: `ETA-ACK-${String(row.period)}-${String(70000 + collection(FIN_COLLECTIONS.journals).length)}`,
      filing_entry: journal.number,
    })
    return { data: presentReturn(row) }
  }),

  /** Settlement pays the authority from a treasury and clears the payable. */
  route("post", "/finance/tax/vat-returns/:id/settle", (req) => {
    const row = findRow(FIN_COLLECTIONS.vatReturns, req.vars.id)
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    if (!row || row.status !== "filed") return refuse("Only a filed return can be settled.")
    if (!treasury || treasury.currency !== "EGP") return refuse("Choose an EGP treasury to pay from.")
    const net = r2(Number(row.output_vat) - Number(row.input_vat))
    if (net > Number(treasury.balance)) return refuse(`${String(treasury.name)} holds less than the ${net.toFixed(2)} EGP due.`)
    const journal = createJournal({
      date: FIN_TODAY,
      description: `VAT settlement — ${String(row.period)}`,
      lines: [
        { account_code: VAT_PAYABLE_ACCOUNT, description: "VAT paid to ETA", debit: net, credit: 0 },
        { account_code: String(treasury.account_code), description: "VAT paid to ETA", debit: 0, credit: net },
      ],
      status: "posted",
      origin: "auto",
      source: String(row.id),
      source_type: "vat_settlement",
    })
    Object.assign(row, { status: "settled", settlement_entry: journal.number, settled_at: FIN_NOW })
    return { data: presentReturn(row) }
  }),

  route("get", "/finance/tax/withholding", () => {
    const items = withholdingRows()
    const total = r2(items.reduce((sum, row) => sum + Number(row.amount), 0))
    const certified = items.filter((row) => row.status === "certified")
    const certifiedTotal = r2(certified.reduce((sum, row) => sum + Number(row.amount), 0))
    return {
      data: { items, total, certified: certifiedTotal, certificates: certified.length, pending: r2(total - certifiedTotal) },
    }
  }),

  route("post", "/finance/tax/withholding/certificates", (req) => {
    const wanted = new Set(((req.body.bill_ids as string[]) ?? []).map(String))
    const accrued = withholdingRows().filter((row) => row.status === "accrued" && (wanted.size === 0 || wanted.has(String(row.id))))
    if (accrued.length === 0) return refuse("Every selected line already has a certificate.")
    let next = collection(FIN_COLLECTIONS.whtCertificates).length
    for (const row of accrued) {
      next += 1
      const certificate = createRow(FIN_COLLECTIONS.whtCertificates, {
        bill_id: row.id,
        number: `WHT-C-2026-${String(next).padStart(3, "0")}`,
        issued_on: FIN_TODAY,
      })
      certificate.id = String(row.id)
    }
    return { data: { issued: accrued.length } }
  }),

  route("get", "/finance/tax/e-invoicing", (req) => {
    const authority = req.params.authority === "ZATCA" ? "ZATCA" : "ETA"
    const all = collection(FIN_COLLECTIONS.eDocuments)
    const docs = all.filter((row) => row.authority === authority).sort((a, b) => String(a.number).localeCompare(String(b.number)))
    const state = eInvoiceState()
    return {
      data: {
        authority,
        items: docs.map(presentDocument),
        state,
        authorities: { ETA: all.filter((row) => row.authority === "ETA").length, ZATCA: all.filter((row) => row.authority === "ZATCA").length },
        groups: errorGroups(docs),
        unregistered_codes: (eInvoiceSettings().unregistered_codes as string[]) ?? [],
      },
    }
  }),

  route("post", "/finance/tax/e-invoicing/submit-batch", () => {
    const pending = collection(FIN_COLLECTIONS.eDocuments).filter((row) => row.status === "not_sent")
    if (pending.length === 0) return refuse("Nothing is waiting to be sent.")
    const cleared = pending.filter(resubmit).length
    return { data: { sent: pending.length, cleared } }
  }),

  route("post", "/finance/tax/e-invoicing/resubmit-group", (req) => {
    const code = String(req.body.code)
    const docs = collection(FIN_COLLECTIONS.eDocuments).filter(
      (row) => row.status === "rejected" && ((row.errors as Row[]) ?? []).some((error) => String(error.code) === code),
    )
    if (docs.length === 0) return refuse("No rejected document carries that error.")
    const cleared = docs.filter(resubmit).length
    return { data: { sent: docs.length, cleared } }
  }),

  route("post", "/finance/tax/e-invoicing/renew-seal", () => {
    const settings = eInvoiceSettings()
    // A renewal runs a year from the current expiry, or from today if it has lapsed.
    const from = String(settings.seal_expires) > FIN_TODAY ? String(settings.seal_expires) : FIN_TODAY
    settings.seal_expires = addYears(from, 1)
    return { data: { seal_expires: settings.seal_expires } }
  }),

  /** Mapping links every item to the authority's list, so item-code errors no longer apply. */
  route("post", "/finance/tax/e-invoicing/map-items", () => {
    Object.assign(eInvoiceSettings(), { items_unmapped: 0, unregistered_codes: [] })
    for (const doc of collection(FIN_COLLECTIONS.eDocuments)) {
      for (const error of (doc.errors as Row[]) ?? []) if (error.code === "4004") error.fixed = true
    }
    return { data: eInvoiceState() }
  }),

  route("get", "/finance/tax/e-invoicing/:id", (req) => {
    const doc = findRow(FIN_COLLECTIONS.eDocuments, req.vars.id)
    return doc ? { data: presentDocument(doc) } : { status: 404, data: null }
  }),

  route("post", "/finance/tax/e-invoicing/:id/submit", (req) => {
    const doc = findRow(FIN_COLLECTIONS.eDocuments, req.vars.id)
    if (!doc || !["not_sent", "rejected"].includes(String(doc.status))) return refuse("Only a not-sent or rejected document can be submitted.")
    const cleared = resubmit(doc)
    return { data: { ...presentDocument(doc), cleared } }
  }),

  route("post", "/finance/tax/e-invoicing/:id/fix", (req) => {
    const doc = findRow(FIN_COLLECTIONS.eDocuments, req.vars.id)
    const code = String(req.body.code)
    if (!doc) return { status: 404, data: null }
    if (code === "4004") {
      Object.assign(eInvoiceSettings(), {
        unregistered_codes: [],
        items_unmapped: Math.max(0, Number(eInvoiceSettings().items_unmapped) - 1),
      })
      for (const other of collection(FIN_COLLECTIONS.eDocuments)) {
        for (const error of (other.errors as Row[]) ?? []) if (error.code === "4004") error.fixed = true
      }
    } else {
      for (const error of (doc.errors as Row[]) ?? []) if (String(error.code) === code) error.fixed = true
    }
    return { data: presentDocument(doc) }
  }),

  route("post", "/finance/tax/e-invoicing/:id/cancel", (req) => {
    const doc = findRow(FIN_COLLECTIONS.eDocuments, req.vars.id)
    const reason = String(req.body.reason ?? "").trim()
    if (!doc || doc.status !== "valid") return refuse("Only a cleared document can be cancelled.")
    if (!reason) return refuse("Give the reason the authority will see.")
    doc.status = "cancel_requested"
    doc.history = [...((doc.history as Row[]) ?? []), { id: "cancel", event: "Cancellation requested", actor: FIN_ACTOR, date: FIN_TODAY, note: reason }]
    return { data: presentDocument(doc) }
  }),

  /** Ask the authority for a submitted document's outcome. */
  route("post", "/finance/tax/e-invoicing/:id/refresh", (req) => {
    const doc = findRow(FIN_COLLECTIONS.eDocuments, req.vars.id)
    if (!doc || doc.status !== "submitted") return refuse("Only a submitted document is waiting for a response.")
    Object.assign(doc, {
      status: "valid",
      document_uuid: hexOf(`${String(doc.id)}doc`, 64),
      long_id: String(10_000_700_000 + Number(doc.attempts)),
      hash: hexOf(`${String(doc.id)}hash`, 44),
      history: [...((doc.history as Row[]) ?? []), { id: "cleared", event: "Cleared", actor: String(doc.authority), date: FIN_TODAY, note: "" }],
    })
    return { data: presentDocument(doc) }
  }),

  route("get", "/finance/tax/declarations", () => {
    const items = declarationRows()
    const count = (status: string) => items.filter((row) => row.status === status).length
    return {
      data: {
        items,
        due_now: count("due") + count("overdue"),
        filed_quarter: items.filter((row) => row.status === "filed" && String(row.filed_on ?? "") >= "2026-01-01").length,
        upcoming: count("upcoming"),
      },
    }
  }),

  route("post", "/finance/tax/declarations/:id/file", (req) => {
    const row = findRow(FIN_COLLECTIONS.declarations, req.vars.id)
    if (!row || row.filed_on) return refuse("That declaration is already filed or cannot be filed here.")
    Object.assign(row, { filed_on: FIN_TODAY, filed_by: FIN_ACTOR })
    return { data: row }
  }),

  route("get", "/finance/tax/codes", () => {
    const items = collection(FIN_COLLECTIONS.taxCodes).map((row): Row => ({
      ...row,
      account_name: row.account_code ? String(findRow(FIN_COLLECTIONS.accounts, String(row.account_code))?.name ?? "") : null,
    }))
    const kind = (value: string) => items.filter((row) => row.kind === value).length
    return {
      data: {
        items,
        vat: kind("vat"),
        withholding: kind("withholding"),
        other: items.length - kind("vat") - kind("withholding"),
        jurisdictions: Array.from(new Set(items.map((row) => String(row.jurisdiction)))),
      },
    }
  }),

  route("post", "/finance/tax/codes", (req) => {
    const code = String(req.body.code ?? "").trim().toUpperCase()
    const name = String(req.body.name ?? "").trim()
    const rate = Number(req.body.rate)
    const account = findRow(FIN_COLLECTIONS.accounts, String(req.body.account_code))
    if (!code || !name || !Number.isFinite(rate) || rate < 0 || rate > 100) return refuse("A tax code needs a code, a name and a rate between 0 and 100.")
    if (!account || account.is_group) return refuse("Route the code to a postable account.")
    if (findRow(FIN_COLLECTIONS.taxCodes, code)) return refuse(`${code} already exists.`)
    const row = createRow(FIN_COLLECTIONS.taxCodes, {
      code,
      name,
      kind: String(req.body.kind ?? "vat"),
      rate,
      basis: "exclusive",
      account_code: account.code,
      jurisdiction: String(req.body.jurisdiction ?? "EG"),
      status: "active",
    })
    row.id = code
    return { data: row }
  }),

  route("get", "/finance/tax/audit-files", () => {
    const items = collection(FIN_COLLECTIONS.auditFiles).map(presentAuditFile)
    return {
      data: {
        items,
        ready: items.filter((row) => row.status === "ready").length,
        records: items.reduce((sum, row) => sum + Number(row.records ?? 0), 0),
        generating: items.filter((row) => row.status === "generating").length,
        closed_periods: collection(FIN_COLLECTIONS.periods)
          .filter((row) => row.status === "closed" || row.status === "locked")
          .map((row) => ({ id: row.id, label: row.label })),
      },
    }
  }),

  /** A file is a point-in-time export of a closed period. */
  route("post", "/finance/tax/audit-files", (req) => {
    const kind = String(req.body.kind)
    const period = findRow(FIN_COLLECTIONS.periods, String(req.body.period))
    if (!AUDIT_KINDS[kind]) return refuse("Choose which file to generate.")
    if (!period || !["closed", "locked"].includes(String(period.status))) {
      return refuse("Audit files are generated for closed periods. Close the period first.")
    }
    const count = collection(FIN_COLLECTIONS.auditFiles).length
    const file = createRow(FIN_COLLECTIONS.auditFiles, {
      ...AUDIT_KINDS[kind],
      kind,
      period: period.id,
      generated_on: FIN_TODAY,
      status: "ready",
    })
    file.id = `AF-${String(count + 1).padStart(2, "0")}`
    return { data: presentAuditFile(file) }
  }),

  route("get", "/finance/tax/audit-files/:id/export", (req) => {
    const file = findRow(FIN_COLLECTIONS.auditFiles, req.vars.id)
    if (!file || file.status !== "ready") return refuse("That file is not ready yet.")
    return { data: { name: `${String(file.kind)}-${String(file.period)}.csv`, ...auditRecords(String(file.kind), String(file.period)) } }
  }),
]
