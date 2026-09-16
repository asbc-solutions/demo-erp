/** Finance is single-currency by design (see Create Expense.bru docs) — EGP unless the API says otherwise. */
export function formatCurrency(amount: number, currencyCode = "EGP"): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
