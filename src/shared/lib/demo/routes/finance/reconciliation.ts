import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { STATEMENT_IMPORT_TEMPLATE, convert } from "../../seed/finance/banking"
import { FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { postMovement, presentTreasury } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"

/**
 * Bank reconciliation — statement lines against the posted book entries on
 * the same bank account. Matching changes no ledger figure; creating an entry
 * from a statement line is a real posting to the treasury.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

/** Pairs scoring below this are not suggested. */
const SUGGEST_FROM = 55
/** Amounts within this are treated as the same payment (rounding, small fees). */
const TOLERANCE = 1

type Suggestion = {
  line_id: string
  entry_id: string
  score: number
  label: "exact" | "likely" | "possible"
  reasons: string[]
}

export type UnmatchedCause = "other_way" | "amount_differs" | "resembles" | "no_candidate"

function words(text: unknown): Set<string> {
  return new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1))
}

function commonWords(a: Row, b: Row): number {
  const left = words(a.description)
  return [...words(b.description)].filter((word) => left.has(word)).length
}

function daysApart(a: Row, b: Row): number {
  return Math.abs(
    Math.round(
      (new Date(`${String(a.date)}T00:00:00Z`).getTime() - new Date(`${String(b.date)}T00:00:00Z`).getTime()) /
        86_400_000,
    ),
  )
}

const sameDirection = (a: Row, b: Row) => Math.sign(Number(a.amount)) === Math.sign(Number(b.amount))
const gap = (a: Row, b: Row) => r2(Math.abs(Number(a.amount) - Number(b.amount)))

/**
 * Amount carries most of the weight, then date, then shared words:
 * exact amount 50 (within 1.00: 29) · same day 25, 1 day 16, 2–3 days 8 ·
 * 7.5 per word in common, up to two.
 */
function score(line: Row, entry: Row): Omit<Suggestion, "line_id" | "entry_id"> | null {
  if (!sameDirection(line, entry)) return null
  const difference = gap(line, entry)
  const amountScore = difference < 0.005 ? 50 : difference <= TOLERANCE ? 29 : 0
  if (amountScore === 0) return null
  const days = daysApart(line, entry)
  const dateScore = days === 0 ? 25 : days === 1 ? 16 : days <= 3 ? 8 : 0
  const common = Math.min(2, commonWords(line, entry))
  const total = Math.round(amountScore + dateScore + common * 7.5)
  return {
    score: total,
    label: total >= 85 ? "exact" : total >= 75 ? "likely" : "possible",
    reasons: [
      difference < 0.005 ? "amounts match exactly" : `amounts differ by ${difference.toFixed(2)}`,
      days === 0 ? "same day" : `${days} ${days === 1 ? "day" : "days"} apart`,
      `${common} ${common === 1 ? "word" : "words"} in common`,
    ],
  }
}

const statementLines = (treasuryId: string) =>
  collection(FIN_COLLECTIONS.statementLines).filter((line) => line.treasury_id === treasuryId)
const bookEntries = (treasuryId: string) =>
  collection(FIN_COLLECTIONS.bookEntries).filter((entry) => entry.treasury_id === treasuryId)

/** Best pairs first; each line and entry is suggested at most once. */
function suggestionsFor(treasuryId: string): Suggestion[] {
  const lines = statementLines(treasuryId).filter((line) => line.status === "unmatched")
  const entries = bookEntries(treasuryId).filter((entry) => entry.status === "unmatched")
  const candidates: Suggestion[] = []
  for (const line of lines) {
    const dismissed = new Set((line.dismissed_entry_ids as string[]) ?? [])
    for (const entry of entries) {
      if (dismissed.has(String(entry.id))) continue
      const result = score(line, entry)
      if (result && result.score >= SUGGEST_FROM) {
        candidates.push({ line_id: String(line.id), entry_id: String(entry.id), ...result })
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.line_id.localeCompare(b.line_id))
  const usedLines = new Set<string>()
  const usedEntries = new Set<string>()
  return candidates.filter((candidate) => {
    if (usedLines.has(candidate.line_id) || usedEntries.has(candidate.entry_id)) return false
    usedLines.add(candidate.line_id)
    usedEntries.add(candidate.entry_id)
    return true
  })
}

/** Why a line with no suggestion has not matched, so a batch can be dealt with at once. */
function causeFor(line: Row, entries: Row[]): UnmatchedCause {
  const size = Math.abs(Number(line.amount))
  if (entries.some((entry) => !sameDirection(line, entry) && Math.abs(Math.abs(Number(entry.amount)) - size) <= TOLERANCE)) {
    return "other_way"
  }
  const same = entries.filter((entry) => sameDirection(line, entry))
  if (same.some((entry) => commonWords(line, entry) > 0 && daysApart(line, entry) <= 7 && gap(line, entry) > TOLERANCE)) {
    return "amount_differs"
  }
  if (same.some((entry) => commonWords(line, entry) > 0 || gap(line, entry) <= TOLERANCE)) return "resembles"
  return "no_candidate"
}

function workspace(treasuryId: string) {
  const treasury = findRow(FIN_COLLECTIONS.treasuries, treasuryId)
  if (!treasury || treasury.kind !== "bank") return null
  const lines = statementLines(treasuryId).filter((line) => line.status !== "reconciled")
  const entries = bookEntries(treasuryId)
  const openLines = lines.filter((line) => line.status === "unmatched").sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const openEntries = entries.filter((entry) => entry.status === "unmatched").sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const suggestions = suggestionsFor(treasuryId)
  const suggested = new Set(suggestions.map((suggestion) => suggestion.line_id))

  const causes = new Map<UnmatchedCause, string[]>()
  for (const line of openLines) {
    if (suggested.has(String(line.id))) continue
    const cause = causeFor(line, openEntries)
    causes.set(cause, [...(causes.get(cause) ?? []), String(line.id)])
  }

  const matched = lines
    .filter((line) => line.status === "matched")
    .map((line) => {
      const entry = line.matched_entry_id ? findRow(FIN_COLLECTIONS.bookEntries, String(line.matched_entry_id)) : null
      return {
        line,
        entry: entry ?? { id: null, entry: line.matched_entry_ref, description: line.description, amount: line.amount },
        difference: entry ? r2(Number(line.amount) - Number(entry.amount)) : 0,
        auto: Boolean(line.auto),
      }
    })

  const statementTotal = r2(openLines.reduce((sum, line) => sum + Number(line.amount), 0))
  const bookTotal = r2(openEntries.reduce((sum, entry) => sum + Number(entry.amount), 0))

  return {
    treasury: presentTreasury(treasury),
    accounts: collection(FIN_COLLECTIONS.treasuries)
      .filter((row) => row.kind === "bank")
      .map((row) => ({ id: row.id, name: row.name, unmatched_lines: statementLines(String(row.id)).filter((line) => line.status === "unmatched").length })),
    statement: { items: openLines, count: openLines.length, total: statementTotal },
    book: { items: openEntries, count: openEntries.length, total: bookTotal },
    difference: r2(statementTotal - bookTotal),
    matched,
    matched_count: matched.length,
    total_count: lines.length,
    suggestions,
    causes: Array.from(causes, ([id, lineIds]) => ({ id, line_ids: lineIds })),
    can_finish: openLines.length === 0 && lines.length > 0,
  }
}

function matchPair(treasuryId: string, lineId: string, entryId: string): string | null {
  const line = findRow(FIN_COLLECTIONS.statementLines, lineId)
  const entry = findRow(FIN_COLLECTIONS.bookEntries, entryId)
  if (!line || !entry || line.treasury_id !== treasuryId || entry.treasury_id !== treasuryId) {
    return "Those lines are not on this account."
  }
  if (line.status !== "unmatched" || entry.status !== "unmatched") return "One of those lines is already matched."
  if (gap(line, entry) > TOLERANCE) {
    return `The amounts differ by ${gap(line, entry).toFixed(2)}. Create an entry for the difference, or pick another pair.`
  }
  Object.assign(line, { status: "matched", matched_entry_id: entry.id })
  Object.assign(entry, { status: "matched", matched_line_id: line.id })
  return null
}

const refuse = (message: string) => ({ status: 422, data: { message } })

function importLines(treasury: Row) {
  const existing = collection(FIN_COLLECTIONS.statementLines).filter((line) => line.treasury_id === treasury.id)
  const count = collection(FIN_COLLECTIONS.statementImports).length
  const importId = `IMP-${String(count + 1).padStart(3, "0")}`
  const currency = String(treasury.currency)
  const parsed = STATEMENT_IMPORT_TEMPLATE.map(([reference, date, memo, amountEgp, onBooks], index) => {
    const amount = convert(amountEgp, "EGP", currency)
    const duplicate = existing.some((line) => line.reference === reference && line.date === date)
    if (!duplicate) {
      const line = createRow(FIN_COLLECTIONS.statementLines, {
        reference,
        treasury_id: treasury.id,
        date,
        description: memo,
        amount,
        status: onBooks ? "matched" : "unmatched",
        matched_entry_id: null,
        matched_entry_ref: onBooks ? `JE-2026-${String(1100 + index * 3).padStart(6, "0")}` : null,
        auto: onBooks,
        dismissed_entry_ids: [],
        import_id: importId,
      })
      line.id = `${reference}-${String(treasury.code)}`
    }
    return { reference, date, memo, amount, match: duplicate ? "duplicate" : onBooks ? "auto" : "review" }
  })
  const row = createRow(FIN_COLLECTIONS.statementImports, {
    treasury_id: treasury.id,
    treasury_name: treasury.name,
    currency,
    imported_at: FIN_NOW,
    lines: parsed,
    parsed: parsed.length,
    auto_matched: parsed.filter((line) => line.match === "auto").length,
    review: parsed.filter((line) => line.match === "review").length,
    skipped: parsed.filter((line) => line.match === "duplicate").length,
  })
  row.id = importId
  return row
}

/** 04.04–04.06 · Bank reconciliation and statement import. */
export const financeReconciliationRoutes: DemoRoute[] = [
  route("get", "/finance/reconciliation/imports/latest", (req) => {
    const treasuryId = String(req.params.treasury_id ?? "")
    const latest = collection(FIN_COLLECTIONS.statementImports).find((row) => row.treasury_id === treasuryId)
    return { data: latest ?? null }
  }),

  /** Parse the (generated) statement: known lines auto-match, the rest wait for review. */
  route("post", "/finance/reconciliation/imports", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    if (!treasury || treasury.kind !== "bank") return refuse("Choose a bank treasury to import into.")
    return { data: importLines(treasury) }
  }),

  route("get", "/finance/reconciliation/:treasuryId", (req) => {
    const data = workspace(req.vars.treasuryId)
    return data ? { data } : { status: 404, data: null }
  }),

  route("post", "/finance/reconciliation/:treasuryId/match", (req) => {
    const problem = matchPair(req.vars.treasuryId, String(req.body.line_id), String(req.body.entry_id))
    return problem ? refuse(problem) : { data: workspace(req.vars.treasuryId) }
  }),

  route("post", "/finance/reconciliation/:treasuryId/accept-all", (req) => {
    const minimum = Number(req.body.min ?? 85)
    const accepted = suggestionsFor(req.vars.treasuryId).filter((suggestion) => suggestion.score >= minimum)
    for (const suggestion of accepted) matchPair(req.vars.treasuryId, suggestion.line_id, suggestion.entry_id)
    return { data: { accepted: accepted.length } }
  }),

  route("post", "/finance/reconciliation/:treasuryId/dismiss", (req) => {
    const line = findRow(FIN_COLLECTIONS.statementLines, String(req.body.line_id))
    if (!line || line.treasury_id !== req.vars.treasuryId) return refuse("That line is not on this account.")
    line.dismissed_entry_ids = [...((line.dismissed_entry_ids as string[]) ?? []), String(req.body.entry_id)]
    return { data: { dismissed: true } }
  }),

  route("post", "/finance/reconciliation/:treasuryId/unmatch", (req) => {
    const line = findRow(FIN_COLLECTIONS.statementLines, String(req.body.line_id))
    if (!line || line.treasury_id !== req.vars.treasuryId || line.status !== "matched") {
      return refuse("That line is not matched on this account.")
    }
    if (line.auto) return refuse("Lines matched by the bank feed stay matched.")
    const entry = findRow(FIN_COLLECTIONS.bookEntries, String(line.matched_entry_id))
    Object.assign(line, { status: "unmatched", matched_entry_id: null })
    if (entry) Object.assign(entry, { status: "unmatched", matched_line_id: null })
    return { data: { unmatched: true } }
  }),

  /**
   * Create an entry from a statement line the ledger has never seen: the bank
   * side comes from the line, the other side from the chosen account. The
   * posting moves the treasury and is matched to the line straight away.
   */
  route("post", "/finance/reconciliation/:treasuryId/lines/:lineId/entry", (req) => {
    const line = findRow(FIN_COLLECTIONS.statementLines, req.vars.lineId)
    const account = findRow(FIN_COLLECTIONS.accounts, String(req.body.counter_account))
    if (!line || line.treasury_id !== req.vars.treasuryId || line.status !== "unmatched") {
      return refuse("That line is not waiting on this account.")
    }
    if (!account || account.is_group) return refuse("Choose the account for the other side.")
    const movement = postMovement({
      treasury_id: req.vars.treasuryId,
      date: String(line.date),
      description: String(line.description),
      source: String(line.reference),
      source_type: "statement",
      source_id: String(line.id),
      amount: Number(line.amount),
    })
    const entry = createRow(FIN_COLLECTIONS.bookEntries, {
      entry: movement.entry,
      treasury_id: req.vars.treasuryId,
      date: line.date,
      description: line.description,
      amount: line.amount,
      counter_account: account.code,
      status: "matched",
      matched_line_id: line.id,
    })
    entry.id = String(movement.entry)
    Object.assign(line, { status: "matched", matched_entry_id: entry.id })
    return { data: { entry: entry.entry, counter_account: account.code } }
  }),

  /** Finishing seals the matched pairs and stamps the account as reconciled today. */
  route("post", "/finance/reconciliation/:treasuryId/finish", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, req.vars.treasuryId)
    if (!treasury) return { status: 404, data: null }
    const lines = statementLines(req.vars.treasuryId)
    if (lines.some((line) => line.status === "unmatched")) {
      return refuse("Every statement line must be matched or have an entry before the reconciliation can finish.")
    }
    const sealed = lines.filter((line) => line.status === "matched")
    for (const line of sealed) line.status = "reconciled"
    for (const entry of bookEntries(req.vars.treasuryId)) if (entry.status === "matched") entry.status = "reconciled"
    treasury.last_reconciled = FIN_TODAY
    return { data: { reconciled_lines: sealed.length, last_reconciled: FIN_TODAY } }
  }),
]
