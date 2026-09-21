import { collection, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_ANCHORS } from "../../seed/finance/anchors"
import { FIN_CLOSE_CHECK_ROWS } from "../../seed/finance/close"
import {
  FIN_ACTIVITY_ROWS,
  FIN_CASH_WEEK_ROWS,
  buildAttentionItems,
  buildExceptionRows,
} from "../../seed/finance/overview"
import { FIN_COLLECTIONS } from "./collections"
import { listResponse } from "./helpers"

function rateToBase(currency: string): number {
  return Number(findRow(FIN_COLLECTIONS.currencies, currency)?.rate_to_base ?? 1)
}

/** Treasuries with their EGP-equivalent balance, the basis of every cash figure. */
function treasuriesInBase(): Row[] {
  return collection(FIN_COLLECTIONS.treasuries).map((row) => ({
    ...row,
    base_amount: Math.round(Number(row.balance) * rateToBase(String(row.currency)) * 100) / 100,
  }))
}

function sum(rows: Row[], key: string): number {
  return Math.round(rows.reduce((total, row) => total + Number(row[key] ?? 0), 0) * 100) / 100
}

function closeProgress() {
  const tasks = collection(FIN_COLLECTIONS.closeTasks)
    .filter((task) => task.period === "2026-03")
    .sort((a, b) => Number(a.position) - Number(b.position))
  return {
    period_label: "March 2026",
    done: tasks.filter((task) => task.status === "done").length,
    total: tasks.length,
    tasks,
  }
}

/** 01 · Overview — Finance home, Cash position, On the go, and the bills it approves. */
export const financeOverviewRoutes: DemoRoute[] = [
  route("get", "/finance/overview/home", () => {
    const treasuries = treasuriesInBase()
    return {
      data: {
        cash: {
          total: sum(treasuries, "base_amount"),
          currency: "EGP",
          accounts: treasuries.length,
          updated_at: FIN_ANCHORS.cash.updatedAt,
        },
        receivables: {
          outstanding: FIN_ANCHORS.receivables.outstanding,
          overdue: FIN_ANCHORS.receivables.overdue,
        },
        payables: {
          outstanding: FIN_ANCHORS.payables.outstanding,
          due_this_week: FIN_ANCHORS.payables.dueThisWeek,
        },
        net_result: { period_label: "March", amount: FIN_ANCHORS.netResult.amount },
        attention: buildAttentionItems(),
        cash_weeks: FIN_CASH_WEEK_ROWS,
        close: closeProgress(),
        activity: FIN_ACTIVITY_ROWS,
      },
    }
  }),

  route("get", "/finance/overview/cash-position", () => {
    const treasuries = treasuriesInBase()
    const banks = treasuries.filter((row) => row.kind === "bank")
    const tills = treasuries.filter((row) => row.kind === "cash")
    const currencies = Array.from(new Set(treasuries.map((row) => String(row.currency)))).map(
      (code) => {
        const held = treasuries.filter((row) => row.currency === code)
        return { code, amount: sum(held, "balance"), base_amount: sum(held, "base_amount") }
      },
    )
    return {
      data: {
        total: sum(treasuries, "base_amount"),
        base_currency: "EGP",
        banks: { amount: sum(banks, "base_amount"), count: banks.length },
        cash_on_hand: { amount: sum(tills, "base_amount"), count: tills.length },
        currencies,
        unreconciled_lines: sum(treasuries, "unmatched_lines"),
        treasuries,
      },
    }
  }),

  route("get", "/finance/overview/close-readiness", () => ({
    data: { period_label: "March 2026", checks: FIN_CLOSE_CHECK_ROWS },
  })),

  route("get", "/finance/overview/exceptions", () => ({ data: buildExceptionRows() })),

  route("get", "/finance/bills", (req) => listResponse(collection(FIN_COLLECTIONS.bills), req.params)),

  route("post", "/finance/bills/:id/approve", (req) => {
    const bill = findRow(FIN_COLLECTIONS.bills, req.vars.id)
    if (!bill) return { status: 404, data: { message: "Bill not found." } }
    Object.assign(bill, { status: "approved", approvals: Number(bill.approvals ?? 0) + 1 })
    return { data: bill }
  }),

  route("post", "/finance/bills/:id/send-back", (req) => {
    const bill = findRow(FIN_COLLECTIONS.bills, req.vars.id)
    if (!bill) return { status: 404, data: { message: "Bill not found." } }
    Object.assign(bill, { status: "revised", sent_back_reason: req.body.reason ?? null })
    return { data: bill }
  }),
]
