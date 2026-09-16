// Wire types for GET /command-center/summary — see bruno/CommandCenter/Dashboard/Command Center Summary.bru

/**
 * Only `"up"`, `"down"` and `"flat"` are confirmed by the docs examples/prose;
 * treated as the closed set since the endpoint is described as a 3-state trend.
 */
export type TrendDirection = "up" | "down" | "flat"

/**
 * Only `"currency"` is shown in the example payload. Other units aren't
 * enumerated — render unmapped units generically rather than assuming a
 * fixed set (mirrors the sales dashboard `DashboardKpi` precedent).
 */
export type KeyMetricUnit = "currency" | "number" | "percentage" | (string & {})

export type CommandCenterKeyMetric = {
  key: string
  label: string
  value: number
  unit: KeyMetricUnit
  /** `null` means "no prior period to compare" — render as "—", never as 0. */
  trend_pct: number | null
  trend_direction: TrendDirection
}

export type CommandCenterStrip = {
  runway_days: number
  mrr: number
  burn_rate: number
  headcount: number
  pipeline_value: number
}

/** Only `"monitor"` is shown in the example payload; kept open-ended. */
export type RunwayStatus = "monitor" | (string & {})

export type CommandCenterSummary = {
  currency_code: string
  strip: CommandCenterStrip
  key_metrics: CommandCenterKeyMetric[]
  cash_balance: number
  runway_status: RunwayStatus
}
