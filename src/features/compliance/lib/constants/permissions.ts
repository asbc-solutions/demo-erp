/**
 * Compliance permission resource slugs (see bruno/Compliance/**\/*.bru docs blocks).
 * Each tab is gated by its own resource — there is no single page-level slug.
 */
export const COMPLIANCE_RESOURCES = {
  overview: "compliance.overview",
  access: "compliance.access",
  policies: "compliance.policies",
  audit: "compliance.audit",
  rules: "compliance.rules",
} as const

export type ComplianceResource =
  (typeof COMPLIANCE_RESOURCES)[keyof typeof COMPLIANCE_RESOURCES]
