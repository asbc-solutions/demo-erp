import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_CURRENCY_DETAILS, FIN_USD_FIXINGS } from "../../seed/finance/ledger"
import { AP_CONTROL_ACCOUNT, AR_CONTROL_ACCOUNT } from "../../seed/finance/master-data"
import { rateFor } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"
import {
  accountBalances,
  allJournals,
  createJournal,
  findJournal,
  isOwnedAccount,
  journalTotals,
  postStored,
  postedLines,
  reverseJournal,
  storedJournals,
  validateLines,
  type JournalLine,
} from "./ledger-model"

const r2 = (value: number) => Math.round(value * 100) / 100
const refuse = (message: string) => ({ status: 422, data: { message } })

const accountName = (code: string) => String(findRow(FIN_COLLECTIONS.accounts, code)?.name ?? "")
const normalSide = (type: string) => (type === "asset" || type === "expense" ? "debit" : "credit")

function summary(journal: Row): Row {
  const rest: Row = { ...journal }
  delete rest.lines
  return { ...rest, ...journalTotals(journal), line_count: ((journal.lines as JournalLine[]) ?? []).length }
}

function detail(journal: Row): Row {
  const reversal = storedJournals().find((row) => row.reversal_of === journal.number)
  const manual = journal.origin === "manual"
  return {
    ...journal,
    ...journalTotals(journal),
    lines: (journal.lines as JournalLine[]).map((row) => ({ ...row, account_name: accountName(row.account_code) })),
    reversed_by: reversal?.number ?? null,
    source_href: journal.source_href ?? (journal.reversal_of ? `/finance/journals/${String(journal.reversal_of)}` : null),
    can_reverse: journal.status === "posted" && manual && !journal.reversal_of && !journal.revaluation,
    editable: !journal.derived && (journal.status === "draft" || journal.status === "pending"),
  }
}

function parseLines(value: unknown): JournalLine[] {
  return ((value as JournalLine[]) ?? []).map((row) => ({
    account_code: String(row.account_code ?? ""),
    description: String(row.description ?? ""),
    debit: r2(Number(row.debit) || 0),
    credit: r2(Number(row.credit) || 0),
  }))
}

function stored(id: string): Row | undefined {
  return findRow(FIN_COLLECTIONS.journals, id) ?? undefined
}

function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, last))
  return date.toISOString().slice(0, 10)
}

function settings(): Row {
  return findRow(FIN_COLLECTIONS.ledgerSettings, "settings") as Row
}

/** Foreign-currency treasuries restated at the spot rate. */
function revaluationRows() {
  const bookRates = (settings().book_rates as Record<string, number>) ?? {}
  return collection(FIN_COLLECTIONS.treasuries)
    .filter((row) => row.currency !== "EGP")
    .map((row) => {
      const spot = rateFor(String(row.currency))
      const book = bookRates[String(row.id)] ?? spot
      return {
        treasury_id: row.id,
        name: row.name,
        account_code: row.account_code,
        currency: row.currency,
        balance: Number(row.balance),
        book_rate: book,
        spot_rate: spot,
        unrealized: r2(Number(row.balance) * (spot - book)),
      }
    })
}

const IMPORT_TARGETS: Record<string, { collection: string; required: string[] }> = {
  tax_codes: { collection: FIN_COLLECTIONS.taxCodes, required: ["code", "name", "rate"] },
  cost_centers: { collection: FIN_COLLECTIONS.costCenters, required: ["code", "name"] },
  dimensions: { collection: FIN_COLLECTIONS.dimensions, required: ["code", "name"] },
}

/** 05 · Ledger — chart of accounts, journals, general ledger, templates, openings, FX. */
export const financeLedgerRoutes: DemoRoute[] = [
  route("get", "/finance/ledger/accounts", () => {
    const balances = accountBalances()
    const accounts = collection(FIN_COLLECTIONS.accounts)
    const leaves = accounts.filter((row) => !row.is_group)
    const under = (code: string) => leaves.filter((row) => String(row.code).startsWith(code) && row.code !== code)
    return {
      data: accounts.map((account) => {
        const code = String(account.code)
        const members = account.is_group ? under(code) : [account]
        // Openings count on the side they sit, so debit − credit is the closing balance.
        let debit = 0
        let credit = 0
        for (const member of members) {
          const balance = balances.get(String(member.code))
          if (!balance) continue
          debit += balance.debit + Math.max(balance.opening, 0)
          credit += balance.credit + Math.max(-balance.opening, 0)
        }
        return {
          ...account,
          level: code.length <= 2 ? code.length - 1 : code.length === 4 ? 2 : 3,
          routing: !account.is_group && isOwnedAccount(code) ? "auto" : "manual",
          debit: r2(debit),
          credit: r2(credit),
          balance: r2(debit - credit),
        }
      }),
    }
  }),

  /** One account's movements with a running balance. `contact` opens its control account. */
  route("get", "/finance/ledger", (req) => {
    const contact = req.params.contact ? findRow(FIN_COLLECTIONS.contacts, String(req.params.contact)) : null
    const code = contact
      ? contact.kind === "supplier"
        ? AP_CONTROL_ACCOUNT
        : AR_CONTROL_ACCOUNT
      : String(req.params.account ?? "110101")
    const account = findRow(FIN_COLLECTIONS.accounts, code)
    if (!account || account.is_group) return { status: 404, data: null }
    const balance = accountBalances().get(code)
    const lines = postedLines()
      .filter((row) => row.account_code === code)
      .sort((a, b) => a.date.localeCompare(b.date) || a.entry.localeCompare(b.entry))
    let running = balance?.opening ?? 0
    return {
      data: {
        account: { code, name: account.name, type: account.type, normal_side: normalSide(String(account.type)) },
        contact_name: contact?.name ?? null,
        opening: balance?.opening ?? 0,
        lines: lines.map((row) => {
          running = r2(running + row.debit - row.credit)
          return { ...row, balance: running }
        }),
        debit_total: balance?.debit ?? 0,
        credit_total: balance?.credit ?? 0,
        closing: balance?.closing ?? 0,
      },
    }
  }),

  route("get", "/finance/ledger/templates", () => ({
    data: collection(FIN_COLLECTIONS.journalTemplates).map((row) => ({
      ...row,
      lines: (row.lines as Row[]).map((entry) => ({ ...entry, account_name: accountName(String(entry.account_code)) })),
    })),
  })),

  route("post", "/finance/ledger/templates", (req) => {
    const name = String(req.body.name ?? "").trim()
    const debit = findRow(FIN_COLLECTIONS.accounts, String(req.body.debit_account))
    const credit = findRow(FIN_COLLECTIONS.accounts, String(req.body.credit_account))
    if (!name || !debit || !credit || debit.is_group || credit.is_group) return refuse("A template needs a name and two postable accounts.")
    if (debit.code === credit.code) return refuse("Debit and credit must be different accounts.")
    const code = `T-${String(collection(FIN_COLLECTIONS.journalTemplates).length + 1).padStart(2, "0")}`
    const template = createRow(FIN_COLLECTIONS.journalTemplates, {
      code,
      name,
      amount: r2(Number(req.body.amount) || 0),
      cadence: String(req.body.cadence ?? "ad_hoc"),
      lines: [
        { account_code: debit.code, side: "debit", share: 1 },
        { account_code: credit.code, side: "credit", share: 1 },
      ],
    })
    template.id = code
    return { data: template }
  }),

  route("get", "/finance/ledger/recurring", () => {
    const items = collection(FIN_COLLECTIONS.recurringJournals).map((row): Row => ({
      ...row,
      debit_name: accountName(String(row.debit_account)),
      credit_name: accountName(String(row.credit_account)),
    }))
    const active = items.filter((row) => row.status === "active")
    const nextRun = active.map((row) => String(row.next_run)).sort()[0] ?? null
    return {
      data: {
        items,
        active_count: active.length,
        monthly_value: r2(active.filter((row) => row.cadence === "monthly").reduce((sum, row) => sum + Number(row.amount), 0)),
        next_run: nextRun,
        next_run_names: active.filter((row) => row.next_run === nextRun).map((row) => String(row.name)),
      },
    }
  }),

  route("post", "/finance/ledger/recurring", (req) => {
    const name = String(req.body.name ?? "").trim()
    const debit = findRow(FIN_COLLECTIONS.accounts, String(req.body.debit_account))
    const credit = findRow(FIN_COLLECTIONS.accounts, String(req.body.credit_account))
    const amount = r2(Number(req.body.amount))
    if (!name || !debit || !credit || debit.is_group || credit.is_group || !(amount > 0)) {
      return refuse("A recurring journal needs a name, two postable accounts and an amount.")
    }
    const id = `RJ-${String(collection(FIN_COLLECTIONS.recurringJournals).length + 1).padStart(2, "0")}`
    const row = createRow(FIN_COLLECTIONS.recurringJournals, {
      name,
      cadence: req.body.cadence === "quarterly" ? "quarterly" : "monthly",
      next_run: String(req.body.next_run ?? "2026-04-01"),
      debit_account: debit.code,
      credit_account: credit.code,
      amount,
      status: "active",
    })
    row.id = id
    return { data: row }
  }),

  route("post", "/finance/ledger/recurring/:id/toggle", (req) => {
    const row = findRow(FIN_COLLECTIONS.recurringJournals, req.vars.id)
    if (!row) return { status: 404, data: null }
    row.status = row.status === "active" ? "paused" : "active"
    return { data: row }
  }),

  /** Generate the next draft now and move the schedule on. */
  route("post", "/finance/ledger/recurring/:id/run", (req) => {
    const row = findRow(FIN_COLLECTIONS.recurringJournals, req.vars.id)
    if (!row) return { status: 404, data: null }
    if (row.status !== "active") return refuse("Resume the template before generating from it.")
    const amount = Number(row.amount)
    const journal = createJournal({
      date: String(row.next_run),
      description: `${String(row.name)} — ${String(row.next_run).slice(0, 7)}`,
      lines: [
        { account_code: String(row.debit_account), description: String(row.name), debit: amount, credit: 0 },
        { account_code: String(row.credit_account), description: String(row.name), debit: 0, credit: amount },
      ],
      status: "draft",
      origin: "auto",
      source: String(row.id),
      source_type: "recurring",
    })
    row.next_run = addMonths(String(row.next_run), row.cadence === "quarterly" ? 3 : 1)
    return { data: { journal: journal.number, next_run: row.next_run } }
  }),

  route("get", "/finance/ledger/opening-balances", () => {
    const balances = accountBalances()
    const rows = collection(FIN_COLLECTIONS.accounts)
      .filter((row) => !row.is_group && ["1", "2", "3"].includes(String(row.code)[0]))
      .map((row) => {
        const opening = balances.get(String(row.code))?.opening ?? 0
        return {
          code: row.code,
          name: row.name,
          normal_side: normalSide(String(row.type)),
          debit: opening > 0 ? opening : 0,
          credit: opening < 0 ? -opening : 0,
          owned: isOwnedAccount(String(row.code)),
        }
      })
      .filter((row) => row.debit !== 0 || row.credit !== 0)
    const debit = r2(rows.reduce((sum, row) => sum + row.debit, 0))
    const credit = r2(rows.reduce((sum, row) => sum + row.credit, 0))
    return {
      data: {
        as_at: "2026-01-01",
        items: rows,
        debit,
        credit,
        difference: r2(debit - credit),
        locked: Boolean(settings().openings_locked),
        locked_at: settings().openings_locked_at ?? null,
      },
    }
  }),

  route("post", "/finance/ledger/opening-balances/lock", () => {
    Object.assign(settings(), { openings_locked: true, openings_locked_at: FIN_NOW })
    return { data: { locked: true } }
  }),

  route("get", "/finance/currencies", () => ({
    data: {
      items: collection(FIN_COLLECTIONS.currencies).map((row) => ({
        ...row,
        ...(FIN_CURRENCY_DETAILS[String(row.code)] ?? { symbol: String(row.code), decimals: 2 }),
      })),
      fixings: FIN_USD_FIXINGS,
      refreshed_at: settings().rates_refreshed_at,
    },
  })),

  /** Re-reads the feed for the reporting date. It changes no posted figure. */
  route("post", "/finance/currencies/refresh", () => {
    settings().rates_refreshed_at = FIN_NOW
    return { data: { refreshed_at: FIN_NOW } }
  }),

  route("get", "/finance/ledger/fx-revaluation", () => {
    const items = revaluationRows()
    return {
      data: {
        date: FIN_TODAY,
        items,
        net: r2(items.reduce((sum, row) => sum + row.unrealized, 0)),
        posted: (settings().revaluations as Row[]) ?? [],
      },
    }
  }),

  /** One balanced entry restating every FCY balance; the difference goes to unrealised FX. */
  route("post", "/finance/ledger/fx-revaluation", () => {
    const items = revaluationRows().filter((row) => Math.abs(row.unrealized) >= 0.01)
    if (items.length === 0) return refuse("Every foreign-currency balance is already at the spot rate.")
    const lines: JournalLine[] = []
    for (const row of items) {
      const gain = row.unrealized > 0
      const amount = Math.abs(row.unrealized)
      lines.push({ account_code: String(row.account_code), description: `${String(row.name)} at ${row.spot_rate}`, debit: gain ? amount : 0, credit: gain ? 0 : amount })
      lines.push({ account_code: gain ? "420103" : "630103", description: "Unrealised FX", debit: gain ? 0 : amount, credit: gain ? amount : 0 })
    }
    const net = r2(items.reduce((sum, row) => sum + row.unrealized, 0))
    const journal = createJournal({
      date: FIN_TODAY,
      description: `FX revaluation at ${FIN_TODAY}`,
      lines,
      status: "posted",
      origin: "auto",
      source: "FX revaluation",
      source_type: "revaluation",
      revaluation: true,
    })
    const bookRates = { ...((settings().book_rates as Record<string, number>) ?? {}) }
    for (const row of items) bookRates[String(row.treasury_id)] = row.spot_rate
    Object.assign(settings(), {
      book_rates: bookRates,
      revaluations: [...((settings().revaluations as Row[]) ?? []), { journal: journal.number, date: FIN_TODAY, net }],
    })
    return { data: { journal: journal.number, net } }
  }),

  route("post", "/finance/ledger/import", (req) => {
    const target = IMPORT_TARGETS[String(req.body.kind)]
    if (!target) return refuse("Choose what you are importing.")
    const existing = new Set(collection(target.collection).map((row) => String(row.code)))
    let created = 0
    let skipped = 0
    for (const raw of (req.body.rows as Row[]) ?? []) {
      const ok = target.required.every((field) => String(raw[field] ?? "").trim() !== "")
      if (!ok || existing.has(String(raw.code))) {
        skipped++
        continue
      }
      const row = createRow(target.collection, { ...raw, imported_at: FIN_NOW })
      row.id = String(raw.code)
      existing.add(String(raw.code))
      created++
    }
    return { data: { created, skipped } }
  }),

  route("get", "/finance/journals", (req) => {
    const status = String(req.params.status ?? "all")
    const origin = String(req.params.origin ?? "all")
    const currency = String(req.params.currency ?? "all")
    const q = String(req.params.q ?? "").trim().toLowerCase()
    const journals = allJournals()
    const items = journals.filter((journal) => {
      if (status !== "all" && journal.status !== status) return false
      if (origin !== "all" && journal.origin !== origin) return false
      if (currency !== "all" && journal.currency !== currency) return false
      if (!q) return true
      const haystack = [journal.number, journal.description, journal.source, ...((journal.lines as JournalLine[]) ?? []).map((row) => row.account_code)]
      return haystack.some((value) => String(value ?? "").toLowerCase().includes(q))
    })
    return {
      data: {
        items: items.map(summary),
        total: journals.length,
        by_status: ["draft", "pending", "posted", "reversed"].map((key) => ({ status: key, count: journals.filter((row) => row.status === key).length })),
        currencies: Array.from(new Set(journals.map((row) => String(row.currency)))),
      },
    }
  }),

  route("post", "/finance/journals", (req) => {
    const lines = parseLines(req.body.lines).filter((row) => row.account_code || row.debit || row.credit)
    const description = String(req.body.description ?? "").trim()
    const status = req.body.status === "posted" ? "posted" : req.body.status === "pending" ? "pending" : "draft"
    if (!description) return refuse("Describe the entry.")
    const problem = validateLines(lines)
    if (problem && status !== "draft") return refuse(problem)
    if (lines.length === 0) return refuse("Add at least one line.")
    const journal = createJournal({ date: String(req.body.date ?? FIN_TODAY), description, lines, status })
    return { data: detail(journal) }
  }),

  route("get", "/finance/journals/:id", (req) => {
    const journal = findJournal(req.vars.id)
    return journal ? { data: detail(journal) } : { status: 404, data: null }
  }),

  route("post", "/finance/journals/:id/submit", (req) => {
    const journal = stored(req.vars.id)
    if (!journal || journal.status !== "draft") return refuse("Only a draft can be submitted.")
    const problem = validateLines(journal.lines as JournalLine[])
    if (problem) return refuse(problem)
    Object.assign(journal, { status: "pending", submitted_at: FIN_NOW })
    return { data: detail(journal) }
  }),

  route("post", "/finance/journals/:id/post", (req) => {
    const journal = stored(req.vars.id)
    if (!journal || (journal.status !== "draft" && journal.status !== "pending")) return refuse("This entry cannot be posted.")
    const problem = validateLines(journal.lines as JournalLine[])
    if (problem) return refuse(problem)
    postStored(journal)
    return { data: detail(journal) }
  }),

  route("post", "/finance/journals/:id/send-back", (req) => {
    const journal = stored(req.vars.id)
    if (!journal || journal.status !== "pending") return refuse("Only an entry awaiting approval can be sent back.")
    Object.assign(journal, { status: "draft", returned_reason: String(req.body.reason ?? ""), submitted_at: null })
    return { data: detail(journal) }
  }),

  route("post", "/finance/journals/:id/reverse", (req) => {
    const journal = findJournal(req.vars.id)
    if (!journal) return { status: 404, data: null }
    const reason = String(req.body.reason ?? "").trim()
    if (!detail(journal).can_reverse) return refuse("This entry cannot be reversed here. Change its source document instead.")
    if (!reason) return refuse("Give a reason so the audit trail explains why.")
    const reversal = reverseJournal(journal, String(req.body.date ?? FIN_TODAY), reason)
    return { data: detail(reversal) }
  }),
]
