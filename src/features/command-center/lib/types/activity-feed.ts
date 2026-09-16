// Wire types for GET /command-center/activity-feed — see bruno/CommandCenter/Dashboard/Activity Feed.bru
//
// Single event stream shared with Core HR's `GET /audit-log` and Compliance's
// `GET /compliance/audit-log` (all read from `employee_history`). `category`
// groups several `module_name` values together; `tone` mirrors `category` on
// each item so the UI can color a row without re-deriving the mapping:
//   finance -> finance, payroll
//   sales   -> sales
//   people  -> hr, leave, attendance, recruitment, performance, training
//   system  -> system, settings, integrations, compliance

export type ActivityFeedCategory = "finance" | "sales" | "people" | "system"

export type ActivityFeedItem = {
  id: number
  title: string
  actor: string
  /** Underlying module name (e.g. "finance", "payroll", "recruitment", ...) — not narrowed to a fixed union since the docs list module examples, not an exhaustive enum. */
  module: string
  tone: ActivityFeedCategory
  when: string
  time_label: string
}

export type ActivityFeedParams = {
  category?: ActivityFeedCategory
  /** Default 20, max 50. */
  limit?: number
  page?: number
}
