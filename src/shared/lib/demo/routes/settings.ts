import { applyFilters, collection, defineCollection, paginate, removeRow, updateRow, type Row } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  BILLING_INVOICE_ROWS,
  BILLING_OVERVIEW,
  BILLING_PLANS,
  NOTIFICATION_PREFERENCES,
  ROLE_ROWS,
  SETTINGS_COMPANY_PROFILE,
  TEAM_MEMBER_ROWS,
} from "../seed/modules"
import { emailFor, isoDateTime, isoDay } from "../seed/faker"

defineCollection("settings/team", () => [...TEAM_MEMBER_ROWS])

/** Resources shown in the role permission matrix, with their default level. */
const ROLE_PERMISSION_RESOURCES = [
  { resource: "command_center", action: "view", description: "Command Center dashboard" },
  { resource: "finance.overview", action: "view", description: "Finance overview" },
  { resource: "finance.receivables", action: "manage", description: "Finance receivables" },
  { resource: "finance.payables", action: "manage", description: "Finance payables" },
  { resource: "finance.banking", action: "manage", description: "Finance banking" },
  { resource: "finance.ledger", action: "manage", description: "Finance ledger" },
  { resource: "finance.close", action: "manage", description: "Finance period close" },
  { resource: "finance.tax", action: "manage", description: "Finance tax & compliance" },
  { resource: "finance.assets", action: "manage", description: "Finance fixed assets" },
  { resource: "finance.planning", action: "manage", description: "Finance planning" },
  { resource: "finance.reports", action: "view", description: "Finance reporting" },
  { resource: "finance.configuration", action: "manage", description: "Finance configuration" },
  { resource: "sales.customer", action: "manage", description: "Sales customers" },
  { resource: "sales.quotation", action: "manage", description: "Sales quotations" },
  { resource: "sales.order", action: "manage", description: "Sales orders" },
  { resource: "sales.invoice", action: "manage", description: "Sales invoices" },
  { resource: "sales.export", action: "export", description: "Sales data export" },
  { resource: "operations.projects", action: "manage", description: "Operations projects" },
  { resource: "operations.tasks", action: "manage", description: "Operations tasks" },
  { resource: "operations.vendors", action: "manage", description: "Operations vendors" },
  { resource: "compliance.policies", action: "manage", description: "Compliance policies" },
  { resource: "compliance.rules", action: "manage", description: "Compliance rules" },
  { resource: "compliance.audit", action: "view", description: "Compliance audit log" },
  { resource: "settings.company", action: "manage", description: "Company profile" },
  { resource: "settings.team", action: "manage", description: "Team management" },
  { resource: "settings.billing", action: "manage", description: "Billing and plans" },
] as const

const LEVEL_LABELS: Record<string, string> = {
  none: "No access",
  read: "Read only",
  approval_required: "Approval required",
  write: "Full access",
}

/** Per-role overrides, so the matrix is not uniformly "write" for every role. */
const rolePermissionState = new Map<string, Record<string, string>>()

function permissionsForRole(roleId: string): Record<string, string> {
  const existing = rolePermissionState.get(roleId)
  if (existing) return existing

  const role = ROLE_ROWS.find((r) => String(r.id) === roleId)
  const name = String(role?.name ?? "")
  const levels: Record<string, string> = {}
  for (const [index, entry] of ROLE_PERMISSION_RESOURCES.entries()) {
    levels[entry.resource] =
      name === "Owner"
        ? "write"
        : name === "Employee"
          ? index < 2
            ? "read"
            : "none"
          : (["write", "read", "approval_required", "write"] as const)[index % 4]
  }
  rolePermissionState.set(roleId, levels)
  return levels
}

function toRoleDto(role: Row) {
  return {
    id: String(role.id),
    role_name: String(role.name),
    description: String(role.description),
    user_count: Number(role.member_count),
    is_active: true,
    is_system: Boolean(role.is_system),
    created_at: isoDateTime(-8_760),
  }
}

export const settingsRoutes: DemoRoute[] = [
  /* -------------------------------- Roles -------------------------------- */

  route("get", "/roles", () => ({ data: ROLE_ROWS.map(toRoleDto) })),

  route("get", "/roles/:id/permissions", (req) => {
    const role = ROLE_ROWS.find((r) => String(r.id) === req.vars.id)
    const levels = permissionsForRole(req.vars.id)
    return {
      data: {
        role: {
          id: req.vars.id,
          role_name: String(role?.name ?? "Role"),
          user_count: Number(role?.member_count ?? 0),
          is_active: true,
        },
        permissions: ROLE_PERMISSION_RESOURCES.map((entry, i) => ({
          permission_id: `perm-${req.vars.id}-${i + 1}`,
          resource: entry.resource,
          action: entry.action,
          description: entry.description,
          permission_level: levels[entry.resource],
          permission_level_label: LEVEL_LABELS[levels[entry.resource]],
        })),
      },
    }
  }),

  route("put", "/roles/:id/permissions", (req) => {
    const levels = permissionsForRole(req.vars.id)
    const updates = (req.body.permissions as Array<{ resource: string; permission_level: string }>) ?? []
    for (const update of updates) levels[update.resource] = update.permission_level

    return {
      data: ROLE_PERMISSION_RESOURCES.map((entry, i) => ({
        permission_id: `perm-${req.vars.id}-${i + 1}`,
        resource: entry.resource,
        action: entry.action,
        description: entry.description,
        permission_level: levels[entry.resource],
        permission_level_label: LEVEL_LABELS[levels[entry.resource]],
      })),
    }
  }),

  /* -------------------------------- Team --------------------------------- */

  // Must precede `/settings/team/:id`.
  route("get", "/settings/team/assignable-roles", () => ({ data: ROLE_ROWS })),

  route("get", "/settings/team", (req) => {
    let rows = collection("settings/team")
    if (req.params.role_id) rows = rows.filter((m) => m.role_id === req.params.role_id)
    if (req.params.is_active !== undefined) {
      const want = String(req.params.is_active) === "true"
      rows = rows.filter((m) => Boolean(m.is_active) === want)
    }
    rows = applyFilters(rows, { search: req.params.search })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("post", "/settings/team/invite", (req) => {
    const name = String(req.body.name ?? "New Member")
    const roleId = String(req.body.role_id ?? "role-5")
    const role = ROLE_ROWS.find((r) => String(r.id) === roleId)
    const member: Row = {
      id: Date.now(),
      name,
      email: String(req.body.email ?? emailFor(name)),
      initials: name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      is_active: true,
      employee_id: null,
      roles: [{ id: roleId, name: String(role?.name ?? "Employee") }],
      role_id: roleId,
      created_at: isoDateTime(0),
    }
    collection("settings/team").unshift(member)
    return { data: member }
  }),

  route("patch", "/settings/team/:id", (req) => {
    const roleIds = (req.body.role_ids as string[]) ?? []
    const roles = roleIds.map((id) => {
      const role = ROLE_ROWS.find((r) => String(r.id) === id)
      return { id, name: String(role?.name ?? "Employee") }
    })
    return {
      data:
        updateRow("settings/team", req.vars.id, {
          roles,
          role_id: roleIds[0] ?? null,
        }) ?? null,
    }
  }),

  route("delete", "/settings/team/:id", (req) => {
    const member = updateRow("settings/team", req.vars.id, { is_active: false })
    if (!member) removeRow("settings/team", req.vars.id)
    return { data: { success: true, message: "Member deactivated." } }
  }),

  /* ----------------------------- Company --------------------------------- */

  route("get", "/settings/company-profile", () => ({
    data: { ...SETTINGS_COMPANY_PROFILE },
  })),

  route("put", "/settings/company-profile", (req) => {
    Object.assign(SETTINGS_COMPANY_PROFILE, req.body)
    // The update result omits `options` — it is only sent on the initial read.
    const rest = { ...SETTINGS_COMPANY_PROFILE } as Partial<
      typeof SETTINGS_COMPANY_PROFILE
    >
    delete rest.options
    return { data: rest }
  }),

  /* ----------------------------- Billing --------------------------------- */

  // Must precede `/settings/billing`.
  route("get", "/settings/billing/invoices", () => ({ data: BILLING_INVOICE_ROWS })),
  route("get", "/settings/billing/invoices/:id/download", () => ({
    data: { download_url: "#" },
  })),

  route("get", "/settings/billing", () => ({ data: BILLING_OVERVIEW })),

  route("post", "/settings/billing/change-plan", (req) => {
    const plan = BILLING_PLANS.find((p) => String(p.id) === String(req.body.plan_id))
    if (plan && BILLING_OVERVIEW.subscription) {
      BILLING_OVERVIEW.subscription.plan = plan
      BILLING_OVERVIEW.subscription.next_billing_date = isoDay(30)
    }
    return { data: BILLING_OVERVIEW }
  }),

  route("put", "/settings/billing/payment-method", (req) => {
    if (BILLING_OVERVIEW.payment_method) {
      Object.assign(BILLING_OVERVIEW.payment_method, req.body)
    }
    return { data: BILLING_OVERVIEW.payment_method }
  }),

  /* -------------------------- Notifications ------------------------------ */

  route("get", "/settings/notifications/preferences", () => ({
    data: NOTIFICATION_PREFERENCES,
  })),

  route("put", "/settings/notifications/preferences", (req) => {
    const updates = (req.body.preferences as Array<{ key: string; enabled: boolean }>) ?? []
    for (const update of updates) {
      const pref = NOTIFICATION_PREFERENCES.find((p) => p.key === update.key)
      if (pref) pref.enabled = update.enabled
    }
    return { data: NOTIFICATION_PREFERENCES }
  }),
]
