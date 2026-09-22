import { collection, findRow, type Row } from "../../demo-db"
import { FIN_ANCHORS } from "../../seed/finance/anchors"
import { FIN_CLOSING_PERIOD, FIN_TODAY } from "../../seed/finance/calendar"
import { unmatchedLines, unreconciledTreasuries } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"
import { accountBalances, storedJournals } from "./ledger-model"
import { pendingBills } from "./payables"
import { draftReturn, eInvoiceState, presentReturn, vatControls } from "./tax-model"

/**
 * The March close: checklist tasks whose blockers are read live from the
 * sections that own them, and the readiness checks that must all pass
 * before the period can close.
 */

const r2 = (value: number) => Math.round(value * 100) / 100
const money = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Periods a journal may post into. */
const POSTABLE = new Set(["open", "closing", "adjusting"])

export function periodProblem(date: string): string | null {
  const period = findRow(FIN_COLLECTIONS.periods, date.slice(0, 7))
  if (!period) return `There is no financial period for ${date}.`
  if (POSTABLE.has(String(period.status))) return null
  return `${String(period.label)} is ${String(period.status)}. Posting is only allowed into open periods.`
}

function fxRevaluedThisPeriod(): boolean {
  const settings = findRow(FIN_COLLECTIONS.ledgerSettings, "settings")
  return ((settings?.revaluations as Row[]) ?? []).some((row) => String(row.date).startsWith(FIN_CLOSING_PERIOD))
}

/** Items still in the way for each blocker source. Tax and assets read anchors until those sections post. */
const BLOCKERS: Record<string, () => number> = {
  unallocated_receipts: () => collection(FIN_COLLECTIONS.receipts).filter((row) => row.allocation === "unallocated").length,
  pending_bills: () => pendingBills().length,
  depreciation: () => 1,
  rejected_einvoices: () => eInvoiceState().rejected,
  fx_revaluation: () => 0,
}

function blockerCount(source: string | null): number {
  if (!source) return 0
  if (source.startsWith("unmatched:")) return unmatchedLines(source.slice("unmatched:".length)).length
  return BLOCKERS[source]?.() ?? 0
}

/** Tasks as the workspace shows them: live blockers, and a status that follows them. */
export function closeTasks(period = FIN_CLOSING_PERIOD): Row[] {
  return collection(FIN_COLLECTIONS.closeTasks)
    .filter((task) => task.period === period)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((task) => {
      const blocking = blockerCount(task.blocker as string | null)
      const autoDone = task.blocker === "fx_revaluation" && fxRevaluedThisPeriod()
      const status = autoDone ? "done" : blocking > 0 ? "blocked" : String(task.status)
      return {
        ...task,
        description: String(task.description).replace("{n}", String(blocking)),
        blocking,
        status,
        // A task blocked by live items is cleared at its source, not signed off here.
        can_sign_off: blocking === 0 && !autoDone,
      }
    })
}

export type ReadinessCheck = { id: string; title: string; detail: string; count: number; pass: boolean; href: string }

export function readinessChecks(period = FIN_CLOSING_PERIOD): ReadinessCheck[] {
  const balances = accountBalances()
  const imbalance = r2([...balances.values()].reduce((sum, row) => sum + row.closing, 0))
  const drafts = storedJournals().filter((row) => row.status === "draft" && row.period === period).length
  const unreconciled = unreconciledTreasuries().length
  const suspense = balances.get(FIN_ANCHORS.ledger.suspenseAccount)?.closing ?? 0
  const afterEnd = storedJournals().filter((row) => row.status === "posted" && String(row.date) > FIN_TODAY && row.period === period).length
  const einvoices = eInvoiceState()
  // A draft return is read from the VAT controls, so it can only drift once filed figures differ.
  const draft = draftReturn()
  const controls = vatControls()
  const vatGap = draft ? r2(controls.output - controls.input - Number(presentReturn(draft).net)) : 0
  return [
    { id: "check-trial-balance", title: "Trial balance is in balance", detail: `Difference ${money(Math.abs(imbalance) < 0.005 ? 0 : imbalance)}`, count: 0, pass: Math.abs(imbalance) < 0.005, href: "/finance/reports/trial-balance" },
    { id: "check-drafts", title: "No draft entries in the period", detail: `${drafts} drafts`, count: drafts, pass: drafts === 0, href: "/finance/journals" },
    { id: "check-reconciled", title: "All bank accounts reconciled", detail: `${unreconciled} ${unreconciled === 1 ? "account" : "accounts"} with unmatched lines`, count: unreconciled, pass: unreconciled === 0, href: "/finance/reconciliation" },
    { id: "check-depreciation", title: "Depreciation posted for the period", detail: "Period run is still a draft", count: 1, pass: false, href: "/finance/assets/depreciation" },
    { id: "check-suspense", title: "Suspense account at zero", detail: `Balance ${money(Math.abs(suspense))}`, count: Math.abs(suspense) < 0.005 ? 0 : 1, pass: Math.abs(suspense) < 0.005, href: `/finance/ledger?account=${FIN_ANCHORS.ledger.suspenseAccount}` },
    { id: "check-vat", title: "VAT control matches the return", detail: `Difference ${money(Math.abs(vatGap))}`, count: Math.abs(vatGap) < 0.005 ? 0 : 1, pass: Math.abs(vatGap) < 0.005, href: "/finance/tax/vat-return" },
    { id: "check-future", title: "No entries dated after period end", detail: `${afterEnd} entries`, count: afterEnd, pass: afterEnd === 0, href: "/finance/journals" },
    {
      id: "check-einvoices",
      title: "All electronic documents processed",
      detail: `${einvoices.rejected} rejected, ${einvoices.not_sent} not sent, seal expires in ${einvoices.seal_days} days`,
      count: einvoices.rejected + einvoices.not_sent,
      pass: einvoices.rejected + einvoices.not_sent === 0,
      href: "/finance/tax/e-invoicing",
    },
  ]
}

export function closeSummary(period = FIN_CLOSING_PERIOD) {
  const tasks = closeTasks(period)
  const checks = readinessChecks(period)
  const done = tasks.filter((task) => task.status === "done").length
  const blocked = tasks.filter((task) => Number(task.blocking) > 0)
  const passing = checks.filter((check) => check.pass).length
  const total = tasks.length + checks.length
  return {
    tasks_done: done,
    tasks_total: tasks.length,
    incomplete: tasks.length - done,
    blocking_total: blocked.reduce((sum, task) => sum + Number(task.blocking), 0),
    blocking_tasks: blocked.length,
    unreconciled_accounts: unreconciledTreasuries().length,
    checks_passing: passing,
    checks_total: checks.length,
    readiness_pct: total ? Math.round(((done + passing) / total) * 100) : 100,
    can_close: done === tasks.length && passing === checks.length,
  }
}
