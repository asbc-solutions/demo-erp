/**
 * The demo's in-memory database.
 *
 * Every non-auth request is served from here instead of the network, so the
 * whole ERP behaves like a real app — lists paginate, creates show up, edits
 * stick — for the lifetime of the tab. A reload re-seeds from scratch, which is
 * exactly what a sales demo wants.
 */

export type Row = Record<string, unknown> & { id: string | number }

type Collections = Record<string, Row[]>

const collections: Collections = {}
const seeders: Record<string, () => Row[]> = {}

let sequence = 100_000

export function nextId(prefix = ""): string {
  sequence += 1
  return `${prefix}${sequence}`
}

/**
 * Register a collection and how to (re)build it. Seeding is lazy so a demo that
 * never opens Projects never pays to build them.
 */
export function defineCollection(name: string, seed: () => Row[]): void {
  seeders[name] = seed
}

export function collection(name: string): Row[] {
  if (!collections[name]) {
    collections[name] = seeders[name] ? seeders[name]() : []
  }
  return collections[name]
}

export function resetCollections(): void {
  for (const key of Object.keys(collections)) delete collections[key]
}

export function hasCollection(name: string): boolean {
  return Boolean(seeders[name] || collections[name])
}

/* -------------------------------------------------------------------------- */
/*                                 Queries                                    */
/* -------------------------------------------------------------------------- */

export type ListParams = Record<string, unknown> | undefined

function valueMatches(row: Row, key: string, want: unknown): boolean {
  const actual = row[key]
  if (actual === undefined || actual === null) return false
  if (Array.isArray(actual)) {
    return actual.some((entry) => String(entry) === String(want))
  }
  return String(actual).toLowerCase() === String(want).toLowerCase()
}

function textMatches(row: Row, needle: string): boolean {
  const term = needle.toLowerCase()
  return Object.values(row).some(
    (value) =>
      (typeof value === "string" || typeof value === "number") &&
      String(value).toLowerCase().includes(term),
  )
}

/** Params that steer the query rather than filter on a column. */
const CONTROL_PARAMS = new Set([
  "page",
  "per_page",
  "perPage",
  "limit",
  "search",
  "q",
  "sort",
  "sort_by",
  "sort_dir",
  "order",
  "include",
  "with",
])

export function applyFilters(rows: Row[], params: ListParams): Row[] {
  if (!params) return rows
  let result = rows

  const search = (params.search ?? params.q) as string | undefined
  if (search && String(search).trim()) {
    result = result.filter((row) => textMatches(row, String(search).trim()))
  }

  for (const [key, value] of Object.entries(params)) {
    if (CONTROL_PARAMS.has(key)) continue
    if (value === undefined || value === null || value === "") continue
    // "all" is how this codebase's filter selects express "no filter".
    if (String(value).toLowerCase() === "all") continue
    result = result.filter((row) => valueMatches(row, key, value))
  }

  return result
}

export type Paginated<T> = {
  rows: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export function paginate<T>(rows: T[], params: ListParams): Paginated<T> {
  const perPage = Number(params?.per_page ?? params?.perPage ?? params?.limit ?? 20) || 20
  const page = Number(params?.page ?? 1) || 1
  const total = rows.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), lastPage)
  const start = (current - 1) * perPage
  return {
    rows: rows.slice(start, start + perPage),
    meta: {
      current_page: current,
      per_page: perPage,
      total,
      last_page: lastPage,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Mutations                                  */
/* -------------------------------------------------------------------------- */

export function findRow(name: string, id: string): Row | undefined {
  return collection(name).find((row) => String(row.id) === String(id))
}

export function createRow(name: string, payload: Record<string, unknown>): Row {
  const rows = collection(name)
  const row: Row = { id: nextId(), ...payload }
  if (payload.id === undefined) row.id = nextId()
  rows.unshift(row)
  return row
}

export function updateRow(
  name: string,
  id: string,
  payload: Record<string, unknown>,
): Row | undefined {
  const row = findRow(name, id)
  if (!row) return undefined
  Object.assign(row, payload, { id: row.id })
  return row
}

export function removeRow(name: string, id: string): boolean {
  const rows = collection(name)
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) return false
  rows.splice(index, 1)
  return true
}
