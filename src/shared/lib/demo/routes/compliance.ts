import { applyFilters, collection, defineCollection, findRow, paginate, updateRow } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  COMPLIANCE_AUDIT_ROWS,
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_POLICY_ROWS,
  COMPLIANCE_RULE_ROWS,
  ROLE_ROWS,
  TEAM_MEMBER_ROWS,
  buildComplianceAlerts,
  buildComplianceScore,
  buildPermissionMatrix,
} from "../seed/modules"

defineCollection("compliance/policies", () => [...COMPLIANCE_POLICY_ROWS])
defineCollection("compliance/rules", () => [...COMPLIANCE_RULE_ROWS])
defineCollection("compliance/audit-log", () => [...COMPLIANCE_AUDIT_ROWS])

export const complianceRoutes: DemoRoute[] = [
  route("get", "/compliance/score", () => ({ data: buildComplianceScore() })),

  route("get", "/compliance/alerts", (req) => {
    const alerts = buildComplianceAlerts()
    const severity = req.params.severity as string | undefined
    return {
      data:
        severity && severity !== "all"
          ? alerts.filter((a) => a.severity === severity)
          : alerts,
    }
  }),

  // Must precede `/compliance/rules/:id`.
  route("get", "/compliance/rules/frameworks", () => ({ data: COMPLIANCE_FRAMEWORKS })),

  route("get", "/compliance/rules", (req) => {
    const rows = applyFilters(collection("compliance/rules"), {
      framework_id: req.params.framework_id ?? req.params.framework,
      status: req.params.status,
      severity: req.params.severity,
      search: req.params.search,
    })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("patch", "/compliance/rules/:id", (req) => {
    const row = updateRow("compliance/rules", req.vars.id, req.body)
    if (row && typeof req.body.status === "string") {
      row.status_label = req.body.status.replace(/_/g, " ")
    }
    return { data: row ?? null }
  }),

  route("get", "/compliance/policies", (req) => {
    const rows = applyFilters(collection("compliance/policies"), {
      status: req.params.status,
      category: req.params.category,
      search: req.params.search,
    })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("post", "/compliance/policies/:id/acknowledge", (req) => {
    const policy = findRow("compliance/policies", req.vars.id)
    if (!policy) return { data: null }
    const acks = policy.acknowledgements as {
      acknowledged: number
      required: number
      ratio: string
      outstanding: number
      acknowledged_by_me: boolean
    }
    if (!acks.acknowledged_by_me) {
      acks.acknowledged += 1
      acks.outstanding = Math.max(0, acks.required - acks.acknowledged)
      acks.ratio = `${acks.acknowledged}/${acks.required}`
      acks.acknowledged_by_me = true
    }
    return { data: { id: policy.id, title: policy.title, acknowledgements: acks } }
  }),

  route("get", "/compliance/audit-log", (req) => {
    let rows = collection("compliance/audit-log")
    if (req.params.module_name) {
      rows = rows.filter((r) => r.module === req.params.module_name)
    }
    if (req.params.action_type) {
      rows = rows.filter((r) => r.action === req.params.action_type)
    }
    if (req.params.from) rows = rows.filter((r) => String(r.when) >= String(req.params.from))
    if (req.params.to) rows = rows.filter((r) => String(r.when) <= String(req.params.to))
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  /* Access tab — shares its data with Settings → Team and Roles. */

  route("get", "/compliance/access/roles", () => ({ data: ROLE_ROWS })),

  route("get", "/compliance/access/permission-matrix", () => ({
    data: buildPermissionMatrix(),
  })),

  route("get", "/compliance/access/members", (req) => {
    let rows = TEAM_MEMBER_ROWS
    if (req.params.role_id) {
      rows = rows.filter((m) => m.role_id === req.params.role_id)
    }
    if (req.params.is_active !== undefined) {
      const want = String(req.params.is_active) === "true"
      rows = rows.filter((m) => Boolean(m.is_active) === want)
    }
    rows = applyFilters(rows, { search: req.params.search })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),
]
