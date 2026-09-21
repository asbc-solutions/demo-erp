import { financeKeys } from "../../../lib/constants/query-keys"

export const moneyOutKeys = {
  all: [...financeKeys.all, "money-out"] as const,
  approvals: () => [...moneyOutKeys.all, "approvals"] as const,
  paymentRunCandidates: () => [...moneyOutKeys.all, "payment-run-candidates"] as const,
  expenses: () => [...moneyOutKeys.all, "expenses"] as const,
} as const
