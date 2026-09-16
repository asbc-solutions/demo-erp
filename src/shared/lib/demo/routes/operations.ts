import { applyFilters, collection, defineCollection, paginate, updateRow } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import { OPS_PROJECT_ROWS, OPS_TASK_ROWS, OPS_VENDOR_ROWS } from "../seed/modules"
import { isoDay } from "../seed/faker"

defineCollection("operations/projects", () => [...OPS_PROJECT_ROWS])
defineCollection("operations/tasks", () => [...OPS_TASK_ROWS])
defineCollection("operations/vendors", () => [...OPS_VENDOR_ROWS])

const EXPIRING_WITHIN_DAYS = 60

export const operationsRoutes: DemoRoute[] = [
  // KPI routes must precede the generic list handler — `/projects/kpis` would
  // otherwise be read as `/projects/:id`.
  route("get", "/operations/projects/kpis", () => {
    const projects = collection("operations/projects")
    return {
      data: {
        active_projects: projects.filter((p) => p.status === "active").length,
        total_budget: projects.reduce((sum, p) => sum + Number(p.budget_amount), 0),
        total_spent: projects.reduce((sum, p) => sum + Number(p.spent_amount), 0),
        overdue_tasks: collection("operations/tasks").filter((t) => t.is_overdue).length,
      },
    }
  }),

  route("get", "/operations/vendors/kpis", () => {
    const vendors = collection("operations/vendors")
    return {
      data: {
        active_vendors: vendors.filter((v) => v.status === "active").length,
        monthly_vendor_spend: vendors
          .filter((v) => v.status === "active")
          .reduce((sum, v) => sum + Number(v.monthly_spend), 0),
        contracts_expiring_soon: vendors.filter(
          (v) =>
            Number(v.days_to_contract_end) >= 0 &&
            Number(v.days_to_contract_end) <= EXPIRING_WITHIN_DAYS,
        ).length,
        expiring_within_days: EXPIRING_WITHIN_DAYS,
      },
    }
  }),

  route("get", "/operations/projects", (req) => {
    const rows = applyFilters(collection("operations/projects"), {
      status: req.params.status,
      lead_employee_id: req.params.lead_employee_id,
      search: req.params.search,
    })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("get", "/operations/tasks", (req) => {
    const rows = applyFilters(collection("operations/tasks"), {
      project_id: req.params.project_id,
      status: req.params.status,
      priority: req.params.priority,
      assignee_id: req.params.assignee_id,
      search: req.params.search,
    })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("get", "/operations/vendors", (req) => {
    const rows = applyFilters(collection("operations/vendors"), {
      status: req.params.status,
      category: req.params.category,
      search: req.params.search,
    })
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("patch", "/operations/tasks/:id", (req) => {
    const row = updateRow("operations/tasks", req.vars.id, req.body)
    if (row && typeof req.body.status === "string") {
      row.status_label = req.body.status.replace(/_/g, " ")
      row.completed = req.body.status === "done"
      row.completed_at = req.body.status === "done" ? isoDay(0) : null
    }
    return { data: row ?? null }
  }),

  route("post", "/operations/vendors/:id/activate", (req) => ({
    data:
      updateRow("operations/vendors", req.vars.id, {
        status: "active",
        status_label: "Active",
        primary_action: "manage",
      }) ?? null,
  })),

  route("post", "/operations/vendors/:id/renew", (req) => {
    const contractEnd = String(req.body.contract_end ?? isoDay(365))
    const days = Math.round(
      (Date.parse(contractEnd) - Date.parse(isoDay(0))) / 86_400_000,
    )
    return {
      data:
        updateRow("operations/vendors", req.vars.id, {
          contract_end: contractEnd,
          days_to_contract_end: days,
          status: "active",
          status_label: "Active",
          primary_action: "manage",
        }) ?? null,
    }
  }),
]
