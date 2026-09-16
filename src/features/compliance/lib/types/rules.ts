/**
 * Wire types for the Compliance Rules tab (bruno/Compliance/Rules/*.bru).
 *
 * `framework` is a database-backed, admin-configurable list (`compliance_frameworks`),
 * not a fixed enum — new frameworks can be added without a deploy. Fetch the live
 * set from GET /compliance/rules/frameworks rather than hardcoding GDPR/ISO27001/etc.
 */

export type RuleSeverity = "critical" | "warning" | "info"
export type RuleStatus = "compliant" | "in_progress" | "non_compliant"

export type RuleFrameworkRef = { id: string; code: string; label: string }
export type RuleOwner = { id: string; name: string }

export type ComplianceRule = {
  id: string
  code: string
  title: string
  description: string
  severity: RuleSeverity
  severity_label: string
  framework: RuleFrameworkRef
  status: RuleStatus
  status_label: string
  owner: RuleOwner | null
  due_date: string | null
  is_overdue: boolean
  tags: string[]
  evidence: string | null
}

export type RulesListParams = {
  framework?: string
  framework_id?: string
  status?: RuleStatus
  severity?: RuleSeverity
  search?: string
  page?: number
  per_page?: number
}

export type ComplianceFramework = {
  id: string
  code: string
  label: string
  rule_count: number
}

export type UpdateRulePayload = {
  code?: string
  title?: string
  description?: string
  severity?: RuleSeverity
  framework_id?: string
  status?: RuleStatus
  owner_employee_id?: string
  due_date?: string
  tags?: string[]
  evidence?: string
}
