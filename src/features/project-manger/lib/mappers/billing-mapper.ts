import type { BillingMilestone, RevenueSummary } from "../types"
import { formatMoney, humanizeLabel } from "./cost-budget-mapper"
import { formatApiDate } from "./project-mapper"

/* ------------------------------------------------------------------ */
/* Summary stat cards                                                  */
/* ------------------------------------------------------------------ */

export type BillingStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "check" | "receipt" | "flag" | "dso"
  accent: "indigo" | "emerald" | "amber" | "violet"
}

export function buildBillingStats(
  revenue: RevenueSummary | undefined,
): BillingStat[] {
  return [
    {
      id: "contract",
      label: "Contract Value",
      value: formatMoney(revenue?.contract_value),
      caption: revenue ? `${Math.round(revenue.percent_complete)}% complete` : "",
      icon: "receipt",
      accent: "indigo",
    },
    {
      id: "recognized",
      label: "Recognized Revenue",
      value: formatMoney(revenue?.recognized_revenue),
      caption: revenue ? `${formatMoney(revenue.deferred_revenue)} deferred` : "",
      icon: "check",
      accent: "emerald",
    },
    {
      id: "invoiced",
      label: "Total Invoiced",
      value: formatMoney(revenue?.total_invoiced),
      caption: "issued to date",
      icon: "dso",
      accent: "amber",
    },
    {
      id: "gap",
      label: "Revenue Gap",
      value: formatMoney(revenue?.revenue_gap),
      caption: humanizeLabel(revenue?.revenue_gap_label),
      icon: "flag",
      accent: "violet",
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Milestone rows                                                      */
/* ------------------------------------------------------------------ */

export type BillingMilestoneRow = {
  id: string
  code: string
  name: string
  due: string
  /** Raw `due_date` (ISO) for callers that format the date themselves. */
  dueDate: string | null
  amount: string
  pctOfTotal: string
  statusLabel: string
}

/** Milestone row mapper bound to an `Intl` locale (`useIntlLocale()`), usable in `.map()`. */
export function billingMilestoneMapper(locale?: string) {
  return (m: BillingMilestone) => toBillingMilestoneRow(m, locale)
}

export function mapBillingMilestone(m: BillingMilestone): BillingMilestoneRow {
  return toBillingMilestoneRow(m)
}

function toBillingMilestoneRow(
  m: BillingMilestone,
  locale?: string,
): BillingMilestoneRow {
  return {
    id: m.billing_milestone_id,
    code: m.code,
    name: m.name,
    due: formatApiDate(m.due_date, locale),
    dueDate: m.due_date ?? null,
    amount: formatMoney(Number(m.amount)),
    pctOfTotal: `${Math.round(Number(m.pct_of_total))}%`,
    statusLabel: m.status_label,
  }
}
