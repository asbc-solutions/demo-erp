import { financeKeys } from "../../../lib/constants/query-keys"
import type { Side } from "../types/subledger"

export const subledgerKeys = {
  all: (side: Side) => [...financeKeys.all, "subledger", side] as const,
  overview: (side: Side) => [...subledgerKeys.all(side), "overview"] as const,
  contact: (side: Side, id: string) => [...subledgerKeys.all(side), "contact", id] as const,
  notes: (side: Side) => [...subledgerKeys.all(side), "notes"] as const,
  advances: (side: Side) => [...subledgerKeys.all(side), "advances"] as const,
  vouchers: (side: Side) => [...subledgerKeys.all(side), "vouchers"] as const,
} as const
