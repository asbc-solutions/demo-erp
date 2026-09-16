import { paginate } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  COMMAND_CENTER_SUMMARY,
  buildActivityFeed,
  buildRecentInvoices,
  buildRevenueTrend,
} from "../seed/command-center"

const MONTHS_BY_RANGE: Record<string, number> = {
  "6m": 6,
  "12m": 12,
  ytd: new Date().getUTCMonth() + 1,
  all: 24,
}

export const commandCenterRoutes: DemoRoute[] = [
  route("get", "/command-center/summary", () => ({
    data: COMMAND_CENTER_SUMMARY,
  })),

  route("get", "/command-center/revenue-trend", (req) => {
    const range = String(req.params.range ?? "12m")
    return { data: buildRevenueTrend(MONTHS_BY_RANGE[range] ?? 12) }
  }),

  route("get", "/command-center/activity-feed", (req) => {
    const all = buildActivityFeed()
    const category = req.params.category as string | undefined
    const filtered =
      category && category !== "all"
        ? all.filter((item) => item.tone === category)
        : all
    const limit = Number(req.params.limit ?? 20) || 20
    const { rows, meta } = paginate(filtered, {
      page: req.params.page,
      per_page: limit,
    })
    return { data: rows, meta }
  }),

  route("get", "/command-center/recent-invoices", (req) => {
    const limit = Number(req.params.limit ?? 3) || 3
    return { data: buildRecentInvoices().slice(0, limit) }
  }),
]
