export type DiscountApprovalStatus = "pending" | "approved" | "rejected"

/**
 * Response shape beyond `id`/`status` isn't given as example JSON in the
 * Bruno docs (docs/sales.md §4.3/§6.6) — modeled from documented request
 * fields and assertions only.
 */
export type DiscountApproval = {
  id: string
  quotation_id: string
  quotation_line_id: string
  status: DiscountApprovalStatus
  justification: string
  approver_role_code: string | null
  note: string | null
  created_at: string
}

export type RequestDiscountApprovalPayload = {
  /** Minimum 20 characters (backend-enforced). */
  justification: string
}

export type DecideDiscountApprovalPayload = {
  decision: "approve" | "reject"
  /** Required when decision is "reject". */
  note?: string
}
