import type { Row } from "../demo-db"
import {
  BRANCHES,
  DEPARTMENTS,
  JOB_TITLES,
  emailFor,
  intBetween,
  isoDateTime,
  isoDay,
  makeRandom,
  moneyBetween,
  personName,
  pick,
} from "./faker"

const EMPLOYEE_COUNT = 128

export const BRANCH_ROWS: Row[] = BRANCHES.map((name, i) => ({
  id: `br-${i + 1}`,
  branch_code: `BR-${String(i + 1).padStart(3, "0")}`,
  branch_name: name,
  branch_name_local: null,
  branch_type: i === 0 ? "head_office" : "branch",
  parent_branch_id: i === 0 ? null : "br-1",
  is_head_office: i === 0,
  is_active: true,
  established_date: isoDay(-1200 - i * 180),
  profile: {
    branch_type: i === 0 ? "head_office" : "branch",
    established_date: isoDay(-1200 - i * 180),
    manager_emp_id: `emp-${i + 1}`,
    tax_id: `TAX-${10000 + i}`,
  },
  contacts: {
    phone: `+20 2 ${2000000 + i * 7919}`,
    email: `${name.toLowerCase().replace(/\s+/g, "-")}@nucleus-demo.com`,
    address: {
      line1: `${10 + i} Corniche Road`,
      line2: null,
      city: name.split(" ")[0],
      country_code: i === 3 ? "AE" : i === 4 ? "SA" : "EG",
      postal_code: `1${1000 + i}`,
    },
  },
  departments: [],
  headcount: { budget: 40 - i * 5, filled: 32 - i * 4, vacant: 8 - i },
  headcount_budget: 40 - i * 5,
  headcount_filled: 32 - i * 4,
  headcount_vacant: 8 - i,
  created_at: isoDateTime(-8760),
  updated_at: isoDateTime(-240),
}))

export const DEPARTMENT_ROWS: Row[] = DEPARTMENTS.map((name, i) => {
  const budget = intBetween(makeRandom(300 + i), 10, 32)
  const filled = Math.max(4, budget - intBetween(makeRandom(700 + i), 0, 6))
  const type =
    name === "Engineering"
      ? "technical"
      : name === "Finance" || name === "Legal"
        ? "administrative"
        : name === "Operations"
          ? "operational"
          : "support"
  return {
    id: `dept-${i + 1}`,
    dept_code: `DP-${String(i + 1).padStart(3, "0")}`,
    dept_name: name,
    dept_name_local: null,
    dept_type: type,
    branch_id: `br-${(i % BRANCHES.length) + 1}`,
    parent_dept_id: null,
    is_active: true,
    effective_date: isoDay(-900),
    profile: {
      dept_type: type,
      effective_date: isoDay(-900),
      manager_emp_id: `emp-${i + 2}`,
      cost_centre_id: `cc-${i + 1}`,
    },
    headcount: { budget, filled, vacant: budget - filled },
    headcount_budget: budget,
    headcount_filled: filled,
    headcount_vacant: budget - filled,
    positions: [],
    created_at: isoDateTime(-8000),
    updated_at: isoDateTime(-120),
  }
})

const GRADE_DEFS = [
  { code: "G1", name: "Entry", level: 1, category: "operational", min: 28_000, max: 42_000 },
  { code: "G2", name: "Associate", level: 2, category: "administrative", min: 38_000, max: 58_000 },
  { code: "G3", name: "Professional", level: 3, category: "professional", min: 52_000, max: 82_000 },
  { code: "G4", name: "Senior Professional", level: 4, category: "technical", min: 75_000, max: 110_000 },
  { code: "G5", name: "Manager", level: 5, category: "management", min: 95_000, max: 145_000 },
  { code: "G6", name: "Director", level: 6, category: "management", min: 130_000, max: 190_000 },
  { code: "G7", name: "Executive", level: 7, category: "executive", min: 180_000, max: 280_000 },
] as const

export const JOB_GRADE_ROWS: Row[] = GRADE_DEFS.map((g, i) => ({
  id: `grade-${i + 1}`,
  grade_code: g.code,
  grade_name: g.name,
  grade_level: g.level,
  grade_category: g.category,
  description: `${g.name} band`,
  min_salary: g.min,
  mid_salary: Math.round((g.min + g.max) / 2),
  max_salary: g.max,
  currency_code: "USD",
  salary_band: {
    min: g.min,
    mid: Math.round((g.min + g.max) / 2),
    max: g.max,
    currency_code: "USD",
  },
  entitlements: {
    overtime_eligible: g.level <= 3,
    annual_leave_days: 18 + g.level,
    sick_leave_days: 10,
  },
  overtime_eligible: g.level <= 3,
  annual_leave_days: 18 + g.level,
  sick_leave_days: 10,
  employee_count: intBetween(makeRandom(90 + i), 6, 30),
  position_count: intBetween(makeRandom(190 + i), 3, 14),
  linked_jobs: [],
  is_active: true,
}))

export const JOB_ROWS: Row[] = JOB_TITLES.map((title, i) => ({
  id: `job-${i + 1}`,
  job_code: `JOB-${String(i + 1).padStart(3, "0")}`,
  job_title: title,
  job_family: title.includes("Engineer")
    ? "Engineering"
    : title.includes("Sales") || title.includes("Account")
      ? "Sales"
      : "General",
  job_grade_id: `grade-${(i % GRADE_DEFS.length) + 1}`,
  description: `${title} role profile`,
  is_active: true,
}))

export const POSITION_ROWS: Row[] = JOB_TITLES.map((title, i) => {
  const rand = makeRandom(500 + i)
  const budget = intBetween(rand, 1, 8)
  const filled = intBetween(rand, 0, budget)
  const vacant = budget - filled
  return {
    id: `pos-${i + 1}`,
    position_title: title,
    position_code: `POS-${String(i + 1).padStart(3, "0")}`,
    dept_id: `dept-${(i % DEPARTMENTS.length) + 1}`,
    branch_id: `br-${(i % BRANCHES.length) + 1}`,
    job_id: `job-${i + 1}`,
    job_grade_id: `grade-${(i % GRADE_DEFS.length) + 1}`,
    cost_centre_id: `cc-${(i % DEPARTMENTS.length) + 1}`,
    headcount_budget: budget,
    headcount_filled: filled,
    headcount_vacant: vacant,
    vacancy_status: vacant === 0 ? "filled" : filled === 0 ? "open" : "partial",
    position_status: vacant === 0 ? "filled" : "open",
    is_budgeted: true,
    is_active: true,
    effective_date: isoDay(-600 + i * 10),
  }
})

export const COST_CENTER_ROWS: Row[] = DEPARTMENTS.map((name, i) => {
  const rand = makeRandom(800 + i)
  const budget = moneyBetween(rand, 250_000, 1_400_000, 1_000)
  const actual = Math.round(budget * (0.55 + rand() * 0.5))
  const headcount = intBetween(rand, 5, 26)
  const avg = moneyBetween(rand, 45_000, 120_000, 500)
  return {
    id: `cc-${i + 1}`,
    cc_code: `CC-${String(i + 1).padStart(3, "0")}`,
    cc_name: `${name} Cost Centre`,
    cc_name_local: null,
    cc_type: "cost_centre",
    account_code: `4${100 + i}`,
    currency_code: "USD",
    fiscal_year: 2026,
    parent_cc_id: null,
    branch_id: `br-${(i % BRANCHES.length) + 1}`,
    dept_id: `dept-${i + 1}`,
    is_active: true,
    budget: {
      budget_amount: budget,
      actual_amount: actual,
      utilization_pct: Math.round((actual / budget) * 1000) / 10,
      overage_warning: actual > budget,
    },
    salary_summary: {
      headcount,
      avg_salary: avg,
      total_cost: headcount * avg,
    },
  }
})

const STATUSES = ["active", "active", "active", "active", "on_leave", "inactive"] as const
const TYPES = ["full_time", "full_time", "full_time", "part_time", "contract"] as const

export const EMPLOYEE_ROWS: Row[] = Array.from({ length: EMPLOYEE_COUNT }, (_, i) => {
  const rand = makeRandom(2_000 + i * 31)
  const name = personName(rand)
  const [first, last] = name.split(" ")
  const status = i < 3 ? "active" : pick(rand, STATUSES)
  const deptIndex = i % DEPARTMENTS.length
  const branchIndex = i % BRANCHES.length
  const hireDate = isoDay(-intBetween(rand, 60, 2_400))
  const employmentType = pick(rand, TYPES)

  return {
    id: `emp-${i + 1}`,
    employee_number: `EMP-${String(i + 1).padStart(4, "0")}`,
    full_name: name,
    avatar_initials: `${first[0]}${last[0]}`.toUpperCase(),
    dept_id: `dept-${deptIndex + 1}`,
    position_id: `pos-${(i % JOB_TITLES.length) + 1}`,
    branch_id: `br-${branchIndex + 1}`,
    job_grade_id: `grade-${(i % GRADE_DEFS.length) + 1}`,
    manager_id: i < 6 ? null : `emp-${(i % 5) + 1}`,
    employment_status: status,
    employment_type: employmentType,
    hire_date: hireDate,
    is_active: status === "active" || status === "on_leave",
    personal_info: {
      first_name: first,
      last_name: last,
      date_of_birth: isoDay(-intBetween(rand, 8_000, 16_000)),
      gender: pick(rand, ["male", "female"] as const),
      marital_status: pick(rand, ["single", "married"] as const),
      nationality: "Egyptian",
      national_id: `29${800_000_000 + i * 1237}`,
      blood_type: pick(rand, ["A+", "B+", "O+", "AB+"] as const),
    },
    contact: {
      email_work: emailFor(name),
      phone_mobile: `+20 10 ${10_000_000 + i * 7919}`,
    },
    address: {
      city: BRANCHES[branchIndex].split(" ")[0],
      country: branchIndex === 3 ? "UAE" : branchIndex === 4 ? "Saudi Arabia" : "Egypt",
    },
    employment: {
      branch_id: `br-${branchIndex + 1}`,
      dept_id: `dept-${deptIndex + 1}`,
      position_id: `pos-${(i % JOB_TITLES.length) + 1}`,
      job_grade_id: `grade-${(i % GRADE_DEFS.length) + 1}`,
      manager_id: i < 6 ? null : `emp-${(i % 5) + 1}`,
      employment_status: status,
      employment_type: employmentType,
      hire_date: hireDate,
    },
    base_salary: moneyBetween(rand, 32_000, 190_000, 500),
    currency_code: "USD",
  }
})

export const EMPLOYEE_LIST_META = {
  total_headcount: EMPLOYEE_ROWS.filter((e) => e.is_active).length,
  open_positions: POSITION_ROWS.reduce(
    (sum, p) => sum + Number(p.headcount_vacant ?? 0),
    0,
  ),
  avg_tenure_years: 3.4,
  department_count: DEPARTMENT_ROWS.length,
}

const NOTIFICATION_TEMPLATES = [
  { type: "leave_request", label: "Leave Request", title: "Leave request awaiting approval" },
  { type: "contract_expiry", label: "Contract Expiry", title: "Contract expiring in 30 days" },
  { type: "document_expiry", label: "Document Expiry", title: "Work permit expires soon" },
  { type: "approval", label: "Approval", title: "Promotion request needs your decision" },
  { type: "payroll", label: "Payroll", title: "September payroll is ready for review" },
] as const

export const NOTIFICATION_ROWS: Row[] = Array.from({ length: 12 }, (_, i) => {
  const rand = makeRandom(4_500 + i)
  const template = pick(rand, NOTIFICATION_TEMPLATES)
  const isRead = i >= 4
  return {
    id: `ntf-${i + 1}`,
    type: template.type,
    type_label: template.label,
    status: isRead ? "read" : "unread",
    status_label: isRead ? "Read" : "Unread",
    title: template.title,
    message: `${personName(rand)} — ${template.label.toLowerCase()} for your attention.`,
    related_record: null,
    is_read: isRead,
    read_at: isRead ? isoDateTime(-i * 5) : null,
    created_at: isoDateTime(-i * 7 - 1),
  }
})

export const CONTRACT_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 48).map((emp, i) => {
  const rand = makeRandom(6_000 + i)
  const endOffset = intBetween(rand, -40, 420)
  return {
    id: `ctr-${i + 1}`,
    employee_id: emp.id,
    employee_name: emp.full_name,
    employee_number: emp.employee_number,
    contract_number: `CTR-${1_000 + i}`,
    contract_type: pick(rand, ["permanent", "fixed_term", "probation"] as const),
    start_date: isoDay(-intBetween(rand, 200, 1_400)),
    end_date: isoDay(endOffset),
    status: endOffset < 0 ? "expired" : endOffset < 60 ? "expiring" : "active",
    is_active: endOffset >= 0,
    days_to_expiry: endOffset,
    basic_salary: emp.base_salary,
    currency_code: "USD",
  }
})

export const HR_DOCUMENT_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 60).map((emp, i) => {
  const rand = makeRandom(9_000 + i)
  const expires = intBetween(rand, -30, 500)
  return {
    id: `doc-${i + 1}`,
    employee_id: emp.id,
    employee_name: emp.full_name,
    document_type: pick(
      rand,
      ["passport", "national_id", "work_permit", "certificate", "contract"] as const,
    ),
    document_name: `Document ${i + 1}`,
    file_name: `document-${i + 1}.pdf`,
    issue_date: isoDay(-intBetween(rand, 200, 1_800)),
    expiry_date: isoDay(expires),
    days_to_expiry: expires,
    verification_status: pick(rand, ["verified", "pending", "rejected"] as const),
    status: expires < 0 ? "expired" : "valid",
    uploaded_at: isoDateTime(-intBetween(rand, 100, 4_000)),
  }
})

export const EMERGENCY_CONTACT_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 70).map((emp, i) => {
  const rand = makeRandom(11_000 + i)
  const name = personName(rand)
  return {
    id: `ec-${i + 1}`,
    employee_id: emp.id,
    employee_name: emp.full_name,
    contact_name: name,
    relationship: pick(rand, ["spouse", "parent", "sibling", "friend"] as const),
    phone_primary: `+20 11 ${20_000_000 + i * 3571}`,
    phone_secondary: null,
    email: emailFor(name),
    is_primary: true,
    address: "Cairo, Egypt",
  }
})
