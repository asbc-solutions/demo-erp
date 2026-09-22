import { collection, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_ANCHORS } from "../../seed/finance/anchors"
import {
  FIN_ACTIVITY_ROWS,
  FIN_CASH_WEEK_ROWS,
  buildAttentionItems,
  buildExceptionRows,
} from "../../seed/finance/overview"
import { depreciationOutstanding } from "./assets-model"
import { presentTreasuries, unmatchedTotal, unreconciledTreasuries } from "./banking-model"
import { closeSummary, closeTasks, readinessChecks } from "./close-model"
import { FIN_COLLECTIONS } from "./collections"
import { eInvoiceState } from "./tax-model"
import { periodResult, storedJournals } from "./ledger-model"
import { dueWithin, totals } from "./subledger-model"

/** Treasuries with their EGP-equivalent balance, the basis of every cash figure. */
function treasuriesInBase(): Row[] {
  return presentTreasuries().map((row) => ({ ...row, base_amount: row.base_balance }))
}

function sum(rows: Row[], key: string): number {
  return Math.round(rows.reduce((total, row) => total + Number(row[key] ?? 0), 0) * 100) / 100
}

function worstUnmatched() {
  const worst = unreconciledTreasuries()[0]
  return worst ? { treasuryId: worst.id, name: worst.name, count: worst.count } : null
}

/** On the go · close status: the readiness checks still failing. */
function closeChecks(): Row[] {
  return readinessChecks()
    .filter((check) => !check.pass)
    .map(({ id, title, detail, href }) => ({ id, title, detail, href }))
}

function closeProgress() {
  const summary = closeSummary()
  return {
    period_label: "March 2026",
    done: summary.tasks_done,
    total: summary.tasks_total,
    tasks: closeTasks(),
  }
}

/** 01 · Overview — Finance home, Cash position and On the go. */
export const financeOverviewRoutes: DemoRoute[] = [
  route("get", "/finance/overview/home", () => {
    const treasuries = treasuriesInBase()
    const receivables = totals("receivable")
    const payables = totals("payable")
    const unallocatedReceipts = collection(FIN_COLLECTIONS.receipts).filter(
      (receipt) => receipt.allocation === "unallocated",
    ).length
    return {
      data: {
        cash: {
          total: sum(treasuries, "base_amount"),
          currency: "EGP",
          accounts: treasuries.length,
          updated_at: FIN_ANCHORS.cash.updatedAt,
        },
        receivables: {
          outstanding: receivables.total_base,
          overdue: receivables.overdue_base,
        },
        payables: {
          outstanding: payables.total_base,
          due_this_week: dueWithin("payable", 7),
        },
        net_result: { period_label: "March", amount: periodResult(FIN_ANCHORS.netResult.period) },
        attention: buildAttentionItems({
          unallocatedReceipts,
          unmatched: worstUnmatched(),
          pendingJournals: storedJournals().filter((row) => row.status === "pending").length,
          rejectedEInvoices: eInvoiceState().rejected,
          sealDays: eInvoiceState().seal_days,
          depreciationRuns: depreciationOutstanding(),
        }),
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
    data: { period_label: "March 2026", checks: closeChecks() },
  })),

  route("get", "/finance/overview/exceptions", () => ({
    data: buildExceptionRows({
      overdueInvoices: totals("receivable").overdue_count,
      unmatchedLines: unmatchedTotal(),
      rejectedEInvoices: eInvoiceState().rejected,
      sealDays: eInvoiceState().seal_days,
    }),
  })),
]
