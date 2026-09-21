const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const RATE_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

/** Half a piastre; anything smaller renders as zero rather than "(0.00)". */
const EPSILON = 0.005

/**
 * Ledger number rendering: two decimals, thousands separators and negatives in
 * parentheses, so `-1250` reads `(1,250.00)` and a rounding residue reads `0.00`.
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < EPSILON) return AMOUNT_FORMAT.format(0)
  const abs = AMOUNT_FORMAT.format(Math.abs(value))
  return value < 0 ? `(${abs})` : abs
}

export function formatMoney(value: number, currency: string): string {
  return `${formatAmount(value)} ${currency}`
}

export function formatRate(rate: number): string {
  return RATE_FORMAT.format(rate)
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

/** Round to whole piastres; sums of seeded figures stay exact this way. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}
