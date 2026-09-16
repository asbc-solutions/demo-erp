/**
 * Wire-level conventions shared across the Sales API (see docs/sales.md §1):
 * - all fields are snake_case
 * - enum fields are paired with a `*_label` sibling — always render the label,
 *   never derive display text from the raw enum client-side
 * - list rows are flat/denormalized (e.g. `customer_name`, not a nested customer)
 * - totals are numbers, never pre-formatted strings
 */

export type TabCounts = Record<string, number>

/** Pagination meta as returned by Customers/Quotations/Orders/Invoices lists. */
export type TabbedListMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
  tabs: TabCounts
}

/** Pagination meta as returned by Salespeople/Products lists. */
export type RangedListMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

/** Plain pagination meta (no tabs/range extras), e.g. CRM Reflections list. */
export type PlainListMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export type ExportFormat = "xlsx" | "csv" | "pdf"
export type ExportScope = "all" | "filtered" | "selected"

export type SalesExportRequest<TFilters> = {
  format: ExportFormat
  scope: ExportScope
  filters?: TFilters
  ids?: string[]
}

/** Response from the entity export endpoints (Customers/Quotations/Orders/Invoices). */
export type SalesExportResult = {
  async: boolean
  job_id: string
  download_url?: string
}

export type SalesExportJobStatus = "processing" | "completed" | "failed"

/** GET /sales/exports/{job_id}/status */
export type SalesExportJob = {
  job_id: string
  entity: "customers" | "quotations" | "orders" | "invoices"
  status: SalesExportJobStatus
  filename?: string
  download_url?: string
  error?: string
}

/** Signed, time-limited download link returned by PDF/print/logo endpoints. */
export type SignedDownloadUrl = {
  download_url: string
}
