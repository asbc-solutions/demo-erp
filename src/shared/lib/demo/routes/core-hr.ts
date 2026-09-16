import {
  applyFilters,
  collection,
  defineCollection,
  findRow,
  paginate,
  updateRow,
  type Row,
} from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import {
  BRANCH_ROWS,
  CONTRACT_ROWS,
  COST_CENTER_ROWS,
  DEPARTMENT_ROWS,
  EMERGENCY_CONTACT_ROWS,
  EMPLOYEE_LIST_META,
  EMPLOYEE_ROWS,
  HR_DOCUMENT_ROWS,
  JOB_GRADE_ROWS,
  JOB_ROWS,
  NOTIFICATION_ROWS,
  POSITION_ROWS,
} from "../seed/core-hr"
import { DEPARTMENTS, intBetween, isoDay, makeRandom, monthLabels } from "../seed/faker"
import {
  APPRAISAL_ROWS,
  CERTIFICATION_ROWS,
  COURSE_ROWS,
  FEEDBACK_REQUEST_ROWS,
  GOAL_ROWS,
  KPI_ROWS,
  REVIEW_CYCLE_ROWS,
  SKILL_ROWS,
  TRAINING_PROGRAM_ROWS,
  TRAINING_SESSION_ROWS,
} from "../seed/hr-development"

/* Registering a collection is enough for plain REST endpoints — the adapter's
   generic handler covers list/get/create/update/delete/action for each. */
defineCollection("employees", () => [...EMPLOYEE_ROWS])
defineCollection("branches", () => [...BRANCH_ROWS])
defineCollection("departments", () => [...DEPARTMENT_ROWS])
defineCollection("positions", () => [...POSITION_ROWS])
defineCollection("job-grades", () => [...JOB_GRADE_ROWS])
defineCollection("jobs", () => [...JOB_ROWS])
defineCollection("cost-centers", () => [...COST_CENTER_ROWS])
defineCollection("contracts", () => [...CONTRACT_ROWS])
defineCollection("documents", () => [...HR_DOCUMENT_ROWS])
defineCollection("emergency-contacts", () => [...EMERGENCY_CONTACT_ROWS])
defineCollection("notifications", () => [...NOTIFICATION_ROWS])
defineCollection("accounting-salary", () => buildPayrollRuns())
defineCollection("history", () => buildHistory())
defineCollection("operations", () => buildOperations())
defineCollection("performance/cycles", () => [...REVIEW_CYCLE_ROWS])
defineCollection("performance/kpis", () => [...KPI_ROWS])
defineCollection("performance/goals", () => [...GOAL_ROWS])
defineCollection("performance/appraisals", () => [...APPRAISAL_ROWS])
defineCollection("training/courses", () => [...COURSE_ROWS])
defineCollection("training/programs", () => [...TRAINING_PROGRAM_ROWS])
defineCollection("training/sessions", () => [...TRAINING_SESSION_ROWS])
defineCollection("training/skills", () => [...SKILL_ROWS])
defineCollection("training/certifications", () => [...CERTIFICATION_ROWS])
defineCollection("leave/requests", () => buildLeaveRequests())
defineCollection("leave-types", () => [...LEAVE_TYPE_ROWS])
defineCollection("leave-policies", () => [...LEAVE_POLICY_ROWS])
defineCollection("approvals/requests", () => buildApprovals())

const LEAVE_TYPE_ROWS: Row[] = [
  { id: "lt-1", name: "Annual", code: "ANN", is_paid: true, max_days: 21, is_active: true },
  { id: "lt-2", name: "Sick", code: "SCK", is_paid: true, max_days: 10, is_active: true },
  { id: "lt-3", name: "Unpaid", code: "UNP", is_paid: false, max_days: 30, is_active: true },
  { id: "lt-4", name: "Maternity", code: "MAT", is_paid: true, max_days: 90, is_active: true },
]

const LEAVE_POLICY_ROWS: Row[] = [
  { id: "lp-1", name: "Standard Policy", leave_type_id: "lt-1", accrual_rate: 1.75, carry_over_days: 5, is_active: true },
  { id: "lp-2", name: "Executive Policy", leave_type_id: "lt-1", accrual_rate: 2.5, carry_over_days: 10, is_active: true },
]

function buildPayrollRuns(): Row[] {
  return Array.from({ length: 10 }, (_, i) => {
    const rand = makeRandom(21_000 + i)
    return {
      id: `pr-${i + 1}`,
      reference: `PR-2026-${String(10 - i).padStart(2, "0")}`,
      period: `2026-${String(Math.max(1, 9 - i)).padStart(2, "0")}`,
      status: i === 0 ? "draft" : i < 3 ? "posted" : "posted",
      total_gross: intBetween(rand, 700_000, 1_200_000),
      total_net: intBetween(rand, 520_000, 900_000),
      total_deductions: intBetween(rand, 80_000, 220_000),
      employee_count: intBetween(rand, 110, 130),
      currency_code: "USD",
      posted_at: i === 0 ? null : isoDay(-i * 30),
      created_at: isoDay(-i * 30 - 3),
    }
  })
}

function buildHistory(): Row[] {
  const actions = [
    "hired", "promoted", "transferred", "salary_changed",
    "terminated", "reactivated", "document_verified",
  ] as const
  return Array.from({ length: 60 }, (_, i) => {
    const rand = makeRandom(31_000 + i)
    const employee = EMPLOYEE_ROWS[i % EMPLOYEE_ROWS.length]
    const action = actions[i % actions.length]
    return {
      id: `hist-${i + 1}`,
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_number: employee.employee_number,
      action,
      action_label: action.replace(/_/g, " "),
      module_name: "hr",
      performed_by: "Demo Admin",
      performed_at: isoDay(-intBetween(rand, 1, 400)),
      notes: `${action.replace(/_/g, " ")} recorded for ${employee.full_name}.`,
      old_values: null,
      new_values: null,
    }
  })
}

function buildOperations(): Row[] {
  const types = ["promote", "transfer", "terminate", "salary_change", "reactivate"] as const
  return Array.from({ length: 24 }, (_, i) => {
    const rand = makeRandom(41_000 + i)
    const employee = EMPLOYEE_ROWS[i % EMPLOYEE_ROWS.length]
    return {
      id: `op-${i + 1}`,
      employee_id: employee.id,
      employee_name: employee.full_name,
      operation_type: types[i % types.length],
      effective_date: isoDay(-intBetween(rand, 1, 200)),
      performed_by: "Demo Admin",
      performed_at: isoDay(-intBetween(rand, 1, 200)),
      is_undoable: i < 6,
      status: "completed",
    }
  })
}

function employeeById(id: string): Row | undefined {
  return findRow("employees", id)
}

function groupLabel(groupBy: string, key: string): string {
  if (groupBy === "dept_id") {
    return (
      (collection("departments").find((d) => d.id === key)?.dept_name as string) ?? key
    )
  }
  if (groupBy === "branch_id") {
    return (
      (collection("branches").find((b) => b.id === key)?.branch_name as string) ?? key
    )
  }
  if (groupBy === "job_grade_id") {
    return (
      (collection("job-grades").find((g) => g.id === key)?.grade_name as string) ?? key
    )
  }
  return key.replace(/_/g, " ")
}

export const coreHrRoutes: DemoRoute[] = [
  /* ----------------------------- Employees ----------------------------- */

  // The employees list carries KPI fields inside `meta` alongside pagination.
  route("get", "/employees", (req) => {
    const filtered = applyFilters(collection("employees"), req.params)
    const { rows, meta } = paginate(filtered, req.params)
    return { data: rows, meta: { ...meta, ...EMPLOYEE_LIST_META } }
  }),

  route("get", "/employees/:id/direct-reports", (req) => ({
    data: collection("employees").filter((e) => e.manager_id === req.vars.id),
  })),

  route("get", "/employees/:id/contracts/current", (req) => ({
    data: collection("contracts").find((c) => c.employee_id === req.vars.id) ?? null,
  })),

  route("get", "/employees/:id/contracts", (req) => ({
    data: collection("contracts").filter((c) => c.employee_id === req.vars.id),
  })),

  route("get", "/employees/:id/documents", (req) => ({
    data: collection("documents").filter((d) => d.employee_id === req.vars.id),
  })),

  route("get", "/employees/:id/emergency-contacts", (req) => ({
    data: collection("emergency-contacts").filter(
      (c) => c.employee_id === req.vars.id,
    ),
  })),

  route("get", "/employees/:id/history", (req) => ({
    data: collection("history").filter((h) => h.employee_id === req.vars.id),
  })),

  route("get", "/employees/:id/operations", (req) => ({
    data: collection("operations").filter((o) => o.employee_id === req.vars.id),
  })),

  route("get", "/employees/:id/leave-balances", (req) => ({
    data: [
      { leave_type_id: "lt-1", leave_type_name: "Annual", entitled_days: 21, used_days: 8, remaining_days: 13, employee_id: req.vars.id },
      { leave_type_id: "lt-2", leave_type_name: "Sick", entitled_days: 10, used_days: 2, remaining_days: 8, employee_id: req.vars.id },
      { leave_type_id: "lt-3", leave_type_name: "Unpaid", entitled_days: 0, used_days: 0, remaining_days: 0, employee_id: req.vars.id },
    ],
  })),

  route("get", "/employees/:id/salary/current", (req) => {
    const employee = employeeById(req.vars.id)
    const base = Number(employee?.base_salary ?? 60_000)
    return {
      data: {
        id: `sal-${req.vars.id}`,
        employee_id: req.vars.id,
        basic_salary: base,
        gross_salary: Math.round(base * 1.18),
        net_salary: Math.round(base * 0.82),
        currency_code: "USD",
        effective_date: isoDay(-120),
        allowances: [
          { code: "housing", label: "Housing", amount: Math.round(base * 0.1) },
          { code: "transport", label: "Transport", amount: Math.round(base * 0.05) },
        ],
        deductions: [
          { code: "tax", label: "Income tax", amount: Math.round(base * 0.14) },
          { code: "social", label: "Social insurance", amount: Math.round(base * 0.04) },
        ],
      },
    }
  }),

  route("get", "/employees/:id/salary", (req) => {
    const employee = employeeById(req.vars.id)
    const base = Number(employee?.base_salary ?? 60_000)
    return {
      data: Array.from({ length: 4 }, (_, i) => ({
        id: `sal-${req.vars.id}-${i}`,
        employee_id: req.vars.id,
        basic_salary: Math.round(base * (1 - i * 0.07)),
        currency_code: "USD",
        effective_date: isoDay(-120 - i * 365),
        change_reason: i === 0 ? "annual_review" : "promotion",
      })),
    }
  }),

  route("get", "/employees/:id/org-chart", (req) => {
    const employee = employeeById(req.vars.id)
    return {
      data: {
        employee,
        manager: employee?.manager_id ? employeeById(String(employee.manager_id)) : null,
        direct_reports: collection("employees").filter(
          (e) => e.manager_id === req.vars.id,
        ),
      },
    }
  }),

  // Preview endpoints return "what would happen" without changing anything.
  route("post", "/employees/:id/promote/preview", (req) => ({
    data: { effective_date: isoDay(0), warnings: [], ...req.body },
  })),
  route("post", "/employees/:id/transfer/preview", (req) => ({
    data: { effective_date: isoDay(0), warnings: [], ...req.body },
  })),
  route("post", "/employees/:id/terminate/preview", (req) => ({
    data: { effective_date: isoDay(0), final_settlement: 12_400, warnings: [], ...req.body },
  })),
  route("post", "/employees/:id/salary/preview", (req) => ({
    data: { effective_date: isoDay(0), warnings: [], ...req.body },
  })),

  route("post", "/employees/export", () => ({
    data: { export_id: "exp-hr-1", status: "ready", download_url: "#" },
  })),
  route("get", "/employees/export/:id", () => ({
    data: { export_id: "exp-hr-1", status: "ready", download_url: "#" },
  })),

  /* ------------------------------- Org --------------------------------- */

  route("get", "/branches/:id/departments", (req) => ({
    data: collection("departments").filter((d) => d.branch_id === req.vars.id),
  })),

  route("get", "/branches/:id/headcount", (req) => {
    const branch = findRow("branches", req.vars.id)
    return {
      data: {
        headcount_budget: Number(branch?.headcount_budget ?? 0),
        headcount_filled: Number(branch?.headcount_filled ?? 0),
        headcount_vacant: Number(branch?.headcount_vacant ?? 0),
      },
    }
  }),

  route("get", "/branches/:id/hierarchy", (req) => ({
    data: {
      ...(findRow("branches", req.vars.id) ?? {}),
      children: collection("departments").filter((d) => d.branch_id === req.vars.id),
    },
  })),

  route("get", "/departments/:id/positions", (req) => ({
    data: collection("positions").filter((p) => p.dept_id === req.vars.id),
  })),

  route("get", "/departments/:id/tree", (req) => ({
    data: {
      ...(findRow("departments", req.vars.id) ?? {}),
      children: [],
      positions: collection("positions").filter((p) => p.dept_id === req.vars.id),
    },
  })),

  route("get", "/cost-centers/:id/hierarchy", (req) => ({
    data: { ...(findRow("cost-centers", req.vars.id) ?? {}), children: [] },
  })),

  route("get", "/cost-centers/:id/salary-summary", (req) => ({
    data: findRow("cost-centers", req.vars.id)?.salary_summary ?? {
      headcount: 0,
      avg_salary: 0,
      total_cost: 0,
    },
  })),

  route("get", "/jobs/families", () => ({
    data: ["Engineering", "Sales", "General"].map((name, i) => ({
      id: `fam-${i + 1}`,
      name,
      job_count: collection("jobs").filter((j) => j.job_family === name).length,
    })),
  })),

  route("post", "/job-grades/validate-band", (req) => ({
    data: { valid: true, message: null, ...req.body },
  })),

  /* --------------------------- Notifications --------------------------- */

  route("get", "/notifications", (req) => {
    let rows = collection("notifications")
    if (req.params.is_read !== undefined) {
      const want = String(req.params.is_read) === "true"
      rows = rows.filter((n) => Boolean(n.is_read) === want)
    }
    if (req.params.type) {
      rows = rows.filter((n) => n.type === req.params.type)
    }
    const { rows: page, meta } = paginate(rows, req.params)
    return { data: page, meta }
  }),

  route("put", "/notifications/read-all", () => {
    for (const row of collection("notifications")) {
      row.is_read = true
      row.status = "read"
      row.status_label = "Read"
    }
    return { data: null }
  }),

  route("put", "/notifications/:id/read", (req) => {
    const row = findRow("notifications", req.vars.id)
    if (row) {
      row.is_read = true
      row.status = "read"
      row.status_label = "Read"
    }
    return { data: null }
  }),

  /* ------------------------ Contracts & documents ---------------------- */

  route("get", "/contracts/expiring", () => ({
    data: collection("contracts").filter(
      (c) => Number(c.days_to_expiry) >= 0 && Number(c.days_to_expiry) <= 90,
    ),
  })),

  route("get", "/documents/expiring", () => ({
    data: collection("documents").filter(
      (d) => Number(d.days_to_expiry) >= 0 && Number(d.days_to_expiry) <= 90,
    ),
  })),

  /* ------------------------------ Leave -------------------------------- */

  route("get", "/leave/balances/me", () => ({
    data: [
      { leave_type_id: "lt-1", leave_type_name: "Annual", entitled_days: 21, used_days: 8, remaining_days: 13 },
      { leave_type_id: "lt-2", leave_type_name: "Sick", entitled_days: 10, used_days: 2, remaining_days: 8 },
      { leave_type_id: "lt-3", leave_type_name: "Unpaid", entitled_days: 0, used_days: 0, remaining_days: 0 },
    ],
  })),

  route("get", "/leave/requests/me", (req) => {
    const { rows, meta } = paginate(collection("leave/requests").slice(0, 8), req.params)
    return { data: rows, meta }
  }),

  route("post", "/leave/requests/:id/cancel", (req) => ({
    data:
      updateRow("leave/requests", req.vars.id, { status: "cancelled" }) ?? null,
  })),

  route("get", "/leave/requests/pending", (req) => {
    const pending = collection("leave/requests").filter((r) => r.status === "pending")
    const { rows, meta } = paginate(pending, req.params)
    return { data: rows, meta }
  }),


  /* ---------------------------- Approvals ------------------------------ */

  route("get", "/approvals/pending/me", (req) => {
    const pending = collection("approvals/requests").filter(
      (a) => a.status === "PENDING",
    )
    const { rows, meta } = paginate(pending, req.params)
    return { data: rows, meta }
  }),

  route("get", "/approvals/requests", (req) => {
    const filtered = applyFilters(collection("approvals/requests"), req.params)
    const { rows, meta } = paginate(filtered, req.params)
    return { data: rows, meta }
  }),

  route("get", "/approvals/requests/:id", (req) => ({
    data: findRow("approvals/requests", req.vars.id) ?? null,
  })),

  // Decisions have to land on the stored row, otherwise the Approvals tab
  // reverts the moment react-query refetches.
  ...(
    [
      ["approve", "APPROVED"],
      ["reject", "REJECTED"],
      ["return", "RETURNED"],
      ["delegate", "PENDING"],
    ] as const
  ).map(([action, status]) =>
    route("post", `/approvals/requests/:id/${action}`, (req) => ({
      data:
        updateRow("approvals/requests", req.vars.id, {
          status,
          decided_at: isoDay(0),
          decision_note: (req.body.note as string) ?? null,
        }) ?? null,
    })),
  ),

  /* ----------------------------- Reports ------------------------------- */

  route("get", "/dashboard/kpi", () => ({
    data: {
      active_employees: EMPLOYEE_LIST_META.total_headcount,
      new_hires_mtd: 6,
      terminations_mtd: 2,
      open_vacancies: EMPLOYEE_LIST_META.open_positions,
      expiring_contracts_90d: collection("contracts").filter(
        (c) => Number(c.days_to_expiry) >= 0 && Number(c.days_to_expiry) <= 90,
      ).length,
      pending_documents: collection("documents").filter(
        (d) => d.verification_status === "pending",
      ).length,
    },
  })),

  route("get", "/reports/headcount", (req) => {
    const groupBy = String(req.params.group_by ?? "dept_id")
    const buckets = new Map<string, { headcount: number; active: number; on_leave: number }>()
    for (const employee of collection("employees")) {
      const key = String(employee[groupBy] ?? "unknown")
      const bucket = buckets.get(key) ?? { headcount: 0, active: 0, on_leave: 0 }
      bucket.headcount += 1
      if (employee.employment_status === "active") bucket.active += 1
      if (employee.employment_status === "on_leave") bucket.on_leave += 1
      buckets.set(key, bucket)
    }
    return {
      data: {
        group_by: groupBy,
        rows: [...buckets.entries()].map(([key, value]) => ({
          group_key: key,
          group_label: groupLabel(groupBy, key),
          headcount: value.headcount,
          active: value.active,
          on_leave: value.on_leave,
          probation: 0,
        })),
      },
    }
  }),

  route("get", "/reports/attrition", () => {
    const rand = makeRandom(55_000)
    return {
      data: {
        rows: monthLabels(12).map((month, i) => {
          const terminations = intBetween(rand, 0, 5)
          const headcountStart = 120 + i
          return {
            period: month,
            terminations,
            headcount_start: headcountStart,
            attrition_rate_pct:
              Math.round((terminations / headcountStart) * 1000) / 10,
            reason_breakdown: {
              resignation: Math.max(0, terminations - 1),
              termination: terminations > 0 ? 1 : 0,
            },
          }
        }),
      },
    }
  }),

  route("get", "/reports/salary-cost", (req) => {
    const groupBy = String(req.params.group_by ?? "dept_id")
    const buckets = new Map<string, { headcount: number; gross: number }>()
    for (const employee of collection("employees")) {
      const key = String(employee[groupBy] ?? "unknown")
      const bucket = buckets.get(key) ?? { headcount: 0, gross: 0 }
      bucket.headcount += 1
      bucket.gross += Number(employee.base_salary ?? 0)
      buckets.set(key, bucket)
    }
    return {
      data: {
        group_by: groupBy,
        rows: [...buckets.entries()].map(([key, value]) => ({
          group_key: key,
          group_label: groupLabel(groupBy, key),
          headcount: value.headcount,
          total_gross: String(value.gross),
          total_net: String(Math.round(value.gross * 0.82)),
          avg_gross: String(Math.round(value.gross / value.headcount)),
        })),
      },
    }
  }),

  route("get", "/reports/tenure", () => {
    const buckets = [
      { label: "< 1 year", count: 0, min: 0, max: 365 },
      { label: "1–3 years", count: 0, min: 365, max: 1_095 },
      { label: "3–5 years", count: 0, min: 1_095, max: 1_825 },
      { label: "5+ years", count: 0, min: 1_825, max: Infinity },
    ]
    const today = Date.parse(isoDay(0))
    for (const employee of collection("employees")) {
      const days = (today - Date.parse(String(employee.hire_date))) / 86_400_000
      const bucket = buckets.find((b) => days >= b.min && days < b.max)
      if (bucket) bucket.count += 1
    }
    const total = collection("employees").length
    return {
      data: {
        buckets: buckets.map(({ label, count }) => ({
          label,
          count,
          percentage: total ? Math.round((count / total) * 1000) / 10 : 0,
        })),
        total_employees: total,
        avg_tenure_years: EMPLOYEE_LIST_META.avg_tenure_years,
      },
    }
  }),

  route("get", "/reports/document-compliance", () => ({
    data: {
      rows: collection("documents").slice(0, 40).map((doc) => ({
        document_id: String(doc.id),
        employee_id: String(doc.employee_id),
        employee_name: String(doc.employee_name),
        employee_number: String(doc.employee_id).replace("emp-", "EMP-"),
        document_type: String(doc.document_type),
        document_title: String(doc.document_name),
        expiry_date: String(doc.expiry_date),
        days_until_expiry: Number(doc.days_to_expiry),
        status:
          Number(doc.days_to_expiry) < 0
            ? "expired"
            : Number(doc.days_to_expiry) < 60
              ? "expiring"
              : "valid",
        is_mandatory: true,
      })),
    },
  })),

  /* ------------------------ Performance & training ---------------------- */

  route("get", "/performance/appraisals/me", (req) => {
    const mine = collection("performance/appraisals").filter(
      (a) => a.employee_id === "emp-1" || a.reviewer_emp_id === "emp-1",
    )
    const { rows, meta } = paginate(mine, req.params)
    return { data: rows, meta }
  }),

  route("get", "/performance/cycles/:id/appraisals", (req) => ({
    data: collection("performance/appraisals").filter(
      (a) => a.cycle_id === req.vars.id,
    ),
  })),

  route("get", "/performance/feedback/pending", () => ({
    data: FEEDBACK_REQUEST_ROWS.filter((f) => f.status === "pending"),
  })),

  route("get", "/training/certifications/me", () => ({
    data: collection("training/certifications").filter(
      (c) => c.employee_id === "emp-1",
    ),
  })),

  route("get", "/training/sessions/:id/feedback-summary", (req) => ({
    data: {
      session_id: req.vars.id,
      responses: 12,
      average_rating: 4.3,
      would_recommend_pct: 88,
      comments: [],
    },
  })),

  route("get", "/training/employees/:empId/skill-gaps/:roleId", (req) => ({
    data: collection("training/skills")
      .slice(0, 6)
      .map((skill, i) => ({
        skill_id: String(skill.skill_id),
        skill_name: String(skill.skill_name),
        required_level: 4,
        current_level: Math.max(1, 4 - (i % 3)),
        gap: i % 3,
        employee_id: req.vars.empId,
      })),
  })),

  route("get", "/salary/analytics", () => {
    const employees = collection("employees")
    const total = employees.reduce((sum, e) => sum + Number(e.base_salary ?? 0), 0)
    return {
      data: {
        total_payroll: total,
        avg_salary: Math.round(total / Math.max(1, employees.length)),
        median_salary: 68_500,
        currency_code: "USD",
        by_department: DEPARTMENTS.map((name, i) => {
          const rows = employees.filter((e) => e.dept_id === `dept-${i + 1}`)
          const sum = rows.reduce((acc, e) => acc + Number(e.base_salary ?? 0), 0)
          return {
            dept_id: `dept-${i + 1}`,
            dept_name: name,
            headcount: rows.length,
            total_cost: sum,
            avg_salary: rows.length ? Math.round(sum / rows.length) : 0,
          }
        }),
        monthly_trend: monthLabels(12).map((month, i) => ({
          month,
          total_cost: Math.round(total / 12) + i * 1_500,
        })),
      },
    }
  }),
]

function buildLeaveRequests(): Row[] {
  const types = ["Annual", "Sick", "Unpaid", "Maternity"] as const
  const statuses = ["pending", "approved", "approved", "rejected"] as const
  return Array.from({ length: 30 }, (_, i) => {
    const rand = makeRandom(61_000 + i)
    const employee = EMPLOYEE_ROWS[i % EMPLOYEE_ROWS.length]
    const days = intBetween(rand, 1, 12)
    const start = -intBetween(rand, -60, 120)
    return {
      id: `lr-${i + 1}`,
      request_number: `LV-${1_000 + i}`,
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_number: employee.employee_number,
      leave_type_id: `lt-${(i % 4) + 1}`,
      leave_type_name: types[i % types.length],
      start_date: isoDay(start),
      end_date: isoDay(start + days),
      total_days: days,
      status: statuses[i % statuses.length],
      reason: "Personal time off",
      submitted_at: isoDay(start - 7),
      approver_name: "Demo Admin",
    }
  })
}

function buildApprovals(): Row[] {
  const types = ["TRANSFER", "PROMOTION", "TERMINATION", "SALARY_CHANGE", "LEAVE"] as const
  const statuses = ["PENDING", "PENDING", "APPROVED", "REJECTED"] as const
  return Array.from({ length: 26 }, (_, i) => {
    const rand = makeRandom(71_000 + i)
    const employee = EMPLOYEE_ROWS[i % EMPLOYEE_ROWS.length]
    const type = types[i % types.length]
    return {
      id: `apr-${i + 1}`,
      requestNumber: `APR-${String(40 + i).padStart(4, "0")}`,
      request_number: `APR-${String(40 + i).padStart(4, "0")}`,
      type,
      request_type: type,
      employee_id: employee.id,
      employeeName: employee.full_name,
      employee_name: employee.full_name,
      employeeNumber: employee.employee_number,
      employee_number: employee.employee_number,
      requestedBy: "Laila Adel",
      requested_by: "Laila Adel",
      dateSubmitted: isoDay(-intBetween(rand, 1, 45)),
      submitted_at: isoDay(-intBetween(rand, 1, 45)),
      detailsSummary: `${type.replace(/_/g, " ").toLowerCase()} request`,
      status: statuses[i % statuses.length],
      effectiveDate: isoDay(intBetween(rand, 1, 60)),
      effective_date: isoDay(intBetween(rand, 1, 60)),
      reason: "Business need",
      workflowSteps: [],
    }
  })
}
