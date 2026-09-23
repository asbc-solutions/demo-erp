import { applyFilters, collection, defineCollection, findRow, paginate, updateRow, type Row } from "../demo-db"
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
// Registered so `PATCH /pm/closure-items/:id` persists a tick via the adapter's
// generic update handler instead of falling through to the empty fallback.
defineCollection("pm/closure-items", () => buildClosureItems())

function byProject(collectionName: string, projectId: string) {
  return collection(collectionName).filter((row) => row.project_id === projectId)
}

function listOf(collectionName: string, params: Record<string, unknown>) {
  const rows = applyFilters(collection(collectionName), params)
  const { rows: page, meta } = paginate(rows, params)
  return { data: page, meta }
}

/** Seed `category` values → the `DocumentCategory` keys the UI switches on. */
const DOCUMENT_CATEGORY_KEYS: Record<string, string> = {
  Drawings: "drawing",
  Contracts: "contract",
  Reports: "report",
  Permits: "permit",
  Specifications: "specification",
  Minutes: "meeting_minutes",
}

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  drawing: "Drawings",
  contract: "Contracts",
  report: "Reports",
  permit: "Permits",
  specification: "Specifications",
  meeting_minutes: "Meeting Minutes",
  other: "Other",
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function humanize(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** The fixed 15-point closure checklist, per project. */
const CLOSURE_TEMPLATE: ReadonlyArray<{ category: string; label: string }> = [
  { category: "delivery", label: "All tasks closed" },
  { category: "delivery", label: "Punch list cleared" },
  { category: "delivery", label: "Client acceptance signed" },
  { category: "delivery", label: "Handover walkthrough completed" },
  { category: "commercial", label: "Final invoice issued" },
  { category: "commercial", label: "Retention released" },
  { category: "commercial", label: "Change orders reconciled" },
  { category: "commercial", label: "Final cost report approved" },
  { category: "documentation", label: "Documents archived" },
  { category: "documentation", label: "As-built drawings filed" },
  { category: "documentation", label: "Warranties handed over" },
  { category: "documentation", label: "Permits closed out" },
  { category: "team", label: "Lessons learned recorded" },
  { category: "team", label: "Resources released" },
  { category: "team", label: "Subcontractors demobilised" },
]

function buildClosureItems(): Row[] {
  return PM_PROJECT_ROWS.flatMap((project) =>
    CLOSURE_TEMPLATE.map((entry, index) => {
      // Deterministic so a reload doesn't shuffle which items are ticked.
      const isComplete = (index + Number(project.phases_count ?? 0)) % 3 === 0
      return {
        id: `cli-${project.id}-${index + 1}`,
        project_id: String(project.id),
        category: entry.category,
        category_label: humanize(entry.category),
        label: entry.label,
        assignee_label: index % 4 === 0 ? String(project.manager_name ?? "") || null : null,
        sequence: index + 1,
        is_complete: isComplete,
        completed_at: isComplete ? isoDay(-((index % 9) + 1)) : null,
      }
    }),
  )
}

function closureItemsFor(projectId: string) {
  return collection("pm/closure-items")
    .filter((item) => item.project_id === projectId)
    .map((item) => ({ ...item, is_complete: item.is_complete === true }))
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

  // `PortfolioDashboard` — the Reports & Analytics page reads `kpis`,
  // `by_status`, `by_type`, `trends`, `financials` and `projects` unguarded
  // (`data.kpis[key]` at reports-analytics-module.tsx:110), so the old
  // `{stats, by_health, …}` shape threw as soon as the query resolved.
  route("get", "/pm/portfolio/dashboard", () => {
    const projects = collection("pm/projects")
    const total = projects.length
    const share = (count: number) =>
      total ? Math.round((count / total) * 1000) / 10 : 0

    const statuses = [...new Set(projects.map((p) => String(p.status ?? "unknown")))]
    const types = [...new Set(projects.map((p) => String(p.project_type ?? "internal")))]

    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget_amount ?? 0), 0)
    const totalActual = projects.reduce((sum, p) => sum + Number(p.spent ?? 0), 0)
    const totalInvoiced = collection("pm/invoices").reduce(
      (sum, i) => sum + Number(i.amount ?? 0),
      0,
    )

    const onTime = projects.filter((p) => p.health_status === "On Track").length

    return {
      data: {
        total_projects: total,
        kpis: {
          total_projects: total,
          active_projects: projects.filter((p) => p.status === "active").length,
          completed_projects: projects.filter((p) => p.status === "closed").length,
          external_projects: projects.filter((p) => p.project_type === "external").length,
          on_time_delivery_pct: share(onTime),
          budget_compliance_pct:
            totalBudget > 0
              ? Math.round((1 - totalActual / totalBudget) * 1000) / 10
              : 0,
          resource_utilization_pct: 78.5,
          scope_stability_pct: 91.2,
        },
        by_status: statuses.map((status) => {
          const count = projects.filter((p) => String(p.status) === status).length
          return {
            status,
            status_label: humanize(status),
            project_count: count,
            share_pct: share(count),
          }
        }),
        by_type: types.map((projectType) => {
          const rows = projects.filter((p) => String(p.project_type) === projectType)
          return {
            project_type: projectType,
            project_type_label: humanize(projectType),
            project_count: rows.length,
            share_pct: share(rows.length),
            total_budget: rows.reduce((sum, p) => sum + Number(p.budget_amount ?? 0), 0),
          }
        }),
        trends: monthLabels(12).map((period, i) => ({
          period,
          created_count: intBetween(makeRandom(430_000 + i), 0, 4),
          completed_count: intBetween(makeRandom(431_000 + i), 0, 3),
          active_count: Math.max(1, total - intBetween(makeRandom(432_000 + i), 0, 6)),
        })),
        financials: {
          total_budget: totalBudget,
          total_actual_cost: totalActual,
          total_invoiced: totalInvoiced,
        },
        projects: projects.map((project) => ({
          project_id: String(project.id),
          name: String(project.name ?? ""),
          status: String(project.status ?? "unknown"),
          budget_amount: Number(project.budget_amount ?? 0),
          actual_cost: Number(project.spent ?? 0),
          total_invoiced: byProject("pm/invoices", String(project.id)).reduce(
            (sum, i) => sum + Number(i.amount ?? 0),
            0,
          ),
        })),
      },
    }
  }),

  route("get", "/pm/projects", (req) => listOf("pm/projects", req.params)),

  // `CreateProjectPayload` carries none of the derived list fields, so the
  // adapter's generic create stored a row with no `status`/`progress`/counts.
  // That row is unshifted onto the shared collection, and every later render of
  // the project lists then hit `LIFECYCLE_STATUS_STYLE[undefined].badge` — the
  // "works until you create a project, then breaks" report from QA.
  route("post", "/pm/projects", (req) => {
    const rows = collection("pm/projects")
    const manager = findRow("employees", String(req.body.manager_id ?? ""))
    const budget = Number(req.body.budget_amount ?? 0)
    const row: Row = {
      id: `pmp-${Date.now()}`,
      project_code: String(req.body.project_code ?? `PRJ-${String(rows.length + 1).padStart(4, "0")}`),
      name: String(req.body.name ?? "Untitled Project"),
      name_local: req.body.name_local ?? null,
      description: req.body.description ?? null,
      project_type: String(req.body.project_type ?? "internal"),
      classification: String(req.body.classification ?? "operational"),
      customer_id: req.body.customer_id ?? null,
      customer_name: req.body.customer_name ?? null,
      manager_id: req.body.manager_id ?? null,
      manager_name: String(manager?.full_name ?? req.body.manager_name ?? "Unassigned"),
      branch_id: req.body.branch_id ?? null,
      status: "created",
      status_label: "Created",
      start_date: req.body.start_date ?? isoDay(0),
      end_date: req.body.end_date ?? isoDay(180),
      is_active: true,
      budget_amount: budget,
      currency_code: String(req.body.currency_code ?? "USD"),
      progress: 0,
      tasks_total: 0,
      tasks_done: 0,
      spent: 0,
      phases_count: 0,
      health_status: "On Track",
    }
    rows.unshift(row)
    return { data: row }
  }),

  // `getTree` is typed `ApiResponse<Timeline[]>` and every consumer (overview,
  // schedule, tasks and WBS tabs) iterates the payload directly, so this must
  // be the bare timeline array — wrapping it in `{project_id, timelines}` made
  // `for (const t of timelines)` throw "timelines is not iterable".
  route("get", "/pm/projects/:id/hierarchy", (req) => {
    const phases = byProject("pm/phases", req.vars.id)
    return {
      data: [
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

  // `ClosureChecklist` = `{ summary: {total, complete}, items: ClosureItem[] }`.
  // The tab destructures `data.summary` before any guard and groups items by
  // `category_label`, so a bare `{items:[{label, complete}]}` threw on open.
  route("get", "/pm/projects/:id/closure", (req) => {
    const items = closureItemsFor(req.vars.id)
    return {
      data: {
        summary: {
          total: items.length,
          complete: items.filter((item) => item.is_complete).length,
        },
        items,
      },
    }
  }),

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

  // `RevenueSummary` — drives the four billing stat cards via `buildBillingStats`.
  route("get", "/pm/projects/:id/revenue-summary", (req) => {
    const project = findRow("pm/projects", req.vars.id)
    const invoices = byProject("pm/invoices", req.vars.id)
    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount ?? 0), 0)
    const contractValue = Number(project?.budget_amount ?? 0)
    const percentComplete = Number(project?.progress ?? 0)
    const recognized = Math.round((contractValue * percentComplete) / 100)
    const gap = recognized - totalInvoiced
    return {
      data: {
        project_id: req.vars.id,
        contract_value: contractValue,
        percent_complete: percentComplete,
        recognized_revenue: recognized,
        deferred_revenue: Math.max(0, contractValue - recognized),
        total_invoiced: totalInvoiced,
        revenue_gap: Math.abs(gap),
        cumulative_recognized: recognized,
        revenue_gap_label: gap > 0 ? "under_billed" : gap < 0 ? "over_billed" : "in_line",
      },
    }
  }),

  route("get", "/pm/projects/:id/messages/activity", () => ({ data: [] })),

  /* ------------------------------- Lists -------------------------------- */

  route("get", "/pm/tasks", (req) => listOf("pm/tasks", req.params)),

  // `GET /pm/documents` is the *library* endpoint: it returns a
  // `DocumentLibrary` envelope (documents + facets), not a plain list. The
  // seed rows carry the storage shape (`name`, `category: "Drawings"`), so map
  // them onto the `DocumentLibraryItem` contract the folder rail reads.
  route("get", "/pm/documents", (req) => {
    const projectId = req.params.project_id ? String(req.params.project_id) : null
    const search = String(req.params.search ?? "").trim().toLowerCase()

    const rows = collection("pm/documents").filter((doc) => {
      if (doc.is_active === false) return false
      if (projectId && doc.project_id !== projectId) return false
      if (search && !String(doc.name ?? "").toLowerCase().includes(search)) return false
      return true
    })

    const documents = rows.map((doc) => {
      const category = DOCUMENT_CATEGORY_KEYS[String(doc.category)] ?? "other"
      const owner = doc.uploaded_by ? { id: String(doc.uploaded_by), name: String(doc.uploaded_by) } : null
      return {
        document_id: String(doc.id),
        title: String(doc.name ?? doc.file_name ?? "Untitled"),
        document_category: category,
        status: String(doc.status ?? "draft"),
        owner,
        author: owner,
      }
    })

    const facetOf = (values: string[], label: (key: string) => string) => {
      const counts = new Map<string, number>()
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
      return [...counts].map(([key, count]) => ({ key, label: label(key), count }))
    }

    return {
      data: {
        project_id: projectId,
        documents,
        facets: {
          categories: facetOf(
            documents.map((d) => d.document_category),
            (key) => DOCUMENT_CATEGORY_LABELS[key] ?? humanize(key),
          ),
          statuses: facetOf(documents.map((d) => d.status), humanize),
          tags: [],
        },
      },
    }
  }),

  route("get", "/pm/expenses", (req) => listOf("pm/expenses", req.params)),
  route("get", "/pm/invoices", (req) => listOf("pm/invoices", req.params)),
  route("get", "/pm/gates", (req) => listOf("pm/gates", req.params)),
  route("get", "/pm/change-requests", (req) => listOf("pm/change-requests", req.params)),
  // `GET /pm/schedule` is the portfolio milestone view (`PortfolioSchedule`),
  // not a task list: the page reads `data.summary[cardId]` and `data.milestones`
  // directly, so a raw `pm/tasks` page left `summary` undefined and threw.
  route("get", "/pm/schedule", (req) => {
    const today = new Date(isoDay(0)).getTime()
    const weekAhead = today + 7 * 86_400_000
    const statusFilter = req.params.status ? String(req.params.status) : null

    const milestones = collection("pm/milestones")
      .filter((m) => m.is_active !== false)
      .filter((m) => !statusFilter || m.status === statusFilter)
      .map((m) => {
        const due = new Date(String(m.target_date)).getTime()
        return {
          id: String(m.id),
          project_id: String(m.project_id),
          project_name: String(m.project_name ?? ""),
          title: String(m.name ?? ""),
          due_date: String(m.target_date),
          status: String(m.status ?? "pending"),
          is_critical: m.type === "billing",
          is_overdue: m.status === "missed" || (m.status === "pending" && due < today),
        }
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date))

    return {
      data: {
        summary: {
          milestones_total: milestones.length,
          overdue: milestones.filter((m) => m.is_overdue).length,
          due_this_week: milestones.filter((m) => {
            const due = new Date(m.due_date).getTime()
            return due >= today && due <= weekAhead
          }).length,
          on_critical_path: milestones.filter((m) => m.is_critical).length,
        },
        milestones,
      },
    }
  }),

  // Must precede `/pm/resources/:id`.
  // `ResourcePlannerSummary` — `buildPlannerStats` reads `department_count`,
  // `average_utilization_pct`, `overloaded_count` and `suggested_matches_count`.
  // The old over/under_allocated shape rendered "undefined departments" and "—".
  route("get", "/pm/resources/summary", () => {
    const resources = collection("pm/resources")
    const employees = collection("employees")
    const departments = new Set(
      resources
        .map((r) => employees.find((e) => e.id === r.employee_id)?.dept_id)
        .filter(Boolean),
    )
    return {
      data: {
        total_resources: resources.length,
        department_count: departments.size,
        average_utilization_pct: Math.round(
          resources.reduce((sum, r) => sum + Number(r.allocation_pct ?? 0), 0) /
            Math.max(1, resources.length),
        ),
        overloaded_count: resources.filter((r) => Number(r.allocation_pct) >= 100).length,
        suggested_matches_count: collection("pm/tasks").filter(
          (t) => !t.assignee_id && t.status !== "done",
        ).length,
      },
    }
  }),

  // `ResourceHeatmapWeek` needs `week_start`/`week_end` — the mapper builds its
  // column labels from `week_start`, so a bare `week: "W1"` left them blank.
  route("get", "/pm/resources/heatmap", (req) => {
    const from = String(req.params.from ?? isoDay(0)).slice(0, 10)
    const fromMs = new Date(`${from}T00:00:00.000Z`).getTime()
    const day = (offset: number) =>
      new Date(fromMs + offset * 86_400_000).toISOString().slice(0, 10)

    return {
      data: collection("pm/resources").map((resource, i) => ({
        employee_id: String(resource.employee_id),
        name: String(resource.name),
        weeks: Array.from({ length: 12 }, (_, w) => {
          const allocation = intBetween(makeRandom(460_000 + i * 13 + w), 10, 130)
          return {
            week_start: day(w * 7),
            week_end: day(w * 7 + 6),
            allocation_pct: allocation,
            planned_hours: Math.round((allocation / 100) * 40),
            available_pct: Math.max(0, 100 - allocation),
            overallocated: allocation > 100,
          }
        }),
      })),
    }
  }),

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

  // No collection is registered for assignments, so the resource planner's
  // "Assign Resource" POST fell through to the adapter's empty `fallback()` and
  // the mutation resolved with a body that had none of `ResourceAssignment`'s
  // fields. Build the full row (hours default to the task's planned hours
  // scaled by the allocation) so the success path has something real to read.
  route("post", "/pm/assignments", (req) => {
    const task = findRow("pm/tasks", String(req.body.task_id ?? ""))
    const allocation = Number(req.body.allocation_pct ?? 0)
    const plannedHours =
      req.body.planned_hours == null
        ? Math.round((Number(task?.planned_hours ?? 40) * allocation) / 100)
        : Number(req.body.planned_hours)
    const now = new Date().toISOString()
    return {
      data: {
        assignment_id: `pma-${Date.now()}`,
        employee_id: String(req.body.employee_id ?? ""),
        task_id: String(req.body.task_id ?? task?.id ?? ""),
        allocation_pct: allocation,
        planned_hours: plannedHours,
        start_date: String(req.body.start_date ?? task?.start_date ?? isoDay(0)),
        end_date: String(req.body.end_date ?? task?.due_date ?? isoDay(30)),
        is_active: true,
        created_by: 1,
        created_at: now,
        updated_at: now,
      },
    }
  }),

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

  // `BudgetDashboard` — the page calls `evmMetricCards(dashboard.data.evm)`,
  // which dereferences `evm.eac` unguarded, and reads `forecast.variance_amount`.
  // The old totals-only shape left both undefined and threw on open.
  route("get", "/pm/costbudget/dashboard", (req) => {
    const projectId = req.params.project_id ? String(req.params.project_id) : null
    const projects = projectId
      ? collection("pm/projects").filter((p) => String(p.id) === projectId)
      : collection("pm/projects")

    const bac = projects.reduce((sum, p) => sum + Number(p.budget_amount ?? 0), 0)
    const ac = projects.reduce((sum, p) => sum + Number(p.spent ?? 0), 0)
    const avgProgress = projects.length
      ? projects.reduce((sum, p) => sum + Number(p.progress ?? 0), 0) / projects.length
      : 0
    const ev = Math.round((bac * avgProgress) / 100)
    const pv = Math.round(bac * 0.55)
    const cpi = ac > 0 ? Math.round((ev / ac) * 100) / 100 : null
    const spi = pv > 0 ? Math.round((ev / pv) * 100) / 100 : null
    const eac = cpi && cpi > 0 ? Math.round(bac / cpi) : null
    const vac = eac === null ? null : bac - eac

    return {
      data: {
        project_id: projectId,
        currency_code: "USD",
        evm: {
          project_id: projectId ?? "",
          bac,
          pv,
          ev,
          ac,
          cv: ev - ac,
          sv: ev - pv,
          cpi,
          spi,
          eac,
          etc: eac === null ? null : Math.max(0, eac - ac),
          vac,
          cost_performance_label:
            cpi === null ? "no_data" : cpi >= 1 ? "under_budget" : "over_budget",
          schedule_performance_label:
            spi === null ? "no_data" : spi >= 1 ? "ahead" : "behind",
        },
        forecast: {
          original_budget: bac,
          eac,
          variance_amount: vac === null ? null : -vac,
          variance_pct:
            vac === null || bac === 0
              ? null
              : Math.round((-vac / bac) * 1000) / 10,
        },
        availability_control: null,
      },
    }
  }),

  // Both chart endpoints return an `{items: […]}` envelope, not a bare array —
  // the page reads `costMix.data?.items` / `waterfall.data?.items`.
  route("get", "/pm/costbudget/cost-mix", (req) => {
    const projectId = req.params.project_id ? String(req.params.project_id) : null
    const raw = [
      { cost_type: "labour", amount: 4_280_000 },
      { cost_type: "materials", amount: 3_140_000 },
      { cost_type: "subcontract", amount: 2_050_000 },
      { cost_type: "equipment", amount: 980_000 },
      { cost_type: "other", amount: 420_000 },
    ]
    const total = raw.reduce((sum, item) => sum + item.amount, 0)
    return {
      data: {
        project_id: projectId,
        currency_code: "USD",
        items: raw.map((item) => ({
          cost_type: item.cost_type,
          cost_type_label: humanize(item.cost_type),
          amount: item.amount,
          pct: Math.round((item.amount / total) * 1000) / 10,
        })),
      },
    }
  }),

  route("get", "/pm/costbudget/waterfall", (req) => {
    const projectId = req.params.project_id ? String(req.params.project_id) : null
    const projects = projectId
      ? collection("pm/projects").filter((p) => String(p.id) === projectId)
      : collection("pm/projects").slice(0, 6)
    return {
      data: {
        project_id: projectId,
        items: projects.map((project) => {
          const planned = Number(project.budget_amount ?? 0)
          const actual = Number(project.spent ?? 0)
          const committed = Math.round(actual * 0.18)
          return {
            code: String(project.project_code ?? project.id),
            name: String(project.name ?? ""),
            node_type: "project",
            planned_amount: planned,
            committed_amount: committed,
            actual_amount: actual,
            variance: planned - actual - committed,
            currency_code: "USD",
          }
        }),
      },
    }
  }),

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

  // `PortfolioRevenueSummary` — the portfolio view reads `total_contract_value`,
  // `total_invoiced`, `total_recognized`, `unbilled` and iterates `by_project`,
  // none of which the old billed/collected shape provided.
  route("get", "/pm/billing/revenue-summary", () => {
    const byProjectRows = collection("pm/projects").map((project) => {
      const invoices = byProject("pm/invoices", String(project.id))
      const invoiced = invoices.reduce((sum, i) => sum + Number(i.amount ?? 0), 0)
      const contractValue = Number(project.budget_amount ?? 0)
      const percentComplete = Number(project.progress ?? 0)
      return {
        project_id: String(project.id),
        project_name: String(project.name ?? ""),
        contract_value: contractValue,
        invoiced,
        recognized: Math.round((contractValue * percentComplete) / 100),
      }
    })

    const totalContractValue = byProjectRows.reduce((s, r) => s + r.contract_value, 0)
    const totalInvoiced = byProjectRows.reduce((s, r) => s + r.invoiced, 0)
    const totalRecognized = byProjectRows.reduce((s, r) => s + r.recognized, 0)

    return {
      data: {
        total_contract_value: totalContractValue,
        total_invoiced: totalInvoiced,
        total_recognized: totalRecognized,
        unbilled: Math.max(0, totalRecognized - totalInvoiced),
        currency_code: "USD",
        by_project: byProjectRows,
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

  // `PortfolioActivityItem[]` — the feed renders `item.author.initials` and
  // `item.project_name`, neither of which the `/pm/me/activity` row shape has.
  // (`buildMyActivity()` stays as-is; it still backs `/pm/me/activity`.)
  route("get", "/pm/activity", () => ({
    data: buildMyActivity().map((row, i) => {
      const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
      const name = String(row.text ?? "").split(" ").slice(0, 2).join(" ") || "Team Member"
      return {
        id: String(row.id),
        project_id: String(project.id),
        project_name: String(project.name ?? ""),
        author: { id: `emp-${(i % 8) + 1}`, name, initials: initialsOf(name) },
        text: String(row.text ?? ""),
        node_type: "project",
        occurred_at: String(row.occurred_at),
      }
    }),
  })),

  // `CollaborationContext` — the project-scoped chat reads `members`,
  // `can_post` and `recent_activity`, not `{channels, threads, participants}`.
  route("get", "/pm/collaboration/context", (req) => {
    const projectId = req.params.project_id ? String(req.params.project_id) : null
    return {
      data: {
        project_id: projectId,
        root_node_id: projectId,
        members: collection("pm/resources")
          .slice(0, 8)
          .map((resource) => ({
            id: String(resource.id),
            name: String(resource.name ?? ""),
            initials: initialsOf(String(resource.name ?? "")),
          })),
        can_post: true,
        block_reason: null,
        recent_activity: [],
      },
    }
  }),
  route("get", "/pm/search/messages", () => ({ data: [] })),
  route("get", "/pm/project-templates", () => ({
    data: [
      { id: "tpl-1", name: "Construction — Standard", phases: 6, tasks: 48 },
      { id: "tpl-2", name: "Software Delivery", phases: 4, tasks: 32 },
      { id: "tpl-3", name: "Facility Upgrade", phases: 5, tasks: 40 },
    ],
  })),

  // Returns a full `Timesheet`: the grid mapper reads `period_start`/`period_end`
  // and a `rows[]` of per-task entries, and the stat cards read `summary`.
  // A flat `entries[]` here left `period_start` undefined, and
  // `new Date(undefined).toISOString()` throws `RangeError: Invalid time value`.
  route("get", "/pm/timesheets/current", (req) => {
    const employeeId = String(req.params.employee_id ?? "emp-1")
    // Monday of the requested week, defaulting to the current one.
    const weekStart = String(req.params.week_start ?? isoDay(0)).slice(0, 10)
    const startMs = new Date(`${weekStart}T00:00:00.000Z`).getTime()
    const dayOf = (offset: number) =>
      new Date(startMs + offset * 86_400_000).toISOString().slice(0, 10)

    const HOURS = [
      [8, 6, 6, 4, 4],
      [4, 4, 0, 6, 2],
      [0, 3, 5, 0, 4],
      [2, 0, 4, 4, 0],
      [6, 5, 0, 2, 3],
    ]

    const rows = collection("pm/tasks")
      .slice(0, 5)
      .map((task, rowIndex) => {
        const entries = HOURS[rowIndex]
          .map((hours, dayOffset) => ({ hours, dayOffset }))
          .filter((e) => e.hours > 0)
          .map((e, entryIndex) => ({
            log_id: `tsl-${rowIndex + 1}-${entryIndex + 1}`,
            log_date: dayOf(e.dayOffset),
            hours: e.hours,
            note: null,
            status: "draft",
          }))
        return {
          row_id: `tsr-${rowIndex + 1}`,
          project_id: String(task.project_id ?? ""),
          project_name: String(
            findRow("pm/projects", String(task.project_id))?.name ?? "",
          ),
          task_id: String(task.id),
          subtask_id: null,
          task_title: String(task.title),
          billable: rowIndex % 2 === 0,
          entries,
          total_hours: entries.reduce((sum, e) => sum + e.hours, 0),
        }
      })

    const hoursPosted = rows.reduce((sum, r) => sum + r.total_hours, 0)
    const billableHours = rows
      .filter((r) => r.billable)
      .reduce((sum, r) => sum + r.total_hours, 0)
    const expenses = collection("pm/expenses").slice(0, 4)

    return {
      data: {
        timesheet_id: `ts-${employeeId}-${weekStart}`,
        employee_id: employeeId,
        employee: { id: employeeId, name: "Demo User" },
        period_start: weekStart,
        period_end: dayOf(6),
        status: "draft",
        summary: {
          hours_posted: hoursPosted,
          billable_hours: billableHours,
          billable_pct: hoursPosted
            ? Math.round((billableHours / hoursPosted) * 100)
            : 0,
          pending_approval_count: rows.length,
          expense_amount: expenses.reduce(
            (sum, e) => sum + Number(e.amount ?? 0),
            0,
          ),
          receipt_count: expenses.length,
          currency_code: "EGP",
        },
        rows,
      },
    }
  }),

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
