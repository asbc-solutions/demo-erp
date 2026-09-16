// Wire types for GET /command-center/recent-invoices — see bruno/CommandCenter/Dashboard/Recent Invoices.bru
//
// This endpoint proxies Finance's own service and returns items shaped
// exactly like `GET /finance/invoices` — duplicated here (not imported from
// the Finance feature) since Command Center must stay self-contained and
// Finance is being wired up separately.

export type RecentInvoice = {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  issue_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  currency_code: string
  /**
   * Derived status (e.g. can read `"overdue"` even though that isn't stored).
   * Only `"draft"` is shown in the docs example; kept open-ended.
   */
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void" | (string & {})
  /** The real persisted status in the DB — `status` above may be derived from it (e.g. overdue). */
  persisted_status: string
}

export type RecentInvoicesParams = {
  /** Default 3, max 20. */
  limit?: number
}
