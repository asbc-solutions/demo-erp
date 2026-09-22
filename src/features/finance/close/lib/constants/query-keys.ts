import { financeKeys } from "../../../lib/constants/query-keys"

export const closeKeys = {
  all: [...financeKeys.all, "close"] as const,
  workspace: () => [...closeKeys.all, "workspace"] as const,
  periods: () => [...closeKeys.all, "periods"] as const,
  yearEnd: () => [...closeKeys.all, "year-end"] as const,
  adjustments: () => [...closeKeys.all, "adjustments"] as const,
} as const
