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

const PROJECT_NAMES = [
  "Nile Tower Fit-Out", "Marina Residences Phase 1", "Smart Grid Pilot",
  "Cold Storage Facility", "Ring Road Interchange", "Hospital Wing Extension",
  "Solar Farm — Aswan", "Port Terminal Upgrade", "Data Centre Build",
  "Retail Rollout — Delta", "Water Treatment Plant", "Campus Modernisation",
  "Metro Depot Works", "Logistics Hub Automation",
] as const

const LIFECYCLE = ["created", "released", "released", "technically_complete", "closed"] as const
const HEALTH = ["On Track", "On Track", "At Risk", "Critical"] as const
const PROJECT_TYPES = ["internal", "external", "capital", "overhead"] as const

export const PM_PROJECT_ROWS: Row[] = PROJECT_NAMES.map((name, i) => {
  const rand = makeRandom(300_000 + i)
  const status = LIFECYCLE[i % LIFECYCLE.length]
  const budget = moneyBetween(rand, 400_000, 9_500_000, 10_000)
  const tasksTotal = intBetween(rand, 18, 120)
  const progress = status === "closed" ? 100 : intBetween(rand, 8, 94)
  const manager = personName(rand)
  return {
    id: `pmp-${i + 1}`,
    project_code: `PRJ-${String(i + 1).padStart(4, "0")}`,
    name,
    name_local: null,
    description: `${name} — delivery programme tracked end to end in Nucleus.`,
    project_type: PROJECT_TYPES[i % PROJECT_TYPES.length],
    classification: i % 3 === 0 ? "strategic" : "operational",
    customer_id: `cus-${(i % 12) + 1}`,
    customer_name: COMPANY_NAMES[i % COMPANY_NAMES.length],
    manager_id: `emp-${i + 1}`,
    manager_name: manager,
    branch_id: `br-${(i % 5) + 1}`,
    status,
    status_label: status.replace(/_/g, " "),
    start_date: isoDay(-intBetween(rand, 90, 700)),
    end_date: isoDay(intBetween(rand, -40, 420)),
    is_active: status !== "closed",
    budget_amount: budget,
    currency_code: "USD",
    progress,
    tasks_total: tasksTotal,
    tasks_done: Math.round((tasksTotal * progress) / 100),
    spent: Math.round(budget * (progress / 100) * (0.85 + rand() * 0.35)),
    phases_count: intBetween(rand, 3, 7),
    health_status: status === "closed" ? "On Track" : HEALTH[i % HEALTH.length],
  }
})

const PM_TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "blocked"] as const
const PM_TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const

const PHASE_NAMES = ["Initiation", "Design", "Procurement", "Construction", "Commissioning", "Handover"] as const

export const PM_PHASE_ROWS: Row[] = PM_PROJECT_ROWS.flatMap((project, p) =>
  PHASE_NAMES.slice(0, Number(project.phases_count)).map((name, i) => {
    const rand = makeRandom(310_000 + p * 10 + i)
    const status = i === 0 ? "completed" : i === 1 ? "active" : "draft"
    return {
      id: `pmph-${p + 1}-${i + 1}`,
      timeline_id: `pmtl-${p + 1}`,
      project_id: project.id,
      name,
      description: null,
      sequence: i + 1,
      status,
      status_label: status.replace(/_/g, " "),
      gate_status: i === 0 ? "passed" : i === 1 ? "open" : "blocked",
      gate_status_label: i === 0 ? "Passed" : i === 1 ? "Open" : "Blocked",
      start_date: isoDay(-300 + i * 45),
      end_date: isoDay(-300 + (i + 1) * 45),
      is_active: true,
      planned_hours: intBetween(rand, 200, 1_800),
    }
  }),
)

const TASK_TITLES = [
  "Site survey", "Structural drawings", "Tender evaluation", "Materials order",
  "Foundation works", "MEP first fix", "Safety inspection", "Client walkthrough",
  "Snag list closure", "As-built documentation", "Commissioning tests",
  "Handover pack", "Permit renewal", "Subcontractor briefing",
] as const

export const PM_TASK_ROWS: Row[] = PM_PHASE_ROWS.flatMap((phase, p) =>
  Array.from({ length: 4 }, (_, i) => {
    const rand = makeRandom(320_000 + p * 7 + i)
    const status = PM_TASK_STATUSES[(p + i) % PM_TASK_STATUSES.length]
    const priority = PM_TASK_PRIORITIES[(p + i) % PM_TASK_PRIORITIES.length]
    const assigneeId = `emp-${((p + i) % 40) + 1}`
    const assigneeName = personName(rand)
    const planned = intBetween(rand, 8, 120)
    const percent = status === "done" ? 100 : status === "todo" ? 0 : intBetween(rand, 10, 85)
    return {
      id: `pmt-${p + 1}-${i + 1}`,
      task_id: `pmt-${p + 1}-${i + 1}`,
      phase_id: phase.id,
      phase_name: phase.name,
      project_id: phase.project_id,
      title: `${pick(rand, TASK_TITLES)}`,
      description: null,
      sequence: i + 1,
      status,
      status_label: status.replace(/_/g, " "),
      priority,
      priority_label: priority.charAt(0).toUpperCase() + priority.slice(1),
      assignee_id: assigneeId,
      assignee: { id: assigneeId, name: assigneeName, email: emailFor(assigneeName) },
      planned_hours: planned,
      actual_hours: Math.round((planned * percent) / 100),
      percent_complete: percent,
      start_date: isoDay(-intBetween(rand, 10, 180)),
      due_date: isoDay(intBetween(rand, -20, 120)),
      is_active: true,
      subtasks: [],
    }
  }),
)

export const PM_MILESTONE_ROWS: Row[] = PM_PROJECT_ROWS.flatMap((project, p) =>
  Array.from({ length: 3 }, (_, i) => {
    const rand = makeRandom(330_000 + p * 5 + i)
    const target = intBetween(rand, -60, 200)
    const status = target < 0 ? (i % 2 === 0 ? "achieved" : "missed") : "pending"
    const type = i === 1 ? "billing" : "internal"
    return {
      id: `pmm-${p + 1}-${i + 1}`,
      project_id: project.id,
      project_name: project.name,
      name: `${["Design freeze", "Milestone payment", "Practical completion"][i]}`,
      description: null,
      target_date: isoDay(target),
      achieved_date: status === "achieved" ? isoDay(target - 2) : null,
      type,
      type_label: type === "billing" ? "Billing" : "Internal",
      status,
      status_label: status.charAt(0).toUpperCase() + status.slice(1),
      amount: type === "billing" ? moneyBetween(rand, 50_000, 900_000, 1_000) : null,
      currency_code: "USD",
      is_active: true,
      created_by: 1,
      created_at: isoDateTime(-4_000),
      updated_at: isoDateTime(-200),
    }
  }),
)

export const PM_RESOURCE_ROWS: Row[] = Array.from({ length: 30 }, (_, i) => {
  const rand = makeRandom(340_000 + i)
  const name = personName(rand)
  const [first, last] = name.split(" ")
  return {
    id: `emp-${i + 1}`,
    employee_id: `emp-${i + 1}`,
    employee_number: `EMP-${String(i + 1).padStart(4, "0")}`,
    first_name: first,
    last_name: last,
    name,
    email_work: emailFor(name),
    employment_status: "active",
    employment_type: "full_time",
    has_pm_profile: true,
    bill_rate: intBetween(rand, 45, 180),
    cost_rate_override: null,
    pm_skills: [pick(rand, ["Scheduling", "Cost control", "QA/QC", "Procurement", "BIM"] as const)],
    billable_default: true,
    allocation_pct: intBetween(rand, 20, 115),
  }
})

export const PM_DOCUMENT_ROWS: Row[] = PM_PROJECT_ROWS.flatMap((project, p) =>
  Array.from({ length: 4 }, (_, i) => {
    const rand = makeRandom(350_000 + p * 3 + i)
    const status = pick(rand, ["draft", "in_review", "approved", "rejected"] as const)
    return {
      id: `pmd-${p + 1}-${i + 1}`,
      project_id: project.id,
      project_name: project.name,
      name: `${pick(rand, ["Method Statement", "Drawing Set", "Risk Register", "Inspection Report", "Contract Annex"] as const)} ${i + 1}`,
      file_name: `document-${p + 1}-${i + 1}.pdf`,
      category: pick(rand, ["Drawings", "Contracts", "Reports", "Permits"] as const),
      version: `v${1 + (i % 4)}.0`,
      status,
      status_label: status.replace(/_/g, " "),
      size_kb: intBetween(rand, 120, 9_800),
      uploaded_by: personName(rand),
      uploaded_at: isoDateTime(-intBetween(rand, 12, 5_000)),
      checked_out_by: null,
      is_active: true,
    }
  }),
)

export const PM_EXPENSE_ROWS: Row[] = Array.from({ length: 48 }, (_, i) => {
  const rand = makeRandom(360_000 + i)
  const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
  const status = pick(rand, ["draft", "submitted", "approved", "rejected"] as const)
  return {
    id: `pme-${i + 1}`,
    project_id: project.id,
    project_name: project.name,
    employee_id: `emp-${(i % 30) + 1}`,
    employee_name: personName(rand),
    category: pick(rand, ["Travel", "Materials", "Equipment", "Subcontractor", "Permits"] as const),
    description: "Project expense claim",
    amount: moneyBetween(rand, 120, 24_000, 10),
    currency_code: "USD",
    expense_date: isoDay(-intBetween(rand, 1, 200)),
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    billable: i % 3 !== 0,
    receipt_url: null,
  }
})

export const PM_INVOICE_ROWS: Row[] = Array.from({ length: 26 }, (_, i) => {
  const rand = makeRandom(370_000 + i)
  const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
  const amount = moneyBetween(rand, 40_000, 1_200_000, 1_000)
  const status = pick(rand, ["draft", "issued", "paid", "overdue"] as const)
  return {
    id: `pmi-${i + 1}`,
    project_id: project.id,
    project_name: project.name,
    invoice_number: `PINV-${4_000 + i}`,
    customer_name: project.customer_name,
    amount,
    amount_paid: status === "paid" ? amount : 0,
    currency_code: "USD",
    issue_date: isoDay(-intBetween(rand, 5, 180)),
    due_date: isoDay(intBetween(rand, -30, 60)),
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
  }
})

export const PM_GATE_ROWS: Row[] = PM_PHASE_ROWS.slice(0, 40).map((phase, i) => {
  const rand = makeRandom(380_000 + i)
  const status = pick(rand, ["open", "submitted", "passed", "blocked"] as const)
  return {
    id: `pmg-${i + 1}`,
    project_id: phase.project_id,
    phase_id: phase.id,
    phase_name: phase.name,
    name: `${phase.name} Gate`,
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    owner: personName(rand),
    due_date: isoDay(intBetween(rand, -20, 90)),
    criteria_total: intBetween(rand, 4, 12),
    criteria_met: intBetween(rand, 0, 4),
    is_active: true,
  }
})

export const PM_CHANGE_REQUEST_ROWS: Row[] = Array.from({ length: 22 }, (_, i) => {
  const rand = makeRandom(390_000 + i)
  const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
  const status = pick(rand, ["draft", "submitted", "approved", "rejected"] as const)
  return {
    id: `pmcr-${i + 1}`,
    project_id: project.id,
    project_name: project.name,
    reference: `CR-${String(i + 1).padStart(3, "0")}`,
    title: pick(rand, ["Scope extension", "Schedule slip recovery", "Material substitution", "Budget uplift"] as const),
    description: "Change request raised by the delivery team.",
    status,
    status_label: status.charAt(0).toUpperCase() + status.slice(1),
    cost_impact: moneyBetween(rand, -40_000, 320_000, 1_000),
    schedule_impact_days: intBetween(rand, -5, 45),
    raised_by: personName(rand),
    raised_at: isoDay(-intBetween(rand, 2, 150)),
  }
})

export const PM_MATERIAL_ROWS: Row[] = Array.from({ length: 36 }, (_, i) => {
  const rand = makeRandom(400_000 + i)
  const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
  const required = intBetween(rand, 20, 900)
  const onHand = intBetween(rand, 0, required)
  return {
    id: `pmmat-${i + 1}`,
    project_id: project.id,
    project_name: project.name,
    name: pick(rand, ["Rebar 16mm", "Ready-mix C30", "Cable tray", "HVAC duct", "Cement bags", "Formwork panels"] as const),
    sku: `MAT-${2_000 + i}`,
    unit: pick(rand, ["tonne", "m³", "m", "unit", "bag"] as const),
    quantity_required: required,
    quantity_on_hand: onHand,
    quantity_shortfall: Math.max(0, required - onHand),
    unit_cost: moneyBetween(rand, 40, 4_500, 10),
    currency_code: "USD",
    status: onHand === 0 ? "out_of_stock" : onHand < required * 0.3 ? "low" : "ok",
  }
})

export function buildPmProjectStats() {
  const projects = PM_PROJECT_ROWS
  const byStatus: Record<string, number> = {}
  for (const project of projects) {
    const key = String(project.status)
    byStatus[key] = (byStatus[key] ?? 0) + 1
  }
  return {
    total: projects.length,
    new_this_month: 2,
    active_count: projects.filter((p) => p.is_active).length,
    at_risk_count: projects.filter((p) => p.health_status !== "On Track").length,
    by_status: byStatus,
    total_budget: projects.reduce((sum, p) => sum + Number(p.budget_amount), 0),
    overdue_count: projects.filter(
      (p) => String(p.end_date) < isoDay(0) && p.status !== "closed",
    ).length,
  }
}

export function buildMySummary() {
  const mine = PM_PROJECT_ROWS.slice(0, 6)
  return {
    active_projects: {
      count: mine.length,
      on_track: mine.filter((p) => p.health_status === "On Track").length,
      needs_attention: mine.filter((p) => p.health_status !== "On Track").length,
    },
    tasks_due_today: { count: 5, high_priority: 2 },
    hours_this_week: { booked: 28, capacity: 40, remaining: 12 },
    approvals_pending: { count: 7, gates: 3, change_requests: 4 },
  }
}

export function buildMyPriorities(): Row[] {
  const rand = makeRandom(410_000)
  const kinds = ["approval", "task", "change_request", "meeting", "milestone"] as const
  return Array.from({ length: 8 }, (_, i) => {
    const project = PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length]
    const kind = kinds[i % kinds.length]
    return {
      id: `prio-${i + 1}`,
      title: pick(rand, ["Approve gate submission", "Close out snag list", "Review change request", "Weekly delivery sync", "Confirm milestone date"] as const),
      project_name: String(project.name),
      kind,
      context_label: kind.replace(/_/g, " "),
      time_label: i < 3 ? "Today" : i < 6 ? "This week" : null,
      status: i < 3 ? "Due today" : "Upcoming",
      priority: (["red", "amber", "indigo"] as const)[i % 3],
    }
  })
}

export function buildMyCapacity() {
  return {
    booked_hours: 28,
    total_hours: 40,
    breakdown: [
      { id: "cap-1", label: "Delivery", hours: 16, color: "#6366f1" },
      { id: "cap-2", label: "Reviews", hours: 6, color: "#10b981" },
      { id: "cap-3", label: "Meetings", hours: 4, color: "#f59e0b" },
      { id: "cap-4", label: "Admin", hours: 2, color: "#3b82f6" },
    ],
  }
}

export function buildMyActivity(): Row[] {
  const rand = makeRandom(420_000)
  const kinds = ["task_completed", "mention", "invoice", "document", "risk"] as const
  return Array.from({ length: 12 }, (_, i) => ({
    id: `act-${i + 1}`,
    text: `${personName(rand)} ${pick(rand, ["completed a task", "mentioned you", "issued an invoice", "uploaded a document", "raised a risk"] as const)} on ${PM_PROJECT_ROWS[i % PM_PROJECT_ROWS.length].name}`,
    occurred_at: isoDateTime(-i * 5 - 1),
    time_label: i === 0 ? "just now" : `${i * 5}h ago`,
    kind: kinds[i % kinds.length],
  }))
}
