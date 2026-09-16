import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from "axios"

import {
  applyFilters,
  collection,
  createRow,
  findRow,
  hasCollection,
  paginate,
  removeRow,
  updateRow,
  type Row,
} from "./demo-db"
import {
  findRoute,
  toApiResponse,
  type DemoRequest,
  type DemoResult,
} from "./demo-router"
import { DEMO_ROUTES } from "./routes"

/** Simulated latency, so skeletons and spinners still appear in the demo. */
const MIN_DELAY_MS = 90
const MAX_DELAY_MS = 260

/**
 * Last path segments that name a single aggregate rather than a list. Used only
 * by the fallback, to decide between `{}` and `[]` for an endpoint nobody has
 * written a handler for yet.
 */
const AGGREGATE_SUFFIXES = new Set([
  "summary",
  "overview",
  "stats",
  "statistics",
  "analytics",
  "dashboard",
  "me",
  "settings",
  "config",
  "profile",
  "matrix",
  "totals",
  "kpis",
  "metrics",
  "balance",
  "current",
  "count",
  "counts",
])

function delay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {}
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof data === "object") return data as Record<string, unknown>
  return {}
}

function normalisePath(url: string): string {
  const withoutOrigin = url.replace(/^https?:\/\/[^/]+/, "")
  const [path] = withoutOrigin.split("?")
  return path.replace(/\/+$/, "") || "/"
}

type Resource = {
  key: string
  id: string | null
  action: string | null
}

/**
 * Split a path into collection / id / action by matching it against the
 * *registered* collections, longest prefix first:
 *
 *   /sales/customers            → { key: "sales/customers" }
 *   /sales/customers/cus-2      → { key: "sales/customers", id: "cus-2" }
 *   /sales/customers/cus-2/block→ { …, id: "cus-2", action: "block" }
 *
 * Matching on the registry rather than on the *shape* of a segment matters:
 * demo ids are slugs (`emp-3`, `qt-1`), so any "does this look like an id?"
 * heuristic would treat them as path segments and never find the record.
 */
function resolveResource(segments: string[]): Resource | null {
  for (let length = segments.length; length > 0; length -= 1) {
    const key = segments.slice(0, length).join("/")
    if (!hasCollection(key)) continue
    const rest = segments.slice(length)
    return { key, id: rest[0] ?? null, action: rest[1] ?? null }
  }
  return null
}

/**
 * REST-shaped fallback for any collection that has a seed registered but no
 * hand-written route. Covers the long tail of plain CRUD endpoints.
 */
function genericHandler(req: DemoRequest): DemoResult | null {
  const resource = resolveResource(req.segments)
  if (!resource) return null

  const { key, id, action } = resource

  switch (req.method) {
    case "get": {
      // A sub-resource with no handler of its own (`/employees/:id/photo`) is
      // left to `fallback()`, which picks the right empty shape for it.
      if (action) return null
      if (id) return { data: findRow(key, id) ?? null }
      const filtered = applyFilters(collection(key), req.params)
      const { rows, meta } = paginate(filtered, req.params)
      return { data: rows, meta }
    }

    case "post": {
      if (id && action) {
        // `/x/:id/approve`, `/x/:id/block`, … — record the action as a status
        // so the UI reflects it, and hand the row back.
        const row = updateRow(key, id, { status: action })
        return { data: row ?? null }
      }
      return { data: createRow(key, req.body) }
    }

    case "put":
    case "patch": {
      if (!id) return { data: req.body }
      if (action) {
        const row = updateRow(key, id, { status: action })
        return { data: row ?? null }
      }
      return { data: updateRow(key, id, req.body) ?? null }
    }

    case "delete": {
      if (id && action) return { data: null }
      if (id) removeRow(key, id)
      return { data: null }
    }

    default:
      return null
  }
}

function snapshot<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T
}

/** Last resort: a well-formed empty response, never an error. */
function fallback(req: DemoRequest): DemoResult {
  if (req.method !== "get") return { data: req.body ?? null }

  const last = req.segments[req.segments.length - 1] ?? ""
  // A trailing id or a singular-sounding segment means the caller expects one
  // record, not a list — hand back `{}` so `data.foo` reads as undefined
  // instead of blowing up on an array.
  const endsWithId = /^\d+$/.test(last) || /^[a-z]+-[\w-]+$/i.test(last)
  if (AGGREGATE_SUFFIXES.has(last) || endsWithId) {
    return { data: {} }
  }
  return {
    data: [] as Row[],
    meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
  }
}

const warned = new Set<string>()

function warnUnmapped(method: string, path: string): void {
  if (process.env.NODE_ENV === "production") return
  const key = `${method} ${path}`
  if (warned.has(key)) return
  warned.add(key)
  // Surfaces gaps in the demo data while developing without breaking the page.
  console.warn(`[demo] no handler for ${key} — returned an empty response`)
}

export const demoAdapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
  await delay()

  const method = (config.method ?? "get").toLowerCase() as DemoRequest["method"]
  const path = normalisePath(config.url ?? "/")
  const segments = path.split("/").filter(Boolean)

  const req: DemoRequest = {
    method,
    path,
    segments,
    params: (config.params as Record<string, unknown>) ?? {},
    body: parseBody(config.data),
    vars: {},
  }

  const matched = findRoute(DEMO_ROUTES, method, segments)
  let result: DemoResult | unknown

  if (matched) {
    req.vars = matched.vars
    result = matched.route.handler(req)
  } else {
    const generic = genericHandler(req)
    if (generic) {
      result = generic
    } else {
      warnUnmapped(method, path)
      result = fallback(req)
    }
  }

  const status =
    result && typeof result === "object" && "status" in (result as DemoResult)
      ? ((result as DemoResult).status ?? 200)
      : 200

  // Handlers hand back live references into the demo store. A real response is
  // always freshly parsed JSON, and react-query relies on that: caching a live
  // row would let a later mutation rewrite an already-cached query result in
  // place, so the data changes without the reference changing and the UI never
  // re-renders. Snapshot the payload to restore over-the-wire semantics.
  const payload = snapshot(toApiResponse(result))

  const response: AxiosResponse = {
    data: payload,
    status,
    statusText: "OK",
    headers: {},
    config: config as AxiosResponse["config"],
  }

  return response
}
