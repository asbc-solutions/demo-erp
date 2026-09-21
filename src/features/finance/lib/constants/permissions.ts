/**
 * One RBAC resource per finance section, keyed by the section's nav group id
 * (`FINANCE_NAV_GROUPS` in `shared/lib/constants/finance-nav.ts`).
 */
export const FINANCE_RESOURCES = {
  "fin-g-overview": "finance.overview",
  "fin-g-money-in": "finance.receivables",
  "fin-g-money-out": "finance.payables",
  "fin-g-banking": "finance.banking",
  "fin-g-ledger": "finance.ledger",
  "fin-g-close": "finance.close",
  "fin-g-tax": "finance.tax",
  "fin-g-assets": "finance.assets",
  "fin-g-planning": "finance.planning",
  "fin-g-reports": "finance.reports",
  "fin-g-configuration": "finance.configuration",
} as const

export type FinanceResource = (typeof FINANCE_RESOURCES)[keyof typeof FINANCE_RESOURCES]

export function financeResourceForGroup(groupId: string): FinanceResource | null {
  return (FINANCE_RESOURCES as Record<string, FinanceResource>)[groupId] ?? null
}
