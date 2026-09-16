import type { ActivityFeedParams } from "../types/activity-feed"
import type { RecentInvoicesParams } from "../types/recent-invoices"
import type { RevenueTrendRange } from "../types/revenue-trend"

export const commandCenterKeys = {
  summary: {
    all: ["command-center", "summary"] as const,
    get: () => [...commandCenterKeys.summary.all] as const,
  },

  revenueTrend: {
    all: ["command-center", "revenue-trend"] as const,
    list: (range?: RevenueTrendRange) =>
      [...commandCenterKeys.revenueTrend.all, "list", range] as const,
  },

  activityFeed: {
    all: ["command-center", "activity-feed"] as const,
    list: (params?: ActivityFeedParams) =>
      [...commandCenterKeys.activityFeed.all, "list", params] as const,
  },

  recentInvoices: {
    all: ["command-center", "recent-invoices"] as const,
    list: (params?: RecentInvoicesParams) =>
      [...commandCenterKeys.recentInvoices.all, "list", params] as const,
  },
}
