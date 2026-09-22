import { financeKeys } from "../../../lib/constants/query-keys"

export const planningKeys = {
  all: [...financeKeys.all, "planning"] as const,
  budgets: () => [...planningKeys.all, "budgets"] as const,
  budget: (id: string) => [...planningKeys.all, "budget", id] as const,
  costCenters: () => [...planningKeys.all, "cost-centers"] as const,
  costCenter: (id: string) => [...planningKeys.all, "cost-center", id] as const,
  dimensions: () => [...planningKeys.all, "dimensions"] as const,
  allocationRules: () => [...planningKeys.all, "allocation-rules"] as const,
} as const
