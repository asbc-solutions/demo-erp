import type { Row } from "../demo-db"
import {
  COMPANY_NAMES,
  emailFor,
  intBetween,
  isoDateTime,
  isoDay,
  makeRandom,
  moneyBetween,
  personName,
  pick,
} from "./faker"

const PRODUCT_DEFS = [
  { name: "Nucleus Core License", type: "product", price: 4_800 },
  { name: "Nucleus Payroll Add-on", type: "product", price: 1_450 },
  { name: "Implementation Package", type: "service", price: 12_000 },
  { name: "Data Migration", type: "service", price: 6_500 },
  { name: "Admin Training (per seat)", type: "service", price: 350 },
  { name: "Premium Support (annual)", type: "service", price: 9_200 },
  { name: "Barcode Scanner", type: "product", price: 220 },
  { name: "Receipt Printer", type: "product", price: 480 },
  { name: "Tablet Terminal", type: "product", price: 1_100 },
  { name: "API Gateway Seat", type: "product", price: 780 },
  { name: "Custom Report Build", type: "service", price: 2_400 },
  { name: "Warehouse Sensor Kit", type: "product", price: 3_150 },
] as const

export const SALESPERSON_ROWS: Row[] = Array.from({ length: 8 }, (_, i) => {
  const name = personName(makeRandom(80_000 + i))
  return {
    id: `sp-${i + 1}`,
    name,
    email: emailFor(name),
    user_id: i + 1,
    is_active: i < 7,
  }
})

export const PRODUCT_ROWS: Row[] = PRODUCT_DEFS.map((def, i) => {
  const rand = makeRandom(82_000 + i)
  const tracked = def.type === "product"
  const onHand = tracked ? intBetween(rand, 0, 220) : 0
  const threshold = tracked ? 25 : 0
  const status = !tracked
    ? "in_stock"
    : onHand === 0
      ? "out_of_stock"
      : onHand <= threshold
        ? "low_stock"
        : "in_stock"
  return {
    id: `prd-${i + 1}`,
    sku: `SKU-${String(1_000 + i)}`,
    name: def.name,
    type: def.type,
    type_label: def.type === "product" ? "Product" : "Service",
    default_unit_price: def.price,
    default_tax_rate: 14,
    track_stock: tracked,
    stock_on_hand: onHand,
    low_stock_threshold: threshold,
    stock_status: status,
    stock_status_label:
      status === "in_stock"
        ? "In stock"
        : status === "low_stock"
          ? "Low stock"
          : "Out of stock",
    is_active: true,
  }
})

const CUSTOMER_STATUSES = ["active", "active", "active", "active", "inactive", "blocked"] as const

export const CUSTOMER_ROWS: Row[] = Array.from({ length: 46 }, (_, i) => {
  const rand = makeRandom(84_000 + i)
  const isCompany = i % 4 !== 3
  const name = isCompany
    ? `${COMPANY_NAMES[i % COMPANY_NAMES.length]}${i >= COMPANY_NAMES.length ? ` ${Math.floor(i / COMPANY_NAMES.length) + 1}` : ""}`
    : personName(rand)
  const status = i < 4 ? "active" : pick(rand, CUSTOMER_STATUSES)
  const salesperson = SALESPERSON_ROWS[i % SALESPERSON_ROWS.length]
  return {
    id: `cus-${i + 1}`,
    name,
    customer_type: isCompany ? "company" : "individual",
    customer_type_label: isCompany ? "Company" : "Individual",
    phone: `+20 12 ${30_000_000 + i * 4_517}`,
    email: emailFor(name),
    assigned_salesperson_id: salesperson.id,
    assigned_salesperson_name: salesperson.name,
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    tax_number: isCompany ? `TN-${500_000 + i}` : null,
    source: pick(rand, ["referral", "website", "event", "outbound"] as const),
    addresses: [
      {
        id: `addr-${i + 1}`,
        address_type: "billing",
        line: `${12 + i} Tahrir Street`,
        city: "Cairo",
        governorate: "Cairo",
        country_code: "EG",
        is_default: true,
      },
    ],
  }
})

function buildLines(seed: number, count: number) {
  const rand = makeRandom(seed)
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0
  const lines = Array.from({ length: count }, (_, i) => {
    const product = PRODUCT_ROWS[intBetween(rand, 0, PRODUCT_ROWS.length - 1)]
    const quantity = intBetween(rand, 1, 12)
    const unitPrice = Number(product.default_unit_price)
    const discountPercent = pick(rand, [0, 0, 5, 10, 15] as const)
    const taxPercent = 14
    const gross = quantity * unitPrice
    const discount = (gross * discountPercent) / 100
    const net = gross - discount
    const tax = (net * taxPercent) / 100
    subtotal += gross
    discountTotal += discount
    taxTotal += tax
    return {
      id: `line-${seed}-${i + 1}`,
      line_no: i + 1,
      product_id: String(product.id),
      description: String(product.name),
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      tax_percent: taxPercent,
      line_total: Math.round(net + tax),
    }
  })
  return {
    lines,
    subtotal: Math.round(subtotal),
    discount_total: Math.round(discountTotal),
    tax_total: Math.round(taxTotal),
    grand_total: Math.round(subtotal - discountTotal + taxTotal),
  }
}

const QUOTATION_STATUSES = [
  "draft", "sent", "sent", "accepted", "rejected", "expired", "converted",
] as const

export const QUOTATION_ROWS: Row[] = Array.from({ length: 38 }, (_, i) => {
  const rand = makeRandom(86_000 + i)
  const customer = CUSTOMER_ROWS[i % CUSTOMER_ROWS.length]
  const salesperson = SALESPERSON_ROWS[i % SALESPERSON_ROWS.length]
  const status = QUOTATION_STATUSES[i % QUOTATION_STATUSES.length]
  const totals = buildLines(86_500 + i, intBetween(rand, 1, 5))
  const quotationDate = isoDay(-intBetween(rand, 1, 120))
  const validityDays = 30
  const daysLeft = status === "expired" ? 0 : intBetween(rand, 0, validityDays)
  return {
    id: `qt-${i + 1}`,
    number: `QT-2026-${String(i + 1).padStart(4, "0")}`,
    customer_id: customer.id,
    customer_name: customer.name,
    salesperson_id: salesperson.id,
    salesperson_name: salesperson.name,
    quotation_date: quotationDate,
    validity_date: isoDay(-intBetween(rand, 1, 120) + validityDays),
    validity_days: validityDays,
    days_left: daysLeft,
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    terms_and_conditions: "Payment due within 30 days of invoice date.",
    ...totals,
    converted_order_id: status === "converted" ? `ord-${i + 1}` : null,
    discount_approval_id: null,
    discount_approved: false,
    discount_approved_by: null,
    discount_approved_at: null,
    actions_available:
      status === "draft" ? ["send", "edit", "delete"] : status === "sent" ? ["accept", "reject"] : [],
  }
})

const ORDER_STATUSES = [
  "draft", "pending_confirmation", "confirmed", "confirmed", "invoiced", "closed", "cancelled",
] as const

export const ORDER_ROWS: Row[] = Array.from({ length: 34 }, (_, i) => {
  const rand = makeRandom(88_000 + i)
  const customer = CUSTOMER_ROWS[(i + 3) % CUSTOMER_ROWS.length]
  const salesperson = SALESPERSON_ROWS[i % SALESPERSON_ROWS.length]
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]
  const totals = buildLines(88_500 + i, intBetween(rand, 1, 4))
  return {
    id: `ord-${i + 1}`,
    number: `SO-2026-${String(i + 1).padStart(4, "0")}`,
    customer_id: customer.id,
    customer_name: customer.name,
    salesperson_id: salesperson.id,
    salesperson_name: salesperson.name,
    status,
    status_label: status.replace(/_/g, " "),
    order_date: isoDay(-intBetween(rand, 1, 90)),
    delivery_date: isoDay(intBetween(rand, -10, 45)),
    quotation_id: `qt-${i + 1}`,
    ...totals,
    revisions: [],
    actions_available: status === "confirmed" ? ["generate-invoice", "cancel"] : [],
  }
})

const INVOICE_STATUSES = ["draft", "posted", "sent", "sent", "closed", "cancelled"] as const

export const SALES_INVOICE_ROWS: Row[] = Array.from({ length: 30 }, (_, i) => {
  const rand = makeRandom(90_000 + i)
  const order = ORDER_ROWS[i % ORDER_ROWS.length]
  const status = INVOICE_STATUSES[i % INVOICE_STATUSES.length]
  const totals = buildLines(90_500 + i, intBetween(rand, 1, 4))
  const paid =
    status === "closed"
      ? totals.grand_total
      : status === "sent"
        ? Math.round(totals.grand_total * 0.4)
        : 0
  const paymentStatus =
    paid === 0 ? "unpaid" : paid >= totals.grand_total ? "paid" : "partial"
  return {
    id: `sinv-${i + 1}`,
    number: status === "draft" ? null : `INV-2026-${String(i + 1).padStart(4, "0")}`,
    order_id: order.id,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    invoice_date: isoDay(-intBetween(rand, 1, 80)),
    due_date: isoDay(intBetween(rand, -20, 40)),
    ...totals,
    total_due: totals.grand_total,
    amount_paid: paid,
    payment_status: paymentStatus,
    payment_status_label:
      paymentStatus === "unpaid" ? "Unpaid" : paymentStatus === "paid" ? "Paid" : "Partial",
    actions_available: status === "draft" ? ["post"] : ["mark-sent", "cancel"],
  }
})

export const SALES_PAYMENT_ROWS: Row[] = SALES_INVOICE_ROWS.filter(
  (inv) => Number(inv.amount_paid) > 0,
).map((inv, i) => ({
  id: `pay-${i + 1}`,
  invoice_id: inv.id,
  amount: Number(inv.amount_paid),
  payment_method_id: "pm-1",
  payment_method_name: "Bank transfer",
  reference: `TRF-${70_000 + i}`,
  paid_at: isoDateTime(-i * 36 - 12),
  note: null,
  is_voided: false,
  voided_at: null,
  void_reason: null,
  created_at: isoDateTime(-i * 36 - 12),
}))

export const TERMS_TEMPLATE_ROWS: Row[] = [
  {
    id: "tt-1",
    name: "Standard Terms",
    body_ar: null,
    body_en: "Payment due within 30 days of invoice date.",
    applies_to: "all",
    applies_to_label: "All documents",
    is_default: true,
    is_active: true,
  },
  {
    id: "tt-2",
    name: "Enterprise Terms",
    body_ar: null,
    body_en: "Net 60. Annual commitment with quarterly true-up.",
    applies_to: "quotation",
    applies_to_label: "Quotation",
    is_default: false,
    is_active: true,
  },
]

export const SALES_MASTER_DATA = {
  cancellation_reasons: [
    { id: "cr-1", code: "customer_request", name_ar: "طلب العميل", name_en: "Customer request", requires_note: false },
    { id: "cr-2", code: "out_of_stock", name_ar: "نفاد المخزون", name_en: "Out of stock", requires_note: true },
    { id: "cr-3", code: "pricing", name_ar: "خلاف على السعر", name_en: "Pricing dispute", requires_note: true },
  ],
  rejection_reasons: [
    { id: "rr-1", code: "budget", name_ar: "الميزانية", name_en: "Budget constraints", requires_note: false },
    { id: "rr-2", code: "competitor", name_ar: "منافس", name_en: "Chose a competitor", requires_note: true },
    { id: "rr-3", code: "timing", name_ar: "التوقيت", name_en: "Bad timing", requires_note: false },
  ],
  edit_reasons: [
    { id: "er-1", code: "quantity", name_ar: "تعديل الكمية", name_en: "Quantity change", requires_note: false },
    { id: "er-2", code: "price", name_ar: "تعديل السعر", name_en: "Price correction", requires_note: true },
  ],
  payment_methods: [
    { id: "pm-1", code: "bank_transfer", name_ar: "تحويل بنكي", name_en: "Bank transfer", requires_reference: true },
    { id: "pm-2", code: "cash", name_ar: "نقدي", name_en: "Cash", requires_reference: false },
    { id: "pm-3", code: "card", name_ar: "بطاقة", name_en: "Card", requires_reference: true },
    { id: "pm-4", code: "cheque", name_ar: "شيك", name_en: "Cheque", requires_reference: true },
  ],
}

export const SALES_SETTINGS = {
  id: "ss-1",
  branch_id: null,
  quotation_number_format: "QT-{YYYY}-{####}",
  order_number_format: "SO-{YYYY}-{####}",
  invoice_number_format: "INV-{YYYY}-{####}",
  default_tax_rate: 14,
  tax_mode: "exclusive" as const,
  tax_mode_label: "Exclusive",
  default_validity_days: 30,
  auto_expire_quotations: true,
  company_name: "Nucleus Demo Co.",
  company_tax_number: "TN-100200300",
  has_company_logo: false,
}

export const SALES_COMPANY_PROFILE = {
  company_name: "Nucleus Demo Co.",
  company_tax_number: "TN-100200300",
  has_logo: false,
}

export function buildSalesDashboard() {
  const paid = SALES_INVOICE_ROWS.reduce((sum, i) => sum + Number(i.amount_paid), 0)
  const billed = SALES_INVOICE_ROWS.reduce((sum, i) => sum + Number(i.total_due), 0)
  const openPipeline = QUOTATION_ROWS.filter(
    (q) => q.status === "draft" || q.status === "sent",
  ).reduce((sum, q) => sum + Number(q.grand_total), 0)

  const byCustomer = new Map<string, { name: string; total: number }>()
  for (const invoice of SALES_INVOICE_ROWS) {
    const entry = byCustomer.get(String(invoice.customer_id)) ?? {
      name: String(invoice.customer_name),
      total: 0,
    }
    entry.total += Number(invoice.total_due)
    byCustomer.set(String(invoice.customer_id), entry)
  }

  return {
    kpis: [
      { key: "total_billed", value: billed, delta_pct: 12.4 },
      { key: "total_collected", value: paid, delta_pct: 8.1 },
      { key: "open_pipeline", value: openPipeline, delta_pct: 18.9 },
      { key: "active_customers", value: CUSTOMER_ROWS.filter((c) => c.status === "active").length, delta_pct: 4.2 },
      { key: "quotations_sent", value: QUOTATION_ROWS.filter((q) => q.status === "sent").length, delta_pct: null },
      { key: "orders_confirmed", value: ORDER_ROWS.filter((o) => o.status === "confirmed").length, delta_pct: 6.7 },
    ],
    pipeline_funnel: {
      stages: (["draft", "sent", "accepted", "converted"] as const).map((status, i, all) => {
        const count = QUOTATION_ROWS.filter((q) => q.status === status).length
        const previous =
          i === 0
            ? null
            : QUOTATION_ROWS.filter((q) => q.status === all[i - 1]).length
        return {
          status,
          count,
          advance_pct: previous ? Math.round((count / previous) * 1000) / 10 : null,
        }
      }),
    },
    recent_activity: [
      ...QUOTATION_ROWS.slice(0, 4).map((q) => ({
        type: "quotation",
        ref_id: String(q.id),
        ref_number: String(q.number),
        occurred_at: isoDateTime(-6),
      })),
      ...ORDER_ROWS.slice(0, 3).map((o) => ({
        type: "order",
        ref_id: String(o.id),
        ref_number: String(o.number),
        occurred_at: isoDateTime(-18),
      })),
      ...SALES_INVOICE_ROWS.slice(0, 3).map((inv) => ({
        type: "invoice",
        ref_id: String(inv.id),
        ref_number: String(inv.number ?? "Draft"),
        occurred_at: isoDateTime(-30),
      })),
    ],
    top_customers: [...byCustomer.entries()]
      .map(([customer_id, entry]) => ({
        customer_id,
        customer_name: entry.name,
        total_amount: entry.total,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5),
    top_products: PRODUCT_ROWS.slice(0, 5).map((product, i) => ({
      product_id: String(product.id),
      product_name: String(product.name),
      total_amount: moneyBetween(makeRandom(95_000 + i), 40_000, 220_000, 500),
    })),
  }
}
