import type { ApiResponse, PaginationMeta } from "../types/api"

export type DemoRequest = {
  method: "get" | "post" | "put" | "patch" | "delete"
  /** Path with no query string and no leading origin, e.g. `/sales/customers/42`. */
  path: string
  segments: string[]
  params: Record<string, unknown>
  body: Record<string, unknown>
  /** Values captured from `:name` placeholders in the route pattern. */
  vars: Record<string, string>
}

export type DemoResult = {
  data: unknown
  meta?: PaginationMeta | Record<string, unknown>
  status?: number
}

export type DemoHandler = (req: DemoRequest) => DemoResult | unknown

export type DemoRoute = {
  method: DemoRequest["method"] | "*"
  /** `/sales/customers/:id/block` — `:name` matches one segment. */
  pattern: string
  handler: DemoHandler
}

export function route(
  method: DemoRoute["method"],
  pattern: string,
  handler: DemoHandler,
): DemoRoute {
  return { method, pattern, handler }
}

function matchPattern(
  pattern: string,
  segments: string[],
): Record<string, string> | null {
  const parts = pattern.replace(/^\//, "").split("/")
  if (parts.length !== segments.length) return null

  const vars: Record<string, string> = {}
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]
    if (part.startsWith(":")) {
      vars[part.slice(1)] = segments[i]
      continue
    }
    if (part !== segments[i]) return null
  }
  return vars
}

export function findRoute(
  routes: DemoRoute[],
  method: DemoRequest["method"],
  segments: string[],
): { route: DemoRoute; vars: Record<string, string> } | null {
  for (const candidate of routes) {
    if (candidate.method !== "*" && candidate.method !== method) continue
    const vars = matchPattern(candidate.pattern, segments)
    if (vars) return { route: candidate, vars }
  }
  return null
}

/**
 * Wrap a handler's return value in the envelope every `lib/api` module expects.
 * `meta` is deliberately loose: several features extend `PaginationMeta` with
 * their own fields (sales tab counts, finance summaries, HR headcount KPIs).
 */
export type DemoEnvelope = Omit<ApiResponse<unknown>, "meta"> & { meta?: unknown }

export function toApiResponse(result: DemoResult | unknown): DemoEnvelope {
  const isEnvelope =
    result !== null &&
    typeof result === "object" &&
    "data" in (result as Record<string, unknown>)

  if (isEnvelope) {
    const typed = result as DemoResult
    return { success: true, data: typed.data, ...(typed.meta ? { meta: typed.meta } : {}) }
  }

  return { success: true, data: result }
}
