import { financeKeys } from "../../../lib/constants/query-keys"

export const overviewKeys = {
  all: [...financeKeys.all, "overview"] as const,
  home: () => [...overviewKeys.all, "home"] as const,
  cashPosition: () => [...overviewKeys.all, "cash-position"] as const,
  closeReadiness: () => [...overviewKeys.all, "close-readiness"] as const,
  exceptions: () => [...overviewKeys.all, "exceptions"] as const,
  pendingBills: () => [...financeKeys.all, "bills", "pending-approval"] as const,
  assistant: {
    all: [...financeKeys.all, "assistant"] as const,
    settings: () => [...overviewKeys.assistant.all, "settings"] as const,
    briefing: () => [...overviewKeys.assistant.all, "briefing"] as const,
    drafts: (status: string) => [...overviewKeys.assistant.all, "drafts", status] as const,
    history: () => [...overviewKeys.assistant.all, "history"] as const,
  },
} as const
