/**
 * Wire types for GET /compliance/score and GET /compliance/alerts
 * (bruno/Compliance/Overview/*.bru). All fields are snake_case.
 */

export type ComplianceScoreStatus =
  | "strong"
  | "adequate"
  | "at_risk"
  | "critical"
  | "not_assessed"

export type ComplianceScore = {
  score: number
  max: number
  status: ComplianceScoreStatus
  based_on_rules: number
  compliant: number
  in_progress: number
  non_compliant: number
  policies: {
    draft: number
    under_review: number
    active: number
    archived: number
  }
}

export type AlertSeverity = "critical" | "warning" | "info"
export type AlertStatus = "compliant" | "in_progress" | "non_compliant"

/** Alerts are derived from compliance_rules — `id` is the underlying rule id. */
export type CriticalAlert = {
  id: string
  code: string
  title: string
  severity: AlertSeverity
  severity_label: string
  status: AlertStatus
  detail: string
  framework: string
  owner: string
  due_date: string | null
  is_overdue: boolean
}

export type CriticalAlertsParams = {
  severity?: AlertSeverity
}
