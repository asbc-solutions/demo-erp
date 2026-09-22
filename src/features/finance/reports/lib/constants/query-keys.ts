import { financeKeys } from "../../../lib/constants/query-keys"

export const reportsKeys = {
  all: [...financeKeys.all, "reports"] as const,
  trialBalance: () => [...reportsKeys.all, "trial-balance"] as const,
  auditLog: () => [...reportsKeys.all, "audit"] as const,
} as const
