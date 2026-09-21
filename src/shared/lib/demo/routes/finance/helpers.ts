import { applyFilters, paginate, type ListParams, type Row } from "../../demo-db"
import type { DemoResult } from "../../demo-router"

/**
 * Every finance request carries the toolbar scope (`entity_id`, `period`).
 * Seeded documents are all EG-01, so scope is split off here instead of being
 * treated as a column filter by `applyFilters`.
 */
export function splitScope(params: ListParams): {
  scope: { entityId: string | null; period: string | null }
  rest: Record<string, unknown>
} {
  const { entity_id: entityId, period, ...rest } = params ?? {}
  return {
    scope: {
      entityId: entityId ? String(entityId) : null,
      period: period ? String(period) : null,
    },
    rest,
  }
}

/** Filter + paginate a collection into the `{ data, meta }` envelope. */
export function listResponse(rows: Row[], params: ListParams): DemoResult {
  const { rest } = splitScope(params)
  const page = paginate(applyFilters(rows, rest), rest)
  return { data: page.rows, meta: page.meta }
}
