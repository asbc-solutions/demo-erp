import {
  applyFilters,
  collection,
  defineCollection,
  findRow,
  nextId,
  paginate,
  updateRow,
  type Row,
} from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  EXPENSE_CATEGORIES,
  FINANCE_EXPENSE_ROWS,
  FINANCE_INVOICE_ROWS,
  FINANCE_INVOICE_STATUS_LABEL,
  FINANCE_RUNWAY,
  buildCashflowTimeline,
  buildFinanceReportCards,
  buildFinanceReportRows,
} from "../seed/modules"

defineCollection("finance/expenses", () => [...FINANCE_EXPENSE_ROWS])
defineCollection("finance/invoices", () => [...FINANCE_INVOICE_ROWS])

/** How the API reports expenses with no `category_id` (see FinanceExpenseBreakdownEntry). */
const UNCATEGORIZED = { label: "Uncategorized", color: "#a1a1aa" }

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Totals are computed server-side from `line_items` — the client never sends
 * them (SaveFinanceInvoicePayload) — so the demo has to price the invoice itself.
 */
function priceInvoice(body: Record<string, unknown>) {
  const taxRate = Number(body.tax_rate ?? 0) || 0
  const inputs = Array.isArray(body.line_items) ? (body.line_items as Record<string, unknown>[]) : []
  const lineItems = inputs.map((line, index) => {
    const quantity = Number(line.quantity) || 0
    const unitPrice = Number(line.unit_price) || 0
    return {
      id: nextId("fli-"),
      description: String(line.description ?? ""),
      quantity,
      unit_price: unitPrice,
      line_total: round2(quantity * unitPrice),
      sort_order: index + 1,
    }
  })
  const subtotal = round2(lineItems.reduce((sum, line) => sum + line.line_total, 0))
  const tax = round2((subtotal * taxRate) / 100)
  return {
    tax_rate: taxRate,
    line_items: lineItems,
    subtotal_amount: subtotal,
    tax_amount: tax,
    total_amount: round2(subtotal + tax),
  }
}

function nextInvoiceNumber(rows: Row[]): string {
  const highest = rows.reduce(
    (max, row) => Math.max(max, Number(String(row.invoice_number).replace(/\D/g, "")) || 0),
    0,
  )
  return `INV-${highest + 1}`
}

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0]).filter((key) => key !== "id")
  const cell = (value: unknown) => {
    const text = String(value ?? "")
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers.join(","), ...rows.map((row) => headers.map((h) => cell(row[h])).join(","))].join(
    "\n",
  )
}

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

  // Counts are live so the filter chips stay in step with the list after an add.
  route("get", "/finance/expenses/categories", () => {
    const rows = collection("finance/expenses")
    return {
      data: EXPENSE_CATEGORIES.map((category) => ({
        ...category,
        expense_count: rows.filter((r) => r.category_id === category.id).length,
      })),
    }
  }),

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
    const buckets = [
      ...EXPENSE_CATEGORIES.map((category) => ({
        category_id: String(category.id) as string | null,
        label: String(category.label),
        color: String(category.color),
      })),
      { category_id: null, ...UNCATEGORIZED },
    ]
    return {
      data: buckets
        .map((bucket) => {
          const matching = rows.filter((r) => (r.category_id ?? null) === bucket.category_id)
          return {
            ...bucket,
            amount: matching.reduce((sum, r) => sum + Number(r.amount), 0),
            expense_count: matching.length,
          }
        })
        .filter((entry) => entry.expense_count > 0)
        .sort((a, b) => b.amount - a.amount),
    }
  }),

  route("post", "/finance/expenses", (req) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.id === req.body.category_id)
    const now = new Date().toISOString()
    const row: Row = {
      id: nextId("exp-"),
      description: String(req.body.description ?? ""),
      vendor: req.body.vendor ? String(req.body.vendor) : null,
      category_id: category ? String(category.id) : null,
      category_label: category ? String(category.label) : UNCATEGORIZED.label,
      category_color: category ? String(category.color) : UNCATEGORIZED.color,
      amount: Number(req.body.amount) || 0,
      currency_code: "USD",
      date: String(req.body.date ?? now.slice(0, 10)),
      recurring: Boolean(req.body.recurring),
      created_at: now,
      updated_at: now,
    }
    collection("finance/expenses").unshift(row)
    return { data: row }
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

  route("post", "/finance/invoices", (req) => {
    const rows = collection("finance/invoices")
    const status = req.body.status === "sent" ? "sent" : "draft"
    const priced = priceInvoice(req.body)
    const now = new Date().toISOString()
    const row: Row = {
      id: nextId("finv-"),
      invoice_number: nextInvoiceNumber(rows),
      client_name: String(req.body.client_name ?? ""),
      client_email: req.body.client_email ? String(req.body.client_email) : null,
      issue_date: String(req.body.issue_date ?? now.slice(0, 10)),
      due_date: String(req.body.due_date ?? now.slice(0, 10)),
      notes: req.body.notes ? String(req.body.notes) : null,
      ...priced,
      paid_amount: 0,
      outstanding_amount: priced.total_amount,
      currency_code: "USD",
      status,
      persisted_status: status,
      status_label: FINANCE_INVOICE_STATUS_LABEL[status],
      sent_at: status === "sent" ? now : null,
      paid_at: null,
      created_at: now,
      updated_at: now,
    }
    rows.unshift(row)
    return { data: row }
  }),

  // Omitting `amount` settles in full (MarkFinanceInvoicePaidPayload); a partial
  // payment only moves the balance and leaves the invoice open.
  route("post", "/finance/invoices/:id/mark-paid", (req) => {
    const row = findRow("finance/invoices", req.vars.id)
    if (!row) return { data: null }
    const outstanding = Number(row.outstanding_amount)
    const amount =
      req.body.amount === undefined
        ? outstanding
        : Math.min(Math.max(Number(req.body.amount) || 0, 0), outstanding)
    const paid = round2(Number(row.paid_amount) + amount)
    const remaining = round2(Math.max(Number(row.total_amount) - paid, 0))
    Object.assign(row, {
      paid_amount: paid,
      outstanding_amount: remaining,
      updated_at: new Date().toISOString(),
      ...(remaining === 0
        ? {
            status: "paid",
            persisted_status: "paid",
            status_label: FINANCE_INVOICE_STATUS_LABEL.paid,
            paid_at: String(req.body.paid_at ?? new Date().toISOString().slice(0, 10)),
          }
        : {}),
    })
    return { data: row }
  }),

  route("post", "/finance/invoices/:id/send", (req) => ({
    data: updateRow("finance/invoices", req.vars.id, {
      status: "sent",
      persisted_status: "sent",
      status_label: FINANCE_INVOICE_STATUS_LABEL.sent,
      sent_at: new Date().toISOString(),
    }) ?? null,
  })),

  route("post", "/finance/invoices/:id/cancel", (req) => ({
    data: updateRow("finance/invoices", req.vars.id, {
      status: "cancelled",
      persisted_status: "cancelled",
      status_label: FINANCE_INVOICE_STATUS_LABEL.cancelled,
    }) ?? null,
  })),

  /* ------------------------------ Reports -------------------------------- */

  route("get", "/finance/reports", () => ({ data: buildFinanceReportCards() })),

  route("get", "/finance/reports/:id", (req) => ({
    data: buildFinanceReportRows(req.vars.id),
  })),

  // The real API returns a signed URL; the demo mints an object URL over the same
  // rows so "Export CSV" downloads a file instead of reopening the app in a new tab.
  route("post", "/finance/reports/:id/export", (req) => {
    const csv = toCsv(buildFinanceReportRows(req.vars.id))
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    return { data: { download_url: URL.createObjectURL(blob) } }
  }),
]
