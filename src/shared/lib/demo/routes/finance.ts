import { applyFilters, collection, defineCollection, paginate, updateRow } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  EXPENSE_CATEGORIES,
  FINANCE_EXPENSE_ROWS,
  FINANCE_INVOICE_ROWS,
  FINANCE_RUNWAY,
  buildCashflowTimeline,
  buildFinanceReportCards,
  buildFinanceReportRows,
} from "../seed/modules"

defineCollection("finance/expenses", () => [...FINANCE_EXPENSE_ROWS])
defineCollection("finance/invoices", () => [...FINANCE_INVOICE_ROWS])

const MONTHS_BY_RANGE: Record<string, number> = {
  "6m": 6,
  "12m": 12,
  ytd: new Date().getUTCMonth() + 1,
  all: 24,
}

function inRange(row: Record<string, unknown>, field: string, params: Record<string, unknown>) {
  const value = String(row[field] ?? "")
  if (params.from && value < String(params.from)) return false
  if (params.to && value > String(params.to)) return false
  return true
}

export const financeRoutes: DemoRoute[] = [
  /* ----------------------------- Cashflow ------------------------------- */

  route("get", "/finance/cashflow/timeline", (req) => ({
    data: buildCashflowTimeline(MONTHS_BY_RANGE[String(req.params.range ?? "12m")] ?? 12),
  })),

  route("get", "/finance/cashflow/runway", () => ({ data: FINANCE_RUNWAY })),

  /* ----------------------------- Expenses ------------------------------- */

  route("get", "/finance/expenses/categories", () => ({ data: EXPENSE_CATEGORIES })),

  route("get", "/finance/expenses/summary", () => {
    const rows = collection("finance/expenses")
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0)
    const recurring = rows.filter((r) => r.recurring)
    const byCategory = new Map<string, number>()
    for (const row of rows) {
      const key = String(row.category_label)
      byCategory.set(key, (byCategory.get(key) ?? 0) + Number(row.amount))
    }
    const [largestLabel, largestAmount] = [...byCategory.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0] ?? ["—", 0]

    return {
      data: {
        total_spent: total,
        spent_this_month: Math.round(total / 11),
        monthly_average: Math.round(total / 11),
        recurring_count: recurring.length,
        recurring_amount: recurring.reduce((sum, r) => sum + Number(r.amount), 0),
        largest_category: largestLabel,
        largest_category_amount: largestAmount,
      },
    }
  }),

  route("get", "/finance/expenses/breakdown", () => {
    const rows = collection("finance/expenses")
    return {
      data: EXPENSE_CATEGORIES.map((category) => {
        const matching = rows.filter((r) => r.category_id === category.id)
        return {
          category_id: String(category.id),
          category_label: String(category.label),
          category_color: String(category.color),
          amount: matching.reduce((sum, r) => sum + Number(r.amount), 0),
          expense_count: matching.length,
        }
      }).sort((a, b) => b.amount - a.amount),
    }
  }),

  route("get", "/finance/expenses", (req) => {
    let rows = applyFilters(collection("finance/expenses"), {
      category_id: req.params.category_id,
      recurring: req.params.recurring,
      search: req.params.search,
    })
    rows = rows.filter((row) => inRange(row, "date", req.params))
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  /* ----------------------------- Invoices ------------------------------- */

  // The list meta carries a revenue summary the invoices tab renders above the table.
  route("get", "/finance/invoices", (req) => {
    const all = collection("finance/invoices")
    const status = String(req.params.status ?? "All").toLowerCase()
    let rows = status === "all" ? all : all.filter((r) => String(r.status) === status)
    rows = applyFilters(rows, { search: req.params.search })
    rows = rows.filter((row) => inRange(row, "issue_date", req.params))

    const { rows: page, meta } = paginate(rows, req.params)
    return {
      data: page,
      meta: {
        ...meta,
        summary: {
          total_revenue: all.reduce((sum, r) => sum + Number(r.paid_amount), 0),
          pending_amount: all
            .filter((r) => r.status === "sent")
            .reduce((sum, r) => sum + Number(r.outstanding_amount), 0),
          overdue_amount: all
            .filter((r) => r.status === "overdue")
            .reduce((sum, r) => sum + Number(r.outstanding_amount), 0),
          draft_count: all.filter((r) => r.status === "draft").length,
        },
      },
    }
  }),

  route("post", "/finance/invoices/:id/mark-paid", (req) => {
    const row = updateRow("finance/invoices", req.vars.id, {
      status: "paid",
      persisted_status: "paid",
    })
    if (row) {
      row.paid_amount = Number(row.total_amount)
      row.outstanding_amount = 0
    }
    return { data: row ?? null }
  }),

  route("post", "/finance/invoices/:id/send", (req) => ({
    data: updateRow("finance/invoices", req.vars.id, {
      status: "sent",
      persisted_status: "sent",
    }) ?? null,
  })),

  route("post", "/finance/invoices/:id/cancel", (req) => ({
    data: updateRow("finance/invoices", req.vars.id, {
      status: "cancelled",
      persisted_status: "cancelled",
    }) ?? null,
  })),

  /* ------------------------------ Reports -------------------------------- */

  route("get", "/finance/reports", () => ({ data: buildFinanceReportCards() })),

  route("get", "/finance/reports/:id", (req) => ({
    data: buildFinanceReportRows(req.vars.id),
  })),

  route("post", "/finance/reports/:id/export", () => ({
    data: { download_url: "#" },
  })),
]
