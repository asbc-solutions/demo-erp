import {
  applyFilters,
  collection,
  defineCollection,
  findRow,
  paginate,
  updateRow,
  type Row,
} from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  CUSTOMER_ROWS,
  ORDER_ROWS,
  PRODUCT_ROWS,
  QUOTATION_ROWS,
  SALESPERSON_ROWS,
  SALES_COMPANY_PROFILE,
  SALES_INVOICE_ROWS,
  SALES_MASTER_DATA,
  SALES_PAYMENT_ROWS,
  SALES_SETTINGS,
  TERMS_TEMPLATE_ROWS,
  buildSalesDashboard,
} from "../seed/sales"
import { isoDay } from "../seed/faker"

defineCollection("sales/customers", () => [...CUSTOMER_ROWS])
defineCollection("sales/products", () => [...PRODUCT_ROWS])
defineCollection("sales/quotations", () => [...QUOTATION_ROWS])
defineCollection("sales/orders", () => [...ORDER_ROWS])
defineCollection("sales/invoices", () => [...SALES_INVOICE_ROWS])
defineCollection("sales/salespeople", () => [...SALESPERSON_ROWS])
defineCollection("sales/payments", () => [...SALES_PAYMENT_ROWS])
defineCollection("sales/terms-templates", () => [...TERMS_TEMPLATE_ROWS])

/**
 * Sales list endpoints return `TabbedListMeta` — pagination plus a count per
 * status tab, computed over the *unfiltered* set so the tab bar stays stable
 * while a tab is selected.
 */
function tabbedList(
  collectionName: string,
  statuses: readonly string[],
  params: Record<string, unknown>,
) {
  const all = collection(collectionName)
  const tabs: Record<string, number> = { all: all.length }
  for (const status of statuses) {
    tabs[status] = all.filter((row) => row.status === status).length
  }

  const tab = String(params.tab ?? "all")
  let rows = tab === "all" ? all : all.filter((row) => row.status === tab)

  const query = params.q ?? params.search
  if (query && String(query).trim()) {
    const term = String(query).trim().toLowerCase()
    rows = rows.filter((row) =>
      Object.values(row).some(
        (value) =>
          (typeof value === "string" || typeof value === "number") &&
          String(value).toLowerCase().includes(term),
      ),
    )
  }

  rows = applyFilters(rows, {
    customer_id: params.customer_id,
    salesperson_id: params.salesperson_id,
    order_id: params.order_id,
    type: params.type,
    is_active: params.is_active,
  })

  const { rows: page, meta } = paginate(rows, params)
  return { data: page, meta: { ...meta, tabs } }
}

/** Status transition shared by every `/:id/<action>` sales endpoint. */
function transition(
  collectionName: string,
  id: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  const row = updateRow(collectionName, id, {
    status,
    status_label: status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    ...extra,
  })
  return { data: row ?? null }
}

/**
 * Price a single quotation line, mirroring `buildLines()` in `seed/sales.ts`.
 *
 * A line added from the product picker arrives with only a `product_id` (the
 * form leaves Unit Price blank, showing "From product"), so the unit price and
 * description are backfilled from the catalogue here — otherwise the line has
 * no price at all.
 */
function priceQuotationLine(line: Row & Record<string, unknown>): Row {
  const product = line.product_id
    ? findRow("sales/products", String(line.product_id))
    : undefined

  const quantity = Number(line.quantity ?? 1)
  const unitPrice = Number(
    line.unit_price ?? product?.default_unit_price ?? 0,
  )
  const discountPercent = Number(line.discount_percent ?? 0)
  const taxPercent = Number(line.tax_percent ?? 14)

  const gross = quantity * unitPrice
  const discount = (gross * discountPercent) / 100
  const net = gross - discount
  const tax = (net * taxPercent) / 100

  return {
    ...line,
    description: String(line.description ?? product?.name ?? ""),
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    tax_percent: taxPercent,
    line_total: Math.round(net + tax),
  }
}

/**
 * Recompute a quotation's rolled-up totals from its lines. Every line mutation
 * must call this: leaving the totals untouched left every quotation built
 * through the UI permanently at a grand total of 0.
 */
function retotalQuotation(quotation: Row): Row {
  const lines = (quotation.lines as Row[]) ?? []
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0

  for (const line of lines) {
    const gross = Number(line.quantity ?? 0) * Number(line.unit_price ?? 0)
    const discount = (gross * Number(line.discount_percent ?? 0)) / 100
    const net = gross - discount
    subtotal += gross
    discountTotal += discount
    taxTotal += (net * Number(line.tax_percent ?? 0)) / 100
  }

  quotation.subtotal = Math.round(subtotal)
  quotation.discount_total = Math.round(discountTotal)
  quotation.tax_total = Math.round(taxTotal)
  quotation.grand_total = Math.round(subtotal - discountTotal + taxTotal)
  return quotation
}

const EXPORT_RESULT = { async: false, job_id: "job-sales-1", download_url: "#" }

export const salesRoutes: DemoRoute[] = [
  /* ------------------------------ Lists -------------------------------- */

  route("get", "/sales/customers", (req) =>
    tabbedList("sales/customers", ["active", "inactive", "blocked"], req.params),
  ),

  /**
   * The generic `:id` fallback hands back the stored row verbatim, and a customer
   * created through `POST /sales/customers` only holds what the create form sent —
   * none of the denormalized labels the seed rows carry. Derive them here so a
   * customer opened straight after being created reads like a seeded one instead
   * of showing blank type/status/salesperson fields.
   */
  route("get", "/sales/customers/:id", (req) => {
    const row = findRow("sales/customers", req.vars.id)
    if (!row) return { data: null }

    const status = String(row.status ?? "active")
    const customerType = String(row.customer_type ?? "company")
    const salesperson = findRow(
      "sales/salespeople",
      String(row.assigned_salesperson_id ?? ""),
    )

    return {
      data: {
        ...row,
        status,
        status_label: row.status_label ?? status.charAt(0).toUpperCase() + status.slice(1),
        customer_type: customerType,
        customer_type_label:
          row.customer_type_label ?? (customerType === "company" ? "Company" : "Individual"),
        assigned_salesperson_name: row.assigned_salesperson_name ?? salesperson?.name ?? "",
        tax_number: row.tax_number ?? null,
        source: row.source ?? null,
        addresses: row.addresses ?? [],
      },
    }
  }),

  route("get", "/sales/quotations", (req) =>
    tabbedList(
      "sales/quotations",
      ["draft", "sent", "accepted", "rejected", "expired", "converted"],
      req.params,
    ),
  ),

  route("get", "/sales/orders", (req) =>
    tabbedList(
      "sales/orders",
      ["draft", "pending_confirmation", "confirmed", "invoiced", "closed", "cancelled"],
      req.params,
    ),
  ),

  route("get", "/sales/invoices", (req) =>
    tabbedList(
      "sales/invoices",
      ["draft", "posted", "sent", "closed", "cancelled"],
      req.params,
    ),
  ),

  route("get", "/sales/products", (req) => {
    const filtered = applyFilters(collection("sales/products"), req.params)
    const { rows, meta } = paginate(filtered, req.params)
    return { data: rows, meta }
  }),

  route("get", "/sales/products/search", (req) => {
    const term = String(req.params.q ?? "").toLowerCase()
    return {
      data: collection("sales/products")
        .filter(
          (p) =>
            String(p.name).toLowerCase().includes(term) ||
            String(p.sku).toLowerCase().includes(term),
        )
        .slice(0, 20),
    }
  }),

  route("get", "/sales/salespeople/active", () => ({
    data: collection("sales/salespeople").filter((s) => s.is_active),
  })),

  route("get", "/sales/salespeople", (req) => {
    const filtered = applyFilters(collection("sales/salespeople"), req.params)
    const { rows, meta } = paginate(filtered, req.params)
    return { data: rows, meta }
  }),

  route("get", "/sales/terms-templates", () => ({
    data: collection("sales/terms-templates"),
  })),

  /* ---------------------------- Quotations ------------------------------ */

  // The generic POST would store only the payload ids; the list and detail
  // views need the denormalised names, totals and actions a real row carries.
  route("post", "/sales/quotations", (req) => {
    const rows = collection("sales/quotations")
    const customer = findRow("sales/customers", String(req.body.customer_id ?? ""))
    const salesperson = findRow("sales/salespeople", String(req.body.salesperson_id ?? ""))
    const validityDays = Number(req.body.validity_days ?? 30)
    const quotationDate = String(req.body.quotation_date ?? isoDay(0))
    const row: Row = {
      id: `qt-${Date.now()}`,
      number: `QT-2026-${String(rows.length + 1).padStart(4, "0")}`,
      customer_id: String(req.body.customer_id ?? ""),
      customer_name: String(customer?.name ?? ""),
      salesperson_id: String(req.body.salesperson_id ?? ""),
      salesperson_name: String(salesperson?.name ?? ""),
      quotation_date: quotationDate,
      validity_date: isoDay(validityDays),
      validity_days: validityDays,
      days_left: null,
      status: "draft",
      status_label: "Draft",
      terms_and_conditions: req.body.terms_and_conditions ?? null,
      lines: [],
      subtotal: 0,
      discount_total: 0,
      tax_total: 0,
      grand_total: 0,
      converted_order_id: null,
      discount_approval_id: null,
      discount_approved: false,
      discount_approved_by: null,
      discount_approved_at: null,
      actions_available: ["edit", "delete", "send", "duplicate"],
    }
    rows.unshift(row)
    return { data: row }
  }),

  route("post", "/sales/quotations/:id/send", (req) =>
    transition("sales/quotations", req.vars.id, "sent"),
  ),
  route("post", "/sales/quotations/:id/accept", (req) =>
    transition("sales/quotations", req.vars.id, "accepted"),
  ),
  route("post", "/sales/quotations/:id/reject", (req) =>
    transition("sales/quotations", req.vars.id, "rejected"),
  ),
  route("post", "/sales/quotations/:id/convert", (req) => {
    transition("sales/quotations", req.vars.id, "converted", {
      converted_order_id: `ord-${req.vars.id}`,
    })
    const quotation = findRow("sales/quotations", req.vars.id)
    return {
      data: {
        ...(quotation ?? {}),
        id: `ord-${req.vars.id}`,
        number: `SO-2026-${String(req.vars.id).replace(/\D/g, "").padStart(4, "0")}`,
        status: "draft",
        status_label: "Draft",
      },
    }
  }),
  route("post", "/sales/quotations/:id/duplicate", (req) => {
    const source = findRow("sales/quotations", req.vars.id)
    if (!source) return { data: null }
    const copy: Row = {
      ...source,
      id: `qt-copy-${Date.now()}`,
      number: `${source.number}-COPY`,
      status: "draft",
      status_label: "Draft",
    }
    collection("sales/quotations").unshift(copy)
    return { data: copy }
  }),

  route("post", "/sales/quotations/:id/lines", (req) => {
    const quotation = findRow("sales/quotations", req.vars.id)
    if (!quotation) return { data: null }
    const lines = (quotation.lines as Row[]) ?? []
    lines.push(
      priceQuotationLine({
        id: `line-${Date.now()}`,
        line_no: lines.length + 1,
        ...req.body,
      }),
    )
    quotation.lines = lines
    return { data: retotalQuotation(quotation) }
  }),

  route("put", "/sales/quotations/:qid/lines/:lid", (req) => {
    const quotation = findRow("sales/quotations", req.vars.qid)
    if (!quotation) return { data: null }
    const lines = (quotation.lines as Row[]) ?? []
    const index = lines.findIndex((l) => String(l.id) === req.vars.lid)
    if (index !== -1) {
      lines[index] = priceQuotationLine({
        ...lines[index],
        ...req.body,
        id: lines[index].id,
      })
    }
    return { data: retotalQuotation(quotation) }
  }),

  route("delete", "/sales/quotations/:qid/lines/:lid", (req) => {
    const quotation = findRow("sales/quotations", req.vars.qid)
    if (!quotation) return { data: null }
    quotation.lines = ((quotation.lines as Row[]) ?? [])
      .filter((l) => String(l.id) !== req.vars.lid)
      .map((line, i) => ({ ...line, line_no: i + 1 }))
    return { data: retotalQuotation(quotation) }
  }),

  route("post", "/sales/quotations/:qid/lines/:lid/discount-approvals", (req) => ({
    data: {
      id: `da-${Date.now()}`,
      quotation_id: req.vars.qid,
      quotation_line_id: req.vars.lid,
      status: "pending",
      justification: String(req.body.justification ?? ""),
      approver_role_code: "sales_manager",
      note: null,
      created_at: isoDay(0),
    },
  })),

  route("post", "/sales/discount-approvals/:id/decide", (req) => ({
    data: {
      id: req.vars.id,
      status: req.body.decision === "approve" ? "approved" : "rejected",
      note: req.body.note ?? null,
    },
  })),

  /* ------------------------------ Orders -------------------------------- */

  route("post", "/sales/orders/:id/confirm", (req) =>
    transition("sales/orders", req.vars.id, "confirmed"),
  ),
  route("post", "/sales/orders/:id/cancel", (req) =>
    transition("sales/orders", req.vars.id, "cancelled"),
  ),
  route("post", "/sales/orders/:id/request-edit", (req) => {
    const order = findRow("sales/orders", req.vars.id)
    if (order) {
      const revisions = (order.revisions as Row[]) ?? []
      revisions.push({
        id: `rev-${Date.now()}`,
        edit_reason_id: String(req.body.edit_reason_id ?? "er-1"),
        edit_reason_label: "Quantity change",
        note: (req.body.note as string) ?? null,
        created_at: isoDay(0),
      })
      order.revisions = revisions
    }
    return { data: order ?? null }
  }),
  route("put", "/sales/orders/:id/lines", (req) => {
    const order = findRow("sales/orders", req.vars.id)
    if (order && Array.isArray(req.body.lines)) order.lines = req.body.lines as Row[]
    return { data: order ?? null }
  }),
  route("post", "/sales/orders/:id/generate-invoice", (req) => {
    const order = findRow("sales/orders", req.vars.id)
    transition("sales/orders", req.vars.id, "invoiced")
    const invoice: Row = {
      id: `sinv-new-${Date.now()}`,
      number: null,
      order_id: req.vars.id,
      customer_id: order?.customer_id ?? null,
      customer_name: order?.customer_name ?? "",
      status: "draft",
      status_label: "Draft",
      invoice_date: isoDay(0),
      due_date: isoDay(30),
      lines: (order?.lines as Row[]) ?? [],
      subtotal: Number(order?.subtotal ?? 0),
      tax_total: Number(order?.tax_total ?? 0),
      discount_total: Number(order?.discount_total ?? 0),
      grand_total: Number(order?.grand_total ?? 0),
      total_due: Number(order?.grand_total ?? 0),
      amount_paid: 0,
      payment_status: "unpaid",
      payment_status_label: "Unpaid",
      actions_available: ["post"],
    }
    collection("sales/invoices").unshift(invoice)
    return { data: invoice }
  }),

  /* ----------------------------- Invoices ------------------------------- */

  route("post", "/sales/invoices/:id/post", (req) => {
    const numeric = String(req.vars.id).replace(/\D/g, "").padStart(4, "0")
    return transition("sales/invoices", req.vars.id, "posted", {
      number: `INV-2026-${numeric}`,
    })
  }),
  route("post", "/sales/invoices/:id/mark-sent", (req) =>
    transition("sales/invoices", req.vars.id, "sent"),
  ),
  route("post", "/sales/invoices/:id/close", (req) =>
    transition("sales/invoices", req.vars.id, "closed"),
  ),
  route("post", "/sales/invoices/:id/cancel", (req) =>
    transition("sales/invoices", req.vars.id, "cancelled"),
  ),

  route("get", "/sales/invoices/:id/payments", (req) => ({
    data: collection("sales/payments").filter((p) => p.invoice_id === req.vars.id),
  })),

  route("post", "/sales/invoices/:id/payments", (req) => {
    const amount = Number(req.body.amount ?? 0)
    const payment: Row = {
      id: `pay-${Date.now()}`,
      invoice_id: req.vars.id,
      amount,
      payment_method_id: String(req.body.payment_method_id ?? "pm-1"),
      payment_method_name: "Bank transfer",
      reference: (req.body.reference as string) ?? null,
      paid_at: String(req.body.paid_at ?? isoDay(0)),
      note: (req.body.note as string) ?? null,
      is_voided: false,
      voided_at: null,
      void_reason: null,
      created_at: isoDay(0),
    }
    collection("sales/payments").unshift(payment)

    const invoice = findRow("sales/invoices", req.vars.id)
    if (invoice) {
      const paid = Number(invoice.amount_paid ?? 0) + amount
      const due = Number(invoice.total_due ?? 0)
      invoice.amount_paid = paid
      invoice.payment_status = paid >= due ? "paid" : paid > 0 ? "partial" : "unpaid"
      invoice.payment_status_label =
        paid >= due ? "Paid" : paid > 0 ? "Partial" : "Unpaid"
    }
    return { data: payment }
  }),

  route("post", "/sales/payments/:id/void", (req) => {
    const payment = findRow("sales/payments", req.vars.id)
    if (payment) {
      payment.is_voided = true
      payment.voided_at = isoDay(0)
      payment.void_reason = (req.body.void_reason as string) ?? null
    }
    return { data: payment ?? null }
  }),

  /* -------------------------- Files & exports --------------------------- */

  route("get", "/sales/quotations/:id/pdf", () => ({ data: { url: "#" } })),
  route("get", "/sales/orders/:id/pdf", () => ({ data: { url: "#" } })),
  route("get", "/sales/invoices/:id/pdf", () => ({ data: { url: "#" } })),
  route("get", "/sales/invoices/:id/print-url", () => ({ data: { url: "#" } })),

  route("post", "/sales/customers/export", () => ({ data: EXPORT_RESULT })),
  route("post", "/sales/quotations/export", () => ({ data: EXPORT_RESULT })),
  route("post", "/sales/orders/export", () => ({ data: EXPORT_RESULT })),
  route("post", "/sales/invoices/export", () => ({ data: EXPORT_RESULT })),
  route("post", "/sales/reports/:id/export", () => ({ data: EXPORT_RESULT })),
  route("get", "/sales/exports/:id/status", (req) => ({
    data: {
      job_id: req.vars.id,
      entity: "customers",
      status: "completed",
      download_url: "#",
    },
  })),

  /* ---------------------------- Settings -------------------------------- */

  route("get", "/sales/master-data", () => ({ data: SALES_MASTER_DATA })),

  route("get", "/sales/settings", () => ({ data: { ...SALES_SETTINGS } })),
  route("put", "/sales/settings", (req) => ({
    data: Object.assign(SALES_SETTINGS, req.body),
  })),
  route("get", "/sales/settings/numbering-preview", () => ({
    data: {
      quotation: "QT-2026-0039",
      order: "SO-2026-0035",
      invoice: "INV-2026-0031",
    },
  })),

  route("get", "/sales/company-profile", () => ({ data: { ...SALES_COMPANY_PROFILE } })),
  route("put", "/sales/company-profile", (req) => ({
    data: Object.assign(SALES_COMPANY_PROFILE, req.body),
  })),
  route("post", "/sales/company-profile/logo", () => ({ data: { has_logo: true } })),
  route("get", "/sales/company-profile/logo-url", () => ({ data: { url: null } })),

  /* ----------------------------- Reports -------------------------------- */

  route("get", "/sales/dashboard", () => ({ data: buildSalesDashboard() })),

  route("get", "/sales/reports/total-sales", () => {
    const invoices = collection("sales/invoices")
    const byDate = new Map<string, number>()
    for (const invoice of invoices) {
      const date = String(invoice.invoice_date)
      byDate.set(date, (byDate.get(date) ?? 0) + Number(invoice.total_due))
    }
    return {
      data: {
        series: [...byDate.entries()]
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        total_amount: invoices.reduce((sum, i) => sum + Number(i.total_due), 0),
        invoice_count: invoices.length,
      },
    }
  }),

  route("get", "/sales/reports/sales-by-customer", () => {
    const totals = new Map<string, { name: string; count: number; amount: number }>()
    for (const invoice of collection("sales/invoices")) {
      const key = String(invoice.customer_id)
      const entry = totals.get(key) ?? {
        name: String(invoice.customer_name),
        count: 0,
        amount: 0,
      }
      entry.count += 1
      entry.amount += Number(invoice.total_due)
      totals.set(key, entry)
    }
    return {
      data: [...totals.entries()]
        .map(([customer_id, entry]) => ({
          customer_id,
          customer_name: entry.name,
          invoice_count: entry.count,
          total_amount: entry.amount,
        }))
        .sort((a, b) => b.total_amount - a.total_amount),
    }
  }),

  route("get", "/sales/reports/sales-by-salesperson", () => {
    const totals = new Map<string, { name: string; count: number; amount: number }>()
    for (const order of collection("sales/orders")) {
      const key = String(order.salesperson_id)
      const entry = totals.get(key) ?? {
        name: String(order.salesperson_name),
        count: 0,
        amount: 0,
      }
      entry.count += 1
      entry.amount += Number(order.grand_total)
      totals.set(key, entry)
    }
    return {
      data: [...totals.entries()]
        .map(([salesperson_id, entry]) => ({
          salesperson_id,
          salesperson_name: entry.name,
          invoice_count: entry.count,
          total_amount: entry.amount,
        }))
        .sort((a, b) => b.total_amount - a.total_amount),
    }
  }),

  /* --------------------------- Stock actions ---------------------------- */

  route("post", "/sales/products/:id/adjust-stock", (req) => {
    const product = findRow("sales/products", req.vars.id)
    if (!product) return { data: null }
    const onHand = Number(product.stock_on_hand ?? 0) + Number(req.body.delta ?? 0)
    const threshold = Number(product.low_stock_threshold ?? 0)
    const status =
      onHand <= 0 ? "out_of_stock" : onHand <= threshold ? "low_stock" : "in_stock"
    product.stock_on_hand = Math.max(0, onHand)
    product.stock_status = status
    product.stock_status_label =
      status === "in_stock" ? "In stock" : status === "low_stock" ? "Low stock" : "Out of stock"
    return {
      data: {
        id: product.id,
        stock_on_hand: product.stock_on_hand,
        stock_status: status,
      },
    }
  }),

  route("post", "/sales/customers/:id/block", (req) =>
    transition("sales/customers", req.vars.id, "blocked"),
  ),
  route("post", "/sales/customers/:id/unblock", (req) =>
    transition("sales/customers", req.vars.id, "active"),
  ),
  route("post", "/sales/customers/:id/deactivate", (req) =>
    transition("sales/customers", req.vars.id, "inactive"),
  ),
]
