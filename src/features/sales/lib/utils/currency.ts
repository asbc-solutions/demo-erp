const formatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Formats a numeric sales amount (e.g. `grand_total`) as `"EGP 57,057"`.
 *
 * Renders an em dash rather than `"EGP NaN"` when the amount is missing — several
 * sales types were modelled from prose and can name fields the API never sends.
 */
export function formatCurrency(amount: number): string {
  return Number.isFinite(amount) ? formatter.format(amount) : "—"
}
