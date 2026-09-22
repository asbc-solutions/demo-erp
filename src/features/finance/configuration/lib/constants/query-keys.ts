import { financeKeys } from "../../../lib/constants/query-keys"

export const configurationKeys = {
  all: [...financeKeys.all, "configuration"] as const,
  setup: () => [...configurationKeys.all, "setup"] as const,
  postingMap: () => [...configurationKeys.all, "posting-map"] as const,
  simulation: (ruleId: string, amount: number, inclusive: boolean) => [...configurationKeys.all, "simulation", ruleId, amount, inclusive] as const,
  fiscalCalendar: () => [...configurationKeys.all, "fiscal-calendar"] as const,
  numbering: () => [...configurationKeys.all, "numbering"] as const,
  approvals: () => [...configurationKeys.all, "approvals"] as const,
  roles: () => [...configurationKeys.all, "roles"] as const,
} as const
