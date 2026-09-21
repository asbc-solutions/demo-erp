import type { Row } from "../demo-db"
import {
  COMPANY_NAMES,
  emailFor,
  intBetween,
  isoDateTime,
  isoDay,
  makeRandom,
  moneyBetween,
  personName,
  pick,
} from "./faker"

/* -------------------------------------------------------------------------- */
/*                                 Operations                                 */
/* -------------------------------------------------------------------------- */

const OPS_PROJECT_NAMES = [
  "Warehouse Automation", "ERP Rollout — Phase 2", "Vendor Consolidation",
  "Fleet Telematics", "Cold Chain Upgrade", "Supplier Portal",
  "Quality Programme", "Inventory Cycle Counts", "Packaging Redesign",
  "Logistics Network Review",
] as const

const OPS_PROJECT_STATUSES = ["planning", "active", "active", "on_hold", "completed"] as const

export const OPS_PROJECT_ROWS: Row[] = OPS_PROJECT_NAMES.map((name, i) => {
  const rand = makeRandom(150_000 + i)
  const status = OPS_PROJECT_STATUSES[i % OPS_PROJECT_STATUSES.length]
  const budget = moneyBetween(rand, 60_000, 800_000, 1_000)
  const spent = Math.round(budget * (status === "completed" ? 0.95 : 0.2 + rand() * 0.6))
  const endOffset = intBetween(rand, -30, 200)
  return {
    id: `oproj-${i + 1}`,
    name,
    description: `${name} programme for the operations group.`,
    status,
    status_label: status.replace(/_/g, " "),
    progress_pct: status === "completed" ? 100 : intBetween(rand, 5, 92),
    budget_amount: budget,
    spent_amount: spent,
    remaining_budget: budget - spent,
    currency_code: "USD",
    lead: { id: `emp-${i + 1}`, name: personName(rand) },
    lead_employee_id: `emp-${i + 1}`,
    start_date: isoDay(-intBetween(rand, 60, 400)),
    end_date: isoDay(endOffset),
    is_overdue: endOffset < 0 && status !== "completed",
  }
})

const TASK_STATUSES = ["to_do", "in_progress", "review", "done", "blocked"] as const
const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const

export const OPS_TASK_ROWS: Row[] = Array.from({ length: 58 }, (_, i) => {
  const rand = makeRandom(160_000 + i)
  const project = OPS_PROJECT_ROWS[i % OPS_PROJECT_ROWS.length]
  const status = TASK_STATUSES[i % TASK_STATUSES.length]
  const priority = TASK_PRIORITIES[i % TASK_PRIORITIES.length]
  const dueOffset = intBetween(rand, -25, 70)
  return {
    id: `otask-${i + 1}`,
    title: `${pick(rand, ["Review", "Draft", "Approve", "Audit", "Schedule", "Migrate"] as const)} ${pick(rand, ["supplier contract", "inventory report", "safety checklist", "route plan", "SOP document"] as const)}`,
    description: null,
    project: { id: String(project.id), name: String(project.name) },
    project_id: project.id,
    assignee: { id: `emp-${(i % 20) + 1}`, name: personName(rand) },
    assignee_id: `emp-${(i % 20) + 1}`,
    priority,
    priority_label: priority.charAt(0).toUpperCase() + priority.slice(1),
    status,
    status_label: status.replace(/_/g, " "),
    completed: status === "done",
    due_date: isoDay(dueOffset),
    is_overdue: dueOffset < 0 && status !== "done",
    completed_at: status === "done" ? isoDay(-intBetween(rand, 1, 40)) : null,
  }
})

const VENDOR_CATEGORIES = ["Logistics", "IT & Software", "Facilities", "Raw Materials", "Consulting"] as const
const VENDOR_STATUSES = ["active", "active", "pending", "inactive"] as const

export const OPS_VENDOR_ROWS: Row[] = Array.from({ length: 22 }, (_, i) => {
  const rand = makeRandom(170_000 + i)
  const status = VENDOR_STATUSES[i % VENDOR_STATUSES.length]
  const daysToEnd = intBetween(rand, -20, 300)
  const contact = personName(rand)
  return {
    id: `vend-${i + 1}`,
    name: COMPANY_NAMES[i % COMPANY_NAMES.length],
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    primary_action: status === "active" ? "manage" : status === "pending" ? "activate" : "renew",
    category: pick(rand, VENDOR_CATEGORIES),
    monthly_spend: moneyBetween(rand, 1_200, 48_000, 100),
    currency_code: "USD",
    contract_end: isoDay(daysToEnd),
    days_to_contract_end: daysToEnd,
    contact_name: contact,
    contact_role: pick(rand, ["Account Manager", "Operations Lead", "Director"] as const),
    contact_email: emailFor(contact),
    tags: [pick(rand, ["preferred", "strategic", "backup", "under review"] as const)],
  }
})

/* -------------------------------------------------------------------------- */
/*                                 Compliance                                 */
/* -------------------------------------------------------------------------- */

export const COMPLIANCE_FRAMEWORKS: Row[] = [
  { id: "fw-1", code: "SOC2", label: "SOC 2 Type II", rule_count: 14 },
  { id: "fw-2", code: "GDPR", label: "GDPR", rule_count: 11 },
  { id: "fw-3", code: "ISO27001", label: "ISO 27001", rule_count: 9 },
  { id: "fw-4", code: "LABOR", label: "Labour Law", rule_count: 8 },
]

const RULE_TITLES = [
  "Access reviews performed quarterly",
  "Encryption at rest for customer data",
  "Incident response plan tested annually",
  "Vendor due-diligence records retained",
  "Data subject deletion requests honoured",
  "Background checks completed before start date",
  "Change management approvals documented",
  "Backups restored and verified",
  "Security awareness training completed",
  "Payroll records retained for 7 years",
  "Business continuity plan reviewed",
  "Least-privilege enforced on production",
] as const

const RULE_SEVERITIES = ["critical", "warning", "info"] as const
const RULE_STATUSES = ["compliant", "compliant", "in_progress", "non_compliant"] as const

export const COMPLIANCE_RULE_ROWS: Row[] = RULE_TITLES.map((title, i) => {
  const rand = makeRandom(180_000 + i)
  const framework = COMPLIANCE_FRAMEWORKS[i % COMPLIANCE_FRAMEWORKS.length]
  const severity = RULE_SEVERITIES[i % RULE_SEVERITIES.length]
  const status = RULE_STATUSES[i % RULE_STATUSES.length]
  const dueOffset = intBetween(rand, -30, 150)
  return {
    id: `rule-${i + 1}`,
    code: `${framework.code}-${String(i + 1).padStart(2, "0")}`,
    title,
    description: `${title}. Evidence is collected each cycle and reviewed by the control owner.`,
    severity,
    severity_label: severity.charAt(0).toUpperCase() + severity.slice(1),
    framework: { id: framework.id, code: framework.code, label: framework.label },
    framework_id: framework.id,
    status,
    status_label: status.replace(/_/g, " "),
    owner: { id: `emp-${i + 1}`, name: personName(rand) },
    due_date: isoDay(dueOffset),
    is_overdue: dueOffset < 0 && status !== "compliant",
    tags: [framework.code as string],
    evidence: status === "compliant" ? "Evidence bundle attached." : null,
  }
})

const POLICY_TITLES = [
  "Information Security Policy", "Acceptable Use Policy", "Data Retention Policy",
  "Remote Work Policy", "Anti-Harassment Policy", "Expense & Travel Policy",
  "Business Continuity Policy", "Vendor Management Policy",
] as const

const POLICY_STATUSES = ["active", "active", "under_review", "draft", "archived"] as const

export const COMPLIANCE_POLICY_ROWS: Row[] = POLICY_TITLES.map((title, i) => {
  const rand = makeRandom(190_000 + i)
  const status = POLICY_STATUSES[i % POLICY_STATUSES.length]
  const required = 128
  const acknowledged = status === "active" ? intBetween(rand, 60, 128) : 0
  const reviewOffset = intBetween(rand, -40, 220)
  return {
    id: `pol-${i + 1}`,
    title,
    category: pick(rand, ["Security", "People", "Finance", "Operations"] as const),
    version: `v${1 + (i % 3)}.${i % 5}`,
    status,
    status_label: status.replace(/_/g, " "),
    summary: `${title} covering scope, responsibilities and review cadence.`,
    owner: { id: `emp-${i + 1}`, name: personName(rand) },
    review_date: isoDay(reviewOffset),
    is_review_overdue: reviewOffset < 0,
    acknowledgements: {
      acknowledged,
      required,
      ratio: `${acknowledged}/${required}`,
      outstanding: required - acknowledged,
      acknowledged_by_me: i % 3 === 0,
    },
  }
})

export const COMPLIANCE_AUDIT_ROWS: Row[] = Array.from({ length: 80 }, (_, i) => {
  const rand = makeRandom(200_000 + i)
  const actions = ["insert", "update", "delete", "approve", "login", "export", "status_change"] as const
  const modules = ["hr", "finance", "sales", "settings", "compliance"] as const
  const action = actions[i % actions.length]
  const moduleName = modules[i % modules.length]
  return {
    id: i + 1,
    actor: personName(rand),
    actor_id: (i % 20) + 1,
    action,
    action_label: action.replace(/_/g, " "),
    module: moduleName,
    module_label: moduleName.toUpperCase(),
    subject: pick(rand, ["Employee record", "Invoice", "Policy", "Role", "Quotation"] as const),
    description: `${action.replace(/_/g, " ")} performed on a ${moduleName} record.`,
    when: isoDateTime(-i * 3 - 1),
    ip: `10.0.${intBetween(rand, 0, 12)}.${intBetween(rand, 2, 240)}`,
    status: pick(rand, ["success", "success", "success", "warning", "failure"] as const),
  }
})

export function buildComplianceScore() {
  const compliant = COMPLIANCE_RULE_ROWS.filter((r) => r.status === "compliant").length
  const inProgress = COMPLIANCE_RULE_ROWS.filter((r) => r.status === "in_progress").length
  const nonCompliant = COMPLIANCE_RULE_ROWS.filter((r) => r.status === "non_compliant").length
  const total = COMPLIANCE_RULE_ROWS.length
  const score = Math.round((compliant / total) * 100)
  return {
    score,
    max: 100,
    status: score >= 80 ? "strong" : score >= 60 ? "adequate" : "at_risk",
    based_on_rules: total,
    compliant,
    in_progress: inProgress,
    non_compliant: nonCompliant,
    policies: {
      draft: COMPLIANCE_POLICY_ROWS.filter((p) => p.status === "draft").length,
      under_review: COMPLIANCE_POLICY_ROWS.filter((p) => p.status === "under_review").length,
      active: COMPLIANCE_POLICY_ROWS.filter((p) => p.status === "active").length,
      archived: COMPLIANCE_POLICY_ROWS.filter((p) => p.status === "archived").length,
    },
  }
}

export function buildComplianceAlerts(): Row[] {
  return COMPLIANCE_RULE_ROWS.filter((rule) => rule.status !== "compliant").map((rule) => ({
    id: String(rule.id),
    code: String(rule.code),
    title: String(rule.title),
    severity: String(rule.severity),
    severity_label: String(rule.severity_label),
    status: String(rule.status),
    detail: String(rule.description),
    framework: (rule.framework as { label: string }).label,
    owner: (rule.owner as { name: string }).name,
    due_date: String(rule.due_date),
    is_overdue: Boolean(rule.is_overdue),
  }))
}

/* -------------------------------------------------------------------------- */
/*                            Roles, team & access                            */
/* -------------------------------------------------------------------------- */

export const ROLE_ROWS: Row[] = [
  { id: "role-1", name: "Owner", description: "Full access to every module", is_system: true, member_count: 2, granted_resource_count: 30 },
  { id: "role-2", name: "HR Admin", description: "Manages people, payroll and approvals", is_system: true, member_count: 5, granted_resource_count: 14 },
  { id: "role-3", name: "Finance Manager", description: "Owns invoices, expenses and reporting", is_system: false, member_count: 4, granted_resource_count: 11 },
  { id: "role-4", name: "Sales Manager", description: "Owns pipeline, quotations and orders", is_system: false, member_count: 6, granted_resource_count: 12 },
  { id: "role-5", name: "Employee", description: "Self-service access only", is_system: true, member_count: 108, granted_resource_count: 4 },
]

export const TEAM_MEMBER_ROWS: Row[] = Array.from({ length: 24 }, (_, i) => {
  const rand = makeRandom(210_000 + i)
  const name = personName(rand)
  const [first, last] = name.split(" ")
  const role = ROLE_ROWS[i % ROLE_ROWS.length]
  return {
    id: i + 1,
    name,
    email: emailFor(name),
    initials: `${first[0]}${last[0]}`.toUpperCase(),
    is_active: i % 9 !== 8,
    employee_id: i + 1,
    roles: [{ id: String(role.id), name: String(role.name) }],
    role_id: role.id,
    created_at: isoDateTime(-i * 96 - 240),
  }
})

const MATRIX_RESOURCES = [
  { resource: "command_center", description: "Command Center dashboard" },
  { resource: "finance.overview", description: "Finance overview" },
  { resource: "finance.receivables", description: "Finance receivables" },
  { resource: "finance.payables", description: "Finance payables" },
  { resource: "finance.banking", description: "Finance banking" },
  { resource: "finance.ledger", description: "Finance ledger" },
  { resource: "finance.close", description: "Finance period close" },
  { resource: "finance.tax", description: "Finance tax & compliance" },
  { resource: "finance.assets", description: "Finance fixed assets" },
  { resource: "finance.planning", description: "Finance planning" },
  { resource: "finance.reports", description: "Finance reporting" },
  { resource: "finance.configuration", description: "Finance configuration" },
  { resource: "sales.customer", description: "Sales customers" },
  { resource: "sales.quotation", description: "Sales quotations" },
  { resource: "sales.order", description: "Sales orders" },
  { resource: "sales.invoice", description: "Sales invoices" },
  { resource: "operations.projects", description: "Operations projects" },
  { resource: "operations.vendors", description: "Operations vendors" },
  { resource: "compliance.policies", description: "Compliance policies" },
  { resource: "compliance.rules", description: "Compliance rules" },
  { resource: "settings.team", description: "Team management" },
  { resource: "settings.billing", description: "Billing and plans" },
] as const

export function buildPermissionMatrix() {
  const roles = ROLE_ROWS.map((role) => ({ id: String(role.id), name: String(role.name) }))
  return {
    roles,
    resources: MATRIX_RESOURCES.map((entry, i) => ({
      resource: entry.resource,
      description: entry.description,
      by_role: Object.fromEntries(
        roles.map((role, r) => [
          role.id,
          role.name === "Owner"
            ? "write"
            : role.name === "Employee"
              ? "none"
              : (["write", "read", "approval_required", "none"] as const)[(i + r) % 4],
        ]),
      ),
    })),
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Settings                                  */
/* -------------------------------------------------------------------------- */

export const BILLING_PLANS: Row[] = [
  { id: "plan-1", code: "starter", name: "Starter", price_amount: 49, currency_code: "USD", billing_interval: "month", seat_limit: 10, storage_limit_gb: 20 },
  { id: "plan-2", code: "growth", name: "Growth", price_amount: 149, currency_code: "USD", billing_interval: "month", seat_limit: 50, storage_limit_gb: 200 },
  { id: "plan-3", code: "scale", name: "Scale", price_amount: 399, currency_code: "USD", billing_interval: "month", seat_limit: 250, storage_limit_gb: 1_000 },
]

export const BILLING_OVERVIEW = {
  subscription: {
    id: "sub-1",
    status: "active",
    next_billing_date: isoDay(18),
    plan: BILLING_PLANS[1],
    usage: {
      seats_used: 24,
      seat_limit: 50,
      storage_used_gb: 84,
      storage_limit_gb: 200,
    },
  },
  payment_method: {
    id: "pm-card-1",
    provider: "stripe",
    brand: "Visa",
    last4: "4242",
    exp_month: 11,
    exp_year: 2029,
  },
  available_plans: BILLING_PLANS,
}

export const BILLING_INVOICE_ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: `binv-${i + 1}`,
  invoice_number: `BILL-2026-${String(12 - i).padStart(3, "0")}`,
  amount: 149,
  currency_code: "USD",
  status: i === 0 ? "open" : "paid",
  issued_at: isoDay(-i * 30),
  paid_at: i === 0 ? null : isoDay(-i * 30 + 2),
  download_url: "#",
}))

export const SETTINGS_COMPANY_PROFILE = {
  name: "Nucleus Demo Co.",
  website: "https://nucleus-demo.com",
  industry: "saas",
  stage: "series_a",
  team_size: "growing",
  onboarding_completed: true,
  options: {
    industries: ["saas", "marketplace", "fintech", "e_commerce", "healthtech", "edtech", "ai_ml", "other"],
    stages: ["idea", "pre_seed", "seed", "series_a", "series_b", "growth", "established"],
  },
}

export const NOTIFICATION_PREFERENCES: Row[] = [
  { id: "np-1", key: "leave_requests", title: "Leave requests", description: "When a team member submits leave", enabled: true },
  { id: "np-2", key: "approvals", title: "Approvals", description: "When an approval needs your decision", enabled: true },
  { id: "np-3", key: "invoice_paid", title: "Invoice paid", description: "When a customer settles an invoice", enabled: true },
  { id: "np-4", key: "contract_expiry", title: "Contract expiry", description: "30 days before a contract lapses", enabled: false },
  { id: "np-5", key: "weekly_digest", title: "Weekly digest", description: "A Monday summary of the week ahead", enabled: true },
  { id: "np-6", key: "product_updates", title: "Product updates", description: "New Nucleus features and releases", enabled: false },
]

/* -------------------------------------------------------------------------- */
/*                                Integrations                                */
/* -------------------------------------------------------------------------- */

const INTEGRATION_DEFS = [
  { provider: "stripe", label: "Stripe", description: "Sync payments and payouts", category: "Payments", connected: true },
  { provider: "quickbooks", label: "QuickBooks", description: "Two-way accounting sync", category: "Accounting", connected: true },
  { provider: "gusto", label: "Gusto", description: "Payroll and benefits", category: "People", connected: false },
  { provider: "github", label: "GitHub", description: "Link repositories to projects", category: "Engineering", connected: false },
  { provider: "notion", label: "Notion", description: "Publish docs and runbooks", category: "Productivity", connected: false },
  { provider: "slack", label: "Slack", description: "Channel notifications", category: "Productivity", connected: true },
  { provider: "google_workspace", label: "Google Workspace", description: "Directory and calendar sync", category: "Productivity", connected: false },
  { provider: "zapier", label: "Zapier", description: "Automate across 5,000 apps", category: "Automation", connected: false },
] as const

export const INTEGRATION_ROWS: Row[] = INTEGRATION_DEFS.map((def, i) => {
  const errored = def.provider === "quickbooks"
  const status = errored ? "error" : def.connected ? "connected" : "disconnected"
  return {
    id: def.provider,
    provider: def.provider,
    label: def.label,
    description: def.description,
    category: def.category,
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    is_connected: def.connected,
    connected_at: def.connected ? isoDateTime(-720 - i * 24) : null,
    disconnected_at: null,
    last_sync: {
      at: def.connected ? isoDateTime(-i - 2) : null,
      status: def.connected ? (errored ? "failed" : "success") : null,
      message: errored ? "Token expired — reconnect required." : null,
    },
    external_account_ref: def.connected ? `acct_${1_000 + i}` : null,
    settings: def.connected ? { environment: "live" } : {},
  }
})
