import { applyFilters, collection, defineCollection, findRow, paginate, updateRow } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  PM_CHANGE_REQUEST_ROWS,
  PM_DOCUMENT_ROWS,
  PM_EXPENSE_ROWS,
  PM_GATE_ROWS,
  PM_INVOICE_ROWS,
  PM_MATERIAL_ROWS,
  PM_MILESTONE_ROWS,
  PM_PHASE_ROWS,
  PM_PROJECT_ROWS,
  PM_RESOURCE_ROWS,
  PM_TASK_ROWS,
  buildMyActivity,
  buildMyCapacity,
  buildMyPriorities,
  buildMySummary,
  buildPmProjectStats,
} from "../seed/project-manger"
import { intBetween, isoDay, makeRandom, monthLabels } from "../seed/faker"

defineCollection("pm/projects", () => [...PM_PROJECT_ROWS])
defineCollection("pm/tasks", () => [...PM_TASK_ROWS])
defineCollection("pm/phases", () => [...PM_PHASE_ROWS])
defineCollection("pm/milestones", () => [...PM_MILESTONE_ROWS])
defineCollection("pm/resources", () => [...PM_RESOURCE_ROWS])
defineCollection("pm/documents", () => [...PM_DOCUMENT_ROWS])
defineCollection("pm/expenses", () => [...PM_EXPENSE_ROWS])
defineCollection("pm/invoices", () => [...PM_INVOICE_ROWS])
defineCollection("pm/gates", () => [...PM_GATE_ROWS])
defineCollection("pm/change-requests", () => [...PM_CHANGE_REQUEST_ROWS])
defineCollection("pm/materials", () => [...PM_MATERIAL_ROWS])

function byProject(collectionName: string, projectId: string) {
  return collection(collectionName).filter((row) => row.project_id === projectId)
}

function listOf(collectionName: string, params: Record<string, unknown>) {
  const rows = applyFilters(collection(collectionName), params)
  const { rows: page, meta } = paginate(rows, params)
  return { data: page, meta }
}

export const projectManagerRoutes: DemoRoute[] = [
  /* ------------------------------ My work ------------------------------- */

  route("get", "/pm/me/summary", () => ({ data: buildMySummary() })),
  route("get", "/pm/me/priorities", () => ({ data: buildMyPriorities() })),
  route("get", "/pm/me/capacity", () => ({ data: buildMyCapacity() })),
  route("get", "/pm/me/activity", () => ({ data: buildMyActivity() })),

  route("get", "/pm/me/milestones", () => ({
    data: collection("pm/milestones")
      .filter((m) => m.status === "pending")
      .slice(0, 8)
      .map((m) => {
        const days = Math.round(
          (Date.parse(String(m.target_date)) - Date.parse(isoDay(0))) / 86_400_000,
        )
        return {
          id: String(m.id),
          title: String(m.name),
          project_name: String(m.project_name),
          due_date: String(m.target_date),
          date_label: String(m.target_date),
          relative_label: days <= 0 ? "Overdue" : `in ${days}d`,
          urgent: days <= 14,
        }
      }),
  })),

  // Must precede `/pm/me/projects`.
  route("get", "/pm/me/projects/stats", () => {
    const mine = collection("pm/projects").slice(0, 6)
    return {
      data: {
        managed_count: mine.length,
        contributing_count: 4,
        following_count: 3,
        avg_health_pct: Math.round(
          mine.reduce((sum, p) => sum + Number(p.progress), 0) / Math.max(1, mine.length),
        ),
        avg_health_delta_pct: 3.2,
      },
    }
  }),

  route("get", "/pm/me/projects", (req) => {
    const memberships = ["managed", "contributing", "following"] as const
    const rows = collection("pm/projects")
      .slice(0, 10)
      .map((project, i) => ({ ...project, membership: memberships[i % 3] }))
    const membership = req.params.membership as string | undefined
    const filtered =
      membership && membership !== "all"
        ? rows.filter((r) => r.membership === membership)
        : rows
    const { rows: page, meta } = paginate(filtered, req.params)
    return { data: page, meta }
  }),

  /* ----------------------------- Projects ------------------------------- */

  // Must precede `/pm/projects/:id`.
  route("get", "/pm/projects/stats", () => ({ data: buildPmProjectStats() })),

  route("get", "/pm/portfolio/dashboard", () => {
    const projects = collection("pm/projects")
    return {
      data: {
        stats: buildPmProjectStats(),
        by_health: (["On Track", "At Risk", "Critical"] as const).map((health) => ({
          health,
          count: projects.filter((p) => p.health_status === health).length,
        })),
        budget_vs_spend: projects.slice(0, 8).map((p) => ({
          project_id: String(p.id),
          project_name: String(p.name),
          budget: Number(p.budget_amount),
          spent: Number(p.spent),
        })),
        monthly_progress: monthLabels(12).map((month, i) => ({
          month,
          planned: 8 * (i + 1),
          actual: Math.max(0, 8 * (i + 1) - intBetween(makeRandom(430_000 + i), 0, 14)),
        })),
      },
    }
  }),

  route("get", "/pm/projects", (req) => listOf("pm/projects", req.params)),

  route("get", "/pm/projects/:id/hierarchy", (req) => {
    const phases = byProject("pm/phases", req.vars.id)
    return {
      data: {
        project_id: req.vars.id,
        timelines: [
          {
            id: `pmtl-${req.vars.id}`,
            project_id: req.vars.id,
            name: "Master Timeline",
            sequence: 1,
            status: "active",
            status_label: "Active",
            is_active: true,
            phases: phases.map((phase) => ({
              ...phase,
              tasks: collection("pm/tasks").filter((t) => t.phase_id === phase.id),
            })),
          },
        ],
      },
    }
  }),

  route("get", "/pm/projects/:id/milestones", (req) => ({
    data: byProject("pm/milestones", req.vars.id),
  })),
  route("get", "/pm/projects/:id/gates", (req) => ({
    data: byProject("pm/gates", req.vars.id),
  })),
  route("get", "/pm/projects/:id/change-requests", (req) => ({
    data: byProject("pm/change-requests", req.vars.id),
  })),
  route("get", "/pm/projects/:id/invoices", (req) => ({
    data: byProject("pm/invoices", req.vars.id),
  })),
  route("get", "/pm/projects/:id/materials", (req) => ({
    data: byProject("pm/materials", req.vars.id),
  })),
  route("get", "/pm/projects/:id/baselines", (req) => ({
    data: [
      {
        id: `pmb-${req.vars.id}`,
        project_id: req.vars.id,
        name: "Baseline v1",
        description: "Approved at release",
        snapshot: { captured_at: isoDay(-120), project_id: req.vars.id, tasks: [] },
        created_by: 1,
        created_at: isoDay(-120),
      },
    ],
  })),

  route("get", "/pm/projects/:id/stakeholders", (req) => ({
    data: collection("pm/resources")
      .slice(0, 6)
      .map((resource, i) => ({
        id: `pmsk-${req.vars.id}-${i + 1}`,
        project_id: req.vars.id,
        employee_id: String(resource.employee_id),
        employee_name: String(resource.name),
        role: (["sponsor", "manager", "team_lead", "member", "reviewer", "customer"] as const)[i],
        influence_level: (["critical", "high", "high", "medium", "low", "medium"] as const)[i],
        notes: null,
        is_active: true,
      })),
  })),

  route("get", "/pm/projects/:id/utilization", () => ({
    data: collection("pm/resources").slice(0, 10).map((resource) => ({
      employee_id: String(resource.employee_id),
      employee_number: String(resource.employee_number),
      name: String(resource.name),
      total_allocation_pct: Number(resource.allocation_pct),
      total_planned_hours: intBetween(makeRandom(440_000), 40, 320),
      assignment_count: intBetween(makeRandom(441_000), 1, 6),
    })),
  })),

  route("get", "/pm/projects/:id/evm", (req) => {
    const project = findRow("pm/projects", req.vars.id)
    const budget = Number(project?.budget_amount ?? 1_000_000)
    const progress = Number(project?.progress ?? 50) / 100
    const pv = Math.round(budget * Math.min(1, progress + 0.08))
    const ev = Math.round(budget * progress)
    const ac = Number(project?.spent ?? Math.round(budget * progress))
    return {
      data: {
        project_id: req.vars.id,
        bac: budget,
        pv,
        ev,
        ac,
        cpi: ac ? Math.round((ev / ac) * 100) / 100 : 1,
        spi: pv ? Math.round((ev / pv) * 100) / 100 : 1,
        cv: ev - ac,
        sv: ev - pv,
        eac: ac && ev ? Math.round(budget / (ev / ac)) : budget,
      },
    }
  }),

  route("get", "/pm/projects/:id/critical-path", (req) => ({
    data: byProject("pm/tasks", req.vars.id)
      .slice(0, 8)
      .map((task, i) => ({
        task_id: String(task.id),
        title: String(task.title),
        duration_days: intBetween(makeRandom(450_000 + i), 2, 25),
        early_start: i * 5,
        early_finish: i * 5 + 5,
        late_start: i * 5,
        late_finish: i * 5 + 5,
        total_float: 0,
      })),
  })),

  route("get", "/pm/projects/:id/closure", (req) => ({
    data: {
      project_id: req.vars.id,
      technically_complete: false,
      locked: false,
      items: [
        { id: "cl-1", label: "All tasks closed", complete: true },
        { id: "cl-2", label: "Final invoice issued", complete: false },
        { id: "cl-3", label: "Documents archived", complete: false },
        { id: "cl-4", label: "Lessons learned recorded", complete: false },
      ],
    },
  })),

  route("get", "/pm/projects/:id/billing-plan", (req) => ({
    data: byProject("pm/milestones", req.vars.id)
      .filter((m) => m.type === "billing")
      .map((m) => ({
        id: String(m.id),
        milestone_name: String(m.name),
        amount: Number(m.amount ?? 0),
        currency_code: "USD",
        due_date: String(m.target_date),
        status: String(m.status),
      })),
  })),

  route("get", "/pm/projects/:id/revenue-summary", (req) => {
    const invoices = byProject("pm/invoices", req.vars.id)
    const billed = invoices.reduce((sum, i) => sum + Number(i.amount), 0)
    const collected = invoices.reduce((sum, i) => sum + Number(i.amount_paid), 0)
    return {
      data: {
        project_id: req.vars.id,
        billed,
        collected,
        outstanding: billed - collected,
        currency_code: "USD",
      },
    }
  }),

  route("get", "/pm/projects/:id/messages/activity", () => ({ data: [] })),

  /* ------------------------------- Lists -------------------------------- */

  route("get", "/pm/tasks", (req) => listOf("pm/tasks", req.params)),
  route("get", "/pm/documents", (req) => listOf("pm/documents", req.params)),
  route("get", "/pm/expenses", (req) => listOf("pm/expenses", req.params)),
  route("get", "/pm/invoices", (req) => listOf("pm/invoices", req.params)),
  route("get", "/pm/gates", (req) => listOf("pm/gates", req.params)),
  route("get", "/pm/change-requests", (req) => listOf("pm/change-requests", req.params)),
  route("get", "/pm/schedule", (req) => listOf("pm/tasks", { ...req.params, per_page: 200 })),

  // Must precede `/pm/resources/:id`.
  route("get", "/pm/resources/summary", () => {
    const resources = collection("pm/resources")
    const over = resources.filter((r) => Number(r.allocation_pct) > 100).length
    return {
      data: {
        total_resources: resources.length,
        over_allocated: over,
        under_allocated: resources.filter((r) => Number(r.allocation_pct) < 60).length,
        avg_allocation_pct: Math.round(
          resources.reduce((sum, r) => sum + Number(r.allocation_pct), 0) /
            Math.max(1, resources.length),
        ),
      },
    }
  }),

  route("get", "/pm/resources/heatmap", () => ({
    data: collection("pm/resources").map((resource, i) => ({
      employee_id: String(resource.employee_id),
      name: String(resource.name),
      weeks: Array.from({ length: 12 }, (_, w) => ({
        week: `W${w + 1}`,
        allocation_pct: intBetween(makeRandom(460_000 + i * 13 + w), 10, 130),
      })),
    })),
  })),

  route("get", "/pm/resources", (req) => listOf("pm/resources", req.params)),

  route("get", "/pm/resources/:id/capacity", (req) => ({
    data: {
      employee_id: req.vars.id,
      period: { from: isoDay(0), to: isoDay(84) },
      total_allocated_pct: 85,
      available_pct: 15,
      assignments: collection("pm/tasks")
        .filter((t) => t.assignee_id === req.vars.id)
        .slice(0, 6)
        .map((task, i) => ({
          assignment_id: `pma-${req.vars.id}-${i + 1}`,
          task_id: String(task.id),
          task_title: String(task.title),
          phase_name: String(task.phase_name),
          timeline_name: "Master Timeline",
          project_id: String(task.project_id),
          project_name:
            String(findRow("pm/projects", String(task.project_id))?.name ?? ""),
          allocation_pct: intBetween(makeRandom(470_000 + i), 10, 50),
          planned_hours: Number(task.planned_hours),
          start_date: String(task.start_date),
          end_date: String(task.due_date),
        })),
    },
  })),

  route("get", "/pm/employees/:id/workload", (req) => {
    const tasks = collection("pm/tasks").filter((t) => t.assignee_id === req.vars.id)
    return {
      data: {
        employee_id: req.vars.id,
        total_planned_hours: tasks.reduce((sum, t) => sum + Number(t.planned_hours), 0),
        total_actual_hours: tasks.reduce((sum, t) => sum + Number(t.actual_hours), 0),
        tasks: tasks.map((task) => ({
          ...task,
          project_name:
            String(findRow("pm/projects", String(task.project_id))?.name ?? ""),
          timeline_name: "Master Timeline",
        })),
      },
    }
  }),

  /* --------------------------- Cost & budget ---------------------------- */

  route("get", "/pm/costbudget/dashboard", () => {
    const projects = collection("pm/projects")
    const budget = projects.reduce((sum, p) => sum + Number(p.budget_amount), 0)
    const spent = projects.reduce((sum, p) => sum + Number(p.spent), 0)
    return {
      data: {
        total_budget: budget,
        total_spent: spent,
        total_committed: Math.round(spent * 0.18),
        remaining: budget - spent,
        currency_code: "USD",
        variance_pct: Math.round(((budget - spent) / budget) * 1000) / 10,
      },
    }
  }),

  route("get", "/pm/costbudget/cost-mix", () => ({
    data: [
      { id: "labour", label: "Labour", amount: 4_280_000, color: "#6366f1" },
      { id: "materials", label: "Materials", amount: 3_140_000, color: "#10b981" },
      { id: "subcontract", label: "Subcontract", amount: 2_050_000, color: "#f59e0b" },
      { id: "equipment", label: "Equipment", amount: 980_000, color: "#3b82f6" },
      { id: "other", label: "Other", amount: 420_000, color: "#ef4444" },
    ],
  })),

  route("get", "/pm/costbudget/waterfall", () => ({
    data: [
      { id: "budget", label: "Original budget", value: 12_400_000, type: "total" },
      { id: "approved", label: "Approved changes", value: 640_000, type: "increase" },
      { id: "committed", label: "Committed", value: -3_180_000, type: "decrease" },
      { id: "actuals", label: "Actual spend", value: -6_720_000, type: "decrease" },
      { id: "remaining", label: "Remaining", value: 3_140_000, type: "total" },
    ],
  })),

  route("get", "/pm/costbudget/expenses/categories", () => ({
    data: ["Travel", "Materials", "Equipment", "Subcontractor", "Permits"].map(
      (label, i) => ({
        id: `pmec-${i + 1}`,
        label,
        amount: collection("pm/expenses")
          .filter((e) => e.category === label)
          .reduce((sum, e) => sum + Number(e.amount), 0),
      }),
    ),
  })),

  /* ------------------------------ Billing -------------------------------- */

  route("get", "/pm/billing/milestones", () => ({
    data: collection("pm/milestones").filter((m) => m.type === "billing"),
  })),

  route("get", "/pm/billing/revenue-summary", () => {
    const invoices = collection("pm/invoices")
    const billed = invoices.reduce((sum, i) => sum + Number(i.amount), 0)
    const collected = invoices.reduce((sum, i) => sum + Number(i.amount_paid), 0)
    return {
      data: {
        billed,
        collected,
        outstanding: billed - collected,
        overdue: invoices
          .filter((i) => i.status === "overdue")
          .reduce((sum, i) => sum + Number(i.amount), 0),
        currency_code: "USD",
        monthly: monthLabels(12).map((month, i) => ({
          month,
          billed: Math.round(billed / 12) + i * 4_000,
          collected: Math.round(collected / 12) + i * 3_200,
        })),
      },
    }
  }),

  /* ---------------------- Inventory, WBS, closure ------------------------ */

  route("get", "/pm/inventory/summary", () => {
    const materials = collection("pm/materials")
    return {
      data: {
        total_items: materials.length,
        shortfall_items: materials.filter((m) => Number(m.quantity_shortfall) > 0).length,
        out_of_stock: materials.filter((m) => m.status === "out_of_stock").length,
        total_value: materials.reduce(
          (sum, m) => sum + Number(m.quantity_on_hand) * Number(m.unit_cost),
          0,
        ),
        currency_code: "USD",
        items: materials,
      },
    }
  }),

  route("get", "/pm/wbs/summary", () => ({
    data: {
      projects: collection("pm/projects").length,
      phases: collection("pm/phases").length,
      tasks: collection("pm/tasks").length,
      completed_tasks: collection("pm/tasks").filter((t) => t.status === "done").length,
    },
  })),

  route("get", "/pm/closure/summary", () => ({
    data: {
      ready_to_close: collection("pm/projects").filter(
        (p) => p.status === "technically_complete",
      ).length,
      closed: collection("pm/projects").filter((p) => p.status === "closed").length,
      open_items: 14,
    },
  })),

  route("get", "/pm/activity", () => ({ data: buildMyActivity() })),
  route("get", "/pm/collaboration/context", () => ({
    data: { channels: [], threads: [], participants: [] },
  })),
  route("get", "/pm/search/messages", () => ({ data: [] })),
  route("get", "/pm/project-templates", () => ({
    data: [
      { id: "tpl-1", name: "Construction — Standard", phases: 6, tasks: 48 },
      { id: "tpl-2", name: "Software Delivery", phases: 4, tasks: 32 },
      { id: "tpl-3", name: "Facility Upgrade", phases: 5, tasks: 40 },
    ],
  })),

  route("get", "/pm/timesheets/current", () => ({
    data: {
      week_of: isoDay(-3),
      submitted: false,
      total_hours: 28,
      entries: collection("pm/tasks")
        .slice(0, 5)
        .map((task, i) => ({
          id: `ts-${i + 1}`,
          task_id: String(task.id),
          task_title: String(task.title),
          project_name:
            String(findRow("pm/projects", String(task.project_id))?.name ?? ""),
          hours: [8, 6, 6, 4, 4][i],
          billable: i % 2 === 0,
          log_date: isoDay(-i),
        })),
    },
  })),

  /* ------------------------- Task & node detail -------------------------- */

  route("get", "/pm/tasks/:id/assignees", (req) => {
    const task = findRow("pm/tasks", req.vars.id)
    const assignee = task?.assignee as { id: string; name: string } | undefined
    if (!assignee) return { data: [] }
    return {
      data: [
        {
          assignee_id: `pmas-${req.vars.id}`,
          task_id: req.vars.id,
          employee_id: assignee.id,
          employee_name: assignee.name,
          role: "owner",
          is_active: true,
        },
      ],
    }
  }),

  route("get", "/pm/tasks/:id/dependencies", (req) => {
    const task = findRow("pm/tasks", req.vars.id)
    if (!task) return { data: [] }
    const siblings = collection("pm/tasks")
      .filter((t) => t.phase_id === task.phase_id && t.id !== task.id)
      .slice(0, 2)
    return {
      data: siblings.map((other, i) => ({
        id: `pmdep-${req.vars.id}-${i + 1}`,
        predecessor_task_id: String(other.id),
        successor_task_id: req.vars.id,
        type: "FS",
        type_label: "Finish to start",
        lag_days: 0,
        created_at: isoDay(-30),
      })),
    }
  }),

  route("get", "/pm/tasks/:id/rollup", (req) => {
    const task = findRow("pm/tasks", req.vars.id)
    return {
      data: {
        task_id: req.vars.id,
        planned_hours: Number(task?.planned_hours ?? 0),
        actual_hours: Number(task?.actual_hours ?? 0),
        percent_complete: Number(task?.percent_complete ?? 0),
        subtask_count: 0,
        subtasks_done: 0,
      },
    }
  }),

  route("get", "/pm/phases/:id/rollup", (req) => {
    const tasks = collection("pm/tasks").filter((t) => t.phase_id === req.vars.id)
    const planned = tasks.reduce((sum, t) => sum + Number(t.planned_hours), 0)
    const actual = tasks.reduce((sum, t) => sum + Number(t.actual_hours), 0)
    return {
      data: {
        phase_id: req.vars.id,
        task_count: tasks.length,
        tasks_done: tasks.filter((t) => t.status === "done").length,
        planned_hours: planned,
        actual_hours: actual,
        percent_complete: planned ? Math.round((actual / planned) * 100) : 0,
      },
    }
  }),

  route("get", "/pm/timelines/:id/rollup", (req) => {
    const tasks = collection("pm/tasks")
    const planned = tasks.reduce((sum, t) => sum + Number(t.planned_hours), 0)
    const actual = tasks.reduce((sum, t) => sum + Number(t.actual_hours), 0)
    return {
      data: {
        timeline_id: req.vars.id,
        phase_count: collection("pm/phases").length,
        task_count: tasks.length,
        planned_hours: planned,
        actual_hours: actual,
        percent_complete: planned ? Math.round((actual / planned) * 100) : 0,
      },
    }
  }),

  route("get", "/pm/baselines/:id", (req) => ({
    data: {
      id: req.vars.id,
      project_id: "pmp-1",
      name: "Baseline v1",
      description: "Approved at release",
      snapshot: {
        captured_at: isoDay(-120),
        project_id: "pmp-1",
        tasks: collection("pm/tasks")
          .slice(0, 10)
          .map((t) => ({
            task_id: String(t.id),
            title: String(t.title),
            planned_hours: String(t.planned_hours),
            actual_hours: String(t.actual_hours),
            percent_complete: String(t.percent_complete),
            start_date: t.start_date as string | null,
            due_date: t.due_date as string | null,
            status: String(t.status),
          })),
      },
      created_by: 1,
      created_at: isoDay(-120),
    },
  })),

  route("get", "/pm/project-templates/:id", (req) => ({
    data: {
      id: req.vars.id,
      name: "Construction — Standard",
      phases: 6,
      tasks: 48,
      description: "Six-phase delivery template with standard gates.",
    },
  })),

  route("get", "/pm/projects/:id/budgets", (req) => {
    const project = findRow("pm/projects", req.vars.id)
    const budget = Number(project?.budget_amount ?? 0)
    const categories = ["Labour", "Materials", "Subcontract", "Equipment", "Contingency"]
    const weights = [0.38, 0.26, 0.18, 0.11, 0.07]
    return {
      data: categories.map((label, i) => {
        const allocated = Math.round(budget * weights[i])
        const spent = Math.round(allocated * (0.3 + (i % 4) * 0.18))
        return {
          id: `pmbud-${req.vars.id}-${i + 1}`,
          project_id: req.vars.id,
          category: label,
          allocated_amount: allocated,
          committed_amount: Math.round(allocated * 0.15),
          spent_amount: spent,
          remaining_amount: allocated - spent,
          currency_code: "USD",
        }
      }),
    }
  }),

  // `/pm/nodes/:id/*` addresses a task or phase generically.
  route("get", "/pm/nodes/:id/cost", (req) => ({
    data: {
      node_id: req.vars.id,
      planned_cost: 180_000,
      committed_cost: 42_000,
      actual_cost: 121_500,
      remaining_cost: 58_500,
      currency_code: "USD",
    },
  })),

  route("get", "/pm/nodes/:id/cost-plans", (req) => ({
    data: ["Labour", "Materials", "Equipment"].map((label, i) => ({
      id: `pmcp-${req.vars.id}-${i + 1}`,
      node_id: req.vars.id,
      category: label,
      planned_amount: [90_000, 60_000, 30_000][i],
      currency_code: "USD",
      created_at: isoDay(-90),
    })),
  })),

  route("get", "/pm/nodes/:id/commitments", (req) => ({
    data: [
      {
        id: `pmcm-${req.vars.id}-1`,
        node_id: req.vars.id,
        vendor_name: "Atlas Manufacturing",
        reference: "PO-4821",
        amount: 42_000,
        currency_code: "USD",
        status: "open",
        committed_at: isoDay(-45),
      },
    ],
  })),

  route("get", "/pm/nodes/:id/documents", (req) => ({
    data: collection("pm/documents").slice(0, 3).map((doc) => ({
      ...doc,
      node_id: req.vars.id,
    })),
  })),

  route("get", "/pm/nodes/:id/messages", (req) => ({
    data: buildMyActivity()
      .slice(0, 5)
      .map((entry, i) => ({
        id: `pmmsg-${req.vars.id}-${i + 1}`,
        node_id: req.vars.id,
        author: "Demo Admin",
        body: String(entry.text),
        created_at: String(entry.occurred_at),
      })),
  })),

  /* ------------------------ Governance transitions ----------------------- */

  route("post", "/pm/gates/:id/approve", (req) => ({
    data: updateRow("pm/gates", req.vars.id, { status: "passed", status_label: "Passed" }) ?? null,
  })),
  route("post", "/pm/gates/:id/reject", (req) => ({
    data: updateRow("pm/gates", req.vars.id, { status: "blocked", status_label: "Blocked" }) ?? null,
  })),
  route("post", "/pm/gates/:id/submit", (req) => ({
    data: updateRow("pm/gates", req.vars.id, { status: "submitted", status_label: "Submitted" }) ?? null,
  })),
  route("post", "/pm/gates/:id/request-info", (req) => ({
    data: updateRow("pm/gates", req.vars.id, { status: "open", status_label: "Open" }) ?? null,
  })),

  route("post", "/pm/change-requests/:id/approve", (req) => ({
    data: updateRow("pm/change-requests", req.vars.id, { status: "approved", status_label: "Approved" }) ?? null,
  })),
  route("post", "/pm/change-requests/:id/reject", (req) => ({
    data: updateRow("pm/change-requests", req.vars.id, { status: "rejected", status_label: "Rejected" }) ?? null,
  })),
  route("post", "/pm/change-requests/:id/submit", (req) => ({
    data: updateRow("pm/change-requests", req.vars.id, { status: "submitted", status_label: "Submitted" }) ?? null,
  })),

  route("patch", "/pm/tasks/:id/status", (req) => {
    const status = String(req.body.status ?? "todo")
    return {
      data:
        updateRow("pm/tasks", req.vars.id, {
          status,
          status_label: status.replace(/_/g, " "),
          percent_complete: status === "done" ? 100 : undefined,
        }) ?? null,
    }
  }),

  route("post", "/pm/expenses/:id/submit", (req) => ({
    data: updateRow("pm/expenses", req.vars.id, { status: "submitted", status_label: "Submitted" }) ?? null,
  })),

  route("post", "/pm/documents/:id/approve", (req) => ({
    data: updateRow("pm/documents", req.vars.id, { status: "approved", status_label: "Approved" }) ?? null,
  })),
  route("post", "/pm/documents/:id/reject", (req) => ({
    data: updateRow("pm/documents", req.vars.id, { status: "rejected", status_label: "Rejected" }) ?? null,
  })),
  route("get", "/pm/documents/:id/versions", (req) => ({
    data: [
      { id: `${req.vars.id}-v1`, version: "v1.0", uploaded_at: isoDay(-40), uploaded_by: "Demo Admin" },
      { id: `${req.vars.id}-v2`, version: "v2.0", uploaded_at: isoDay(-12), uploaded_by: "Demo Admin" },
    ],
  })),

  route("post", "/pm/people/resolve", (req) => {
    const ids = (req.body.employee_ids as string[]) ?? []
    return {
      data: collection("pm/resources")
        .filter((r) => ids.length === 0 || ids.includes(String(r.employee_id)))
        .map((r) => ({
          id: String(r.employee_id),
          name: String(r.name),
          email: String(r.email_work),
        })),
    }
  }),
]
