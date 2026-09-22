import { collection, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_CLOSING_PERIOD, FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import { closeSummary, closeTasks, readinessChecks } from "./close-model"
import { FIN_COLLECTIONS } from "./collections"
import { journalTotals, storedJournals } from "./ledger-model"

const refuse = (message: string) => ({ status: 422, data: { message } })
const r2 = (value: number) => Math.round(value * 100) / 100

const OPEN = new Set(["open", "closing", "adjusting"])
const periods = () => collection(FIN_COLLECTIONS.periods)

function yearEndState() {
  const steps = collection(FIN_COLLECTIONS.yearEndSteps).sort((a, b) => Number(a.position) - Number(b.position))
  const fy = periods().filter((row) => row.fiscal_year === "FY2025")
  const allClosed = fy.every((row) => row.status === "closed" || row.status === "locked")
  const presented = steps.map((step) => (step.id === "periods" ? { ...step, done: allClosed } : step))
  return {
    fiscal_year: "FY2025",
    steps: presented,
    done: presented.filter((step) => step.done).length,
    total: presented.length,
    locked: Boolean(presented.find((step) => step.id === "lock")?.done),
    can_lock: presented.filter((step) => step.id !== "lock").every((step) => step.done),
  }
}

/** 06 · Period close — close workspace, financial periods, year end and adjustments. */
export const financeCloseRoutes: DemoRoute[] = [
  route("get", "/finance/close", (req) => {
    const periodId = String(req.params.period ?? FIN_CLOSING_PERIOD)
    const period = findRow(FIN_COLLECTIONS.periods, periodId)
    const tasks = closeTasks(periodId)
    const groups = Array.from(new Set(tasks.map((task) => String(task.group)))).map((name) => {
      const members = tasks.filter((task) => task.group === name)
      return { name, done: members.filter((task) => task.status === "done").length, total: members.length, tasks: members }
    })
    return { data: { period, summary: closeSummary(periodId), groups, checks: readinessChecks(periodId) } }
  }),

  route("post", "/finance/close/tasks/:id/status", (req) => {
    const task = findRow(FIN_COLLECTIONS.closeTasks, req.vars.id)
    const status = String(req.body.status)
    if (!task) return { status: 404, data: null }
    if (!["not_started", "in_progress", "done"].includes(status)) return refuse("Choose a status for the task.")
    const presented = closeTasks(String(task.period)).find((row) => row.id === task.id)
    if (status === "done" && presented && !presented.can_sign_off) {
      return refuse(`${String(task.title)} still has ${String(presented.blocking)} blocking items. Clear them where they live first.`)
    }
    Object.assign(task, { status, signed_off_by: status === "done" ? FIN_ACTOR : null, signed_off_at: status === "done" ? FIN_NOW : null })
    return { data: closeTasks(String(task.period)).find((row) => row.id === task.id) }
  }),

  route("get", "/finance/close/periods", () => {
    const items = periods()
    const count = (status: string) => items.filter((row) => row.status === status).length
    return {
      data: {
        items,
        counts: {
          open: count("open") + count("closing"),
          closed: count("closed"),
          locked: count("locked"),
          adjusting: count("adjusting"),
        },
      },
    }
  }),

  /** Close in order; the period under close also needs every task and check done. */
  route("post", "/finance/close/periods/:id/close", (req) => {
    const period = findRow(FIN_COLLECTIONS.periods, req.vars.id)
    if (!period) return { status: 404, data: null }
    if (!OPEN.has(String(period.status))) return refuse(`${String(period.label)} is not open.`)
    const earlier = periods().find((row) => String(row.id) < String(period.id) && OPEN.has(String(row.status)))
    if (earlier) return refuse(`Close ${String(earlier.label)} first. Periods close in order.`)
    if (period.id === FIN_CLOSING_PERIOD && !closeSummary(FIN_CLOSING_PERIOD).can_close) {
      return refuse("This period can't close yet. Finish the checklist and clear every failing check in the close workspace.")
    }
    Object.assign(period, {
      status: "closed",
      closed_by: FIN_ACTOR,
      closed_on: FIN_TODAY,
      log: [...((period.log as Row[]) ?? []), { action: "closed", by: FIN_ACTOR, at: FIN_NOW }],
    })
    return { data: period }
  }),

  /** Reopening opens an adjusting window in a signed-off period, with the reason on record. */
  route("post", "/finance/close/periods/:id/reopen", (req) => {
    const period = findRow(FIN_COLLECTIONS.periods, req.vars.id)
    const reason = String(req.body.reason ?? "").trim()
    if (!period) return { status: 404, data: null }
    if (period.status === "locked") return refuse(`${String(period.label)} is locked by year-end and cannot be reopened.`)
    if (period.status !== "closed") return refuse(`${String(period.label)} is not closed.`)
    if (!reason) return refuse("Give the reason for reopening. It is logged with your name.")
    Object.assign(period, {
      status: "adjusting",
      log: [...((period.log as Row[]) ?? []), { action: "reopened", by: FIN_ACTOR, at: FIN_NOW, reason }],
    })
    return { data: period }
  }),

  route("get", "/finance/close/year-end", () => ({ data: yearEndState() })),

  route("post", "/finance/close/year-end/steps/:id", (req) => {
    const step = findRow(FIN_COLLECTIONS.yearEndSteps, req.vars.id)
    if (!step || !["adjustments", "income_statement"].includes(String(step.id))) return refuse("That step completes on its own.")
    Object.assign(step, { done: true, done_by: FIN_ACTOR, done_at: FIN_NOW })
    return { data: yearEndState() }
  }),

  /** One-way: every FY2025 period is sealed. */
  route("post", "/finance/close/year-end/lock", () => {
    const state = yearEndState()
    if (state.locked) return refuse("FY2025 is already locked.")
    if (!state.can_lock) return refuse("Complete every closing step before locking the year.")
    for (const period of periods().filter((row) => row.fiscal_year === "FY2025")) period.status = "locked"
    const step = findRow(FIN_COLLECTIONS.yearEndSteps, "lock")
    if (step) Object.assign(step, { done: true, done_by: FIN_ACTOR, done_at: FIN_NOW })
    return { data: yearEndState() }
  }),

  route("get", "/finance/close/adjustments", () => {
    const items = storedJournals()
      .filter((row) => row.source_type === "manual" || row.source_type === "reversal")
      .map((row) => ({
        number: row.number,
        date: row.date,
        description: row.description,
        status: storedJournals().some((other) => other.reversal_of === row.number) ? "reversed" : row.status,
        amount: journalTotals(row).debit_base,
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)))
    return {
      data: {
        items,
        count: items.length,
        total_base: r2(items.reduce((sum, row) => sum + Number(row.amount), 0)),
        period: findRow(FIN_COLLECTIONS.periods, FIN_CLOSING_PERIOD),
      },
    }
  }),
]
