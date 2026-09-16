/**
 * Wire types for the Compliance Policies tab (bruno/Compliance/Policies/*.bru).
 */

export type PolicyStatus = "draft" | "under_review" | "active" | "archived"

export type PolicyOwner = { id: string; name: string }

/**
 * `required` is stored on the policy (not derived from headcount) so the ratio
 * doesn't shift underneath a review cycle as people join/leave.
 */
export type PolicyAcknowledgements = {
  acknowledged: number
  required: number
  ratio: string
  outstanding: number
  acknowledged_by_me: boolean
}

export type CompliancePolicy = {
  id: string
  title: string
  category: string
  version: string
  status: PolicyStatus
  status_label: string
  summary: string
  owner: PolicyOwner | null
  review_date: string | null
  is_review_overdue: boolean
  acknowledgements: PolicyAcknowledgements
}

export type PoliciesListParams = {
  status?: PolicyStatus
  category?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreatePolicyPayload = {
  title: string
  category: string
  version?: string
  status?: PolicyStatus
  summary?: string
  owner_employee_id?: string
  review_date?: string
  required_acknowledgements?: number
}

/** POST /compliance/policies/{id}/acknowledge is idempotent — only returns this subset. */
export type AcknowledgePolicyResult = {
  id: string
  title: string
  acknowledgements: PolicyAcknowledgements
}
