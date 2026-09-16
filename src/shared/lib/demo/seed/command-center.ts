import type {
  ActivityFeedItem,
  CommandCenterSummary,
  RecentInvoice,
  RevenueTrendPoint,
} from "@/src/features/command-center/lib/types"

import {
  COMPANY_NAMES,
  DEMO_TODAY,
  emailFor,
  intBetween,
  isoDay,
  makeRandom,
  moneyBetween,
  personName,
  pick,
} from "./faker"

export const COMMAND_CENTER_SUMMARY: CommandCenterSummary = {
  currency_code: "USD",
  cash_balance: 1_284_500,
  runway_status: "monitor",
  strip: {
    runway_days: 412,
    mrr: 186_400,
    burn_rate: 94_200,
    headcount: 128,
    pipeline_value: 2_940_000,
  },
  key_metrics: [
    {
      key: "mrr",
      label: "Monthly Recurring Revenue",
      value: 186_400,
      unit: "currency",
      trend_pct: 12.4,
      trend_direction: "up",
    },
    {
      key: "net_burn",
      label: "Net Burn",
      value: 94_200,
      unit: "currency",
      trend_pct: -6.1,
      trend_direction: "down",
    },
    {
      key: "gross_margin",
      label: "Gross Margin",
      value: 72.5,
      unit: "percentage",
      trend_pct: 2.3,
      trend_direction: "up",
    },
    {
      key: "headcount",
      label: "Headcount",
      value: 128,
      unit: "number",
      trend_pct: 4.9,
      trend_direction: "up",
    },
    {
      key: "pipeline",
      label: "Open Pipeline",
      value: 2_940_000,
      unit: "currency",
      trend_pct: 18.7,
      trend_direction: "up",
    },
    {
      key: "churn",
      label: "Logo Churn",
      value: 1.8,
      unit: "percentage",
      trend_pct: null,
      trend_direction: "flat",
    },
  ],
}

export function buildRevenueTrend(months: number): RevenueTrendPoint[] {
  const rand = makeRandom(4021)
  const points: RevenueTrendPoint[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(DEMO_TODAY)
    d.setUTCMonth(d.getUTCMonth() - i)
    const cashIn = moneyBetween(rand, 150_000, 260_000, 1_000)
    const cashOut = moneyBetween(rand, 90_000, 170_000, 1_000)
    points.push({
      month: d.toISOString().slice(0, 7),
      cash_in: cashIn,
      cash_out: cashOut,
      net: cashIn - cashOut,
      projected: false,
    })
  }
  return points
}

const ACTIVITY_TEMPLATES = [
  { tone: "finance", module: "finance", title: "Invoice {ref} marked paid" },
  { tone: "finance", module: "payroll", title: "September payroll approved" },
  { tone: "sales", module: "sales", title: "Quotation {ref} sent to {company}" },
  { tone: "sales", module: "sales", title: "Deal with {company} moved to Negotiation" },
  { tone: "people", module: "hr", title: "{person} joined the Engineering team" },
  { tone: "people", module: "leave", title: "Annual leave approved for {person}" },
  { tone: "people", module: "recruitment", title: "New candidate shortlisted for Sales Manager" },
  { tone: "system", module: "settings", title: "Role permissions updated" },
  { tone: "system", module: "integrations", title: "Stripe sync completed" },
  { tone: "system", module: "compliance", title: "Policy acknowledgement reminder sent" },
] as const

export function buildActivityFeed(count = 40): ActivityFeedItem[] {
  const rand = makeRandom(7788)
  const items: ActivityFeedItem[] = []
  for (let i = 0; i < count; i += 1) {
    const template = pick(rand, ACTIVITY_TEMPLATES)
    const hoursAgo = i * intBetween(rand, 2, 7)
    const when = new Date(DEMO_TODAY)
    when.setUTCHours(when.getUTCHours() - hoursAgo)
    const title = template.title
      .replace("{ref}", `INV-${2400 + i}`)
      .replace("{company}", pick(rand, COMPANY_NAMES))
      .replace("{person}", personName(rand))

    items.push({
      id: i + 1,
      title,
      actor: personName(rand),
      module: template.module,
      tone: template.tone,
      when: when.toISOString(),
      time_label:
        hoursAgo < 1
          ? "just now"
          : hoursAgo < 24
            ? `${hoursAgo}h ago`
            : `${Math.floor(hoursAgo / 24)}d ago`,
    })
  }
  return items
}

const INVOICE_STATUSES = ["paid", "sent", "partial", "overdue", "draft"] as const

export function buildRecentInvoices(count = 20): RecentInvoice[] {
  const rand = makeRandom(1337)
  const invoices: RecentInvoice[] = []
  for (let i = 0; i < count; i += 1) {
    const total = moneyBetween(rand, 4_000, 68_000, 100)
    const status = pick(rand, INVOICE_STATUSES)
    const paid =
      status === "paid"
        ? total
        : status === "partial"
          ? Math.round(total * 0.45)
          : 0
    const client = pick(rand, COMPANY_NAMES)
    invoices.push({
      id: `inv-${1000 + i}`,
      invoice_number: `INV-${2400 + i}`,
      client_name: client,
      client_email: emailFor(client),
      issue_date: isoDay(-intBetween(rand, 5, 90)),
      due_date: isoDay(intBetween(rand, -20, 40)),
      total_amount: total,
      paid_amount: paid,
      outstanding_amount: total - paid,
      currency_code: "USD",
      status,
      persisted_status: status === "overdue" ? "sent" : status,
    })
  }
  return invoices
}
