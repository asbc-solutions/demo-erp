export type FinanceCashflowRange = "6m" | "12m" | "ytd" | "all"

export type FinanceCashflowTimelinePoint = {
  month: string
  cash_in: number
  cash_out: number
  net: number
  projected: boolean
}

export type FinanceCashflowRunwayStatus = "critical" | "monitor" | "healthy"

export type FinanceCashflowRunwayMarker = {
  label: string
  position: number
}

/**
 * GET /finance/cashflow/runway — `runway_days: -1` is a special value meaning
 * the company's cashflow is positive (no burn at all), NOT "zero days left".
 * The UI must render that case as "healthy"/∞, never as a literal `-1`.
 */
export type FinanceCashflowRunway = {
  runway_days: number
  burn_rate: number
  cash_balance: number
  currency_code: string
  status: FinanceCashflowRunwayStatus
  progress_pct: number
  markers: FinanceCashflowRunwayMarker[]
}
