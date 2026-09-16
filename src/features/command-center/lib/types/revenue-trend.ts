// Wire types for GET /command-center/revenue-trend — see bruno/CommandCenter/Dashboard/Revenue Trend.bru
//
// Historical only — every point currently returns `projected: false`.
// Months with no activity still appear, zeroed out (no gaps in the axis).

export type RevenueTrendRange = "6m" | "12m" | "ytd" | "all"

export type RevenueTrendPoint = {
  /** "YYYY-MM" */
  month: string
  cash_in: number
  cash_out: number
  net: number
  projected: boolean
}
