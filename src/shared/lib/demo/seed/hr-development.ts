import type { Row } from "../demo-db"
import { EMPLOYEE_ROWS } from "./core-hr"
import {
  intBetween,
  isoDateTime,
  isoDay,
  makeRandom,
  moneyBetween,
  personName,
  pick,
} from "./faker"

/**
 * Performance and Training fixtures.
 *
 * These modules key their records on a domain id (`cycle_id`, `course_id`, …)
 * rather than `id`. Each row carries both: `id` is what `demo-db` matches on,
 * the domain field is what the UI reads.
 */

/* -------------------------------------------------------------------------- */
/*                                Performance                                 */
/* -------------------------------------------------------------------------- */

export const REVIEW_CYCLE_ROWS: Row[] = [
  {
    id: "cyc-1",
    cycle_id: "cyc-1",
    cycle_name: "FY2026 Annual Review",
    cycle_type: "annual",
    status: "manager_review",
    is_active: true,
    period_start: isoDay(-260),
    period_end: isoDay(30),
    rating_scale: 5,
    phases_json: [
      { name: "Goal setting", starts_at: isoDay(-260), ends_at: isoDay(-200) },
      { name: "Self review", starts_at: isoDay(-40), ends_at: isoDay(-10) },
      { name: "Manager review", starts_at: isoDay(-9), ends_at: isoDay(14) },
      { name: "Calibration", starts_at: isoDay(15), ends_at: isoDay(30) },
    ],
    created_at: isoDateTime(-6_500),
    updated_at: isoDateTime(-200),
  },
  {
    id: "cyc-2",
    cycle_id: "cyc-2",
    cycle_name: "Q3 2026 Check-in",
    cycle_type: "quarterly",
    status: "completed",
    is_active: false,
    period_start: isoDay(-170),
    period_end: isoDay(-80),
    rating_scale: 5,
    phases_json: [],
    created_at: isoDateTime(-4_200),
    updated_at: isoDateTime(-1_900),
  },
  {
    id: "cyc-3",
    cycle_id: "cyc-3",
    cycle_name: "New Joiner Probation",
    cycle_type: "probation",
    status: "active",
    is_active: true,
    period_start: isoDay(-60),
    period_end: isoDay(30),
    rating_scale: 5,
    phases_json: [],
    created_at: isoDateTime(-1_500),
    updated_at: isoDateTime(-100),
  },
]

const KPI_DEFS = [
  { code: "REV", name: "Revenue attainment", category: "Commercial", unit: "USD", type: "currency", dir: "higher_better" },
  { code: "CSAT", name: "Customer satisfaction", category: "Quality", unit: "%", type: "percentage", dir: "higher_better" },
  { code: "TTH", name: "Time to hire", category: "People", unit: "days", type: "number", dir: "lower_better" },
  { code: "DEF", name: "Defect escape rate", category: "Quality", unit: "%", type: "percentage", dir: "lower_better" },
  { code: "UTIL", name: "Billable utilisation", category: "Delivery", unit: "%", type: "percentage", dir: "higher_better" },
  { code: "CHURN", name: "Logo churn", category: "Commercial", unit: "%", type: "percentage", dir: "lower_better" },
  { code: "OTD", name: "On-time delivery", category: "Delivery", unit: "%", type: "percentage", dir: "higher_better" },
  { code: "SAFE", name: "Safety incidents", category: "Operations", unit: "count", type: "number", dir: "lower_better" },
] as const

export const KPI_ROWS: Row[] = KPI_DEFS.map((def, i) => ({
  id: `kpi-${i + 1}`,
  kpi_id: `kpi-${i + 1}`,
  kpi_code: def.code,
  kpi_name: def.name,
  category: def.category,
  unit: def.unit,
  direction: def.dir,
  measurement_type: def.type,
  formula: null,
  data_source: "Nucleus",
  description: `${def.name} tracked per review cycle.`,
  is_active: true,
  created_at: isoDateTime(-5_000),
  updated_at: isoDateTime(-400),
}))

const GOAL_TITLES = [
  "Grow ARR in the Delta region",
  "Cut onboarding time for new hires",
  "Ship the self-service billing portal",
  "Raise NPS above 45",
  "Close the ISO 27001 gap analysis",
  "Reduce month-end close to 3 days",
  "Launch the partner referral programme",
  "Improve sprint predictability to 85%",
  "Roll out the new expense policy",
  "Hire and ramp 4 account executives",
] as const

const GOAL_STATUSES = ["active", "in_progress", "completed", "approved", "submitted"] as const

export const GOAL_ROWS: Row[] = GOAL_TITLES.map((title, i) => {
  const rand = makeRandom(500_000 + i)
  const status = GOAL_STATUSES[i % GOAL_STATUSES.length]
  const owner = EMPLOYEE_ROWS[i % EMPLOYEE_ROWS.length]
  return {
    id: `goal-${i + 1}`,
    goal_id: `goal-${i + 1}`,
    title,
    goal_type: i % 3 === 0 ? "okr" : "smart",
    category: pick(rand, ["Growth", "Quality", "People", "Efficiency"] as const),
    status,
    progress_pct: status === "completed" ? 100 : intBetween(rand, 5, 90),
    weight_pct: 20,
    start_date: isoDay(-intBetween(rand, 60, 250)),
    due_date: isoDay(intBetween(rand, -20, 120)),
    cycle_id: "cyc-1",
    parent_goal_id: null,
    owner_emp_id: String(owner.id),
    owner_name: String(owner.full_name),
    created_at: isoDateTime(-3_000),
    updated_at: isoDateTime(-300),
  }
})

const APPRAISAL_STATUSES = [
  "self_submitted", "manager_in_progress", "manager_submitted", "finalised", "acknowledged", "pending",
] as const

export const APPRAISAL_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 24).map((employee, i) => {
  const rand = makeRandom(510_000 + i)
  const status = APPRAISAL_STATUSES[i % APPRAISAL_STATUSES.length]
  const selfScore = status === "pending" ? null : Math.round(intBetween(rand, 30, 50) / 10 * 10) / 10
  const managerScore =
    status === "pending" || status === "self_submitted"
      ? null
      : Math.round(intBetween(rand, 28, 50) / 10 * 10) / 10
  return {
    id: `apr-p-${i + 1}`,
    appraisal_id: `apr-p-${i + 1}`,
    cycle_id: "cyc-1",
    employee_id: String(employee.id),
    reviewer_emp_id: `emp-${(i % 5) + 1}`,
    status,
    self_score: selfScore,
    manager_score: managerScore,
    final_score: managerScore,
    self_submitted_at: selfScore ? isoDateTime(-intBetween(rand, 100, 900)) : null,
    manager_submitted_at: managerScore ? isoDateTime(-intBetween(rand, 20, 90)) : null,
    acknowledged_at: status === "acknowledged" ? isoDateTime(-intBetween(rand, 1, 20)) : null,
    cycle: REVIEW_CYCLE_ROWS[0],
    employee: { id: String(employee.id), full_name: String(employee.full_name) },
    ratings: [],
    created_at: isoDateTime(-2_000),
    updated_at: isoDateTime(-100),
  }
})

export const FEEDBACK_REQUEST_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 9).map((employee, i) => {
  const rand = makeRandom(520_000 + i)
  return {
    id: `fb-${i + 1}`,
    request_id: `fb-${i + 1}`,
    cycle_id: "cyc-1",
    subject_emp_id: String(employee.id),
    subject_name: String(employee.full_name),
    reviewer_emp_id: `emp-${(i % 6) + 1}`,
    reviewer_name: personName(rand),
    relationship: pick(rand, ["peer", "manager", "report", "stakeholder"] as const),
    status: i < 5 ? "pending" : "submitted",
    due_date: isoDay(intBetween(rand, 2, 30)),
    requested_at: isoDateTime(-intBetween(rand, 40, 500)),
  }
})

/* -------------------------------------------------------------------------- */
/*                                  Training                                  */
/* -------------------------------------------------------------------------- */

const COURSE_DEFS = [
  { name: "Workplace Safety Essentials", category: "Compliance", level: "beginner", hours: 4, mandatory: true },
  { name: "Anti-Harassment Training", category: "Compliance", level: "beginner", hours: 2, mandatory: true },
  { name: "Data Protection & GDPR", category: "Compliance", level: "intermediate", hours: 3, mandatory: true },
  { name: "Leading High-Performing Teams", category: "Leadership", level: "advanced", hours: 16, mandatory: false },
  { name: "Difficult Conversations", category: "Leadership", level: "intermediate", hours: 8, mandatory: false },
  { name: "Financial Modelling Basics", category: "Finance", level: "beginner", hours: 12, mandatory: false },
  { name: "Advanced Excel for Analysts", category: "Finance", level: "advanced", hours: 20, mandatory: false },
  { name: "Consultative Selling", category: "Sales", level: "intermediate", hours: 14, mandatory: false },
  { name: "Nucleus Platform Onboarding", category: "Product", level: "beginner", hours: 6, mandatory: true },
  { name: "Secure Coding Practices", category: "Engineering", level: "advanced", hours: 18, mandatory: false },
  { name: "Project Scheduling with Gantt", category: "Delivery", level: "intermediate", hours: 10, mandatory: false },
  { name: "Customer Success Fundamentals", category: "Support", level: "beginner", hours: 8, mandatory: false },
] as const

export const COURSE_ROWS: Row[] = COURSE_DEFS.map((def, i) => {
  const rand = makeRandom(530_000 + i)
  return {
    id: `crs-${i + 1}`,
    course_id: `crs-${i + 1}`,
    course_code: `CRS-${String(i + 1).padStart(3, "0")}`,
    course_name: def.name,
    category: def.category,
    delivery_mode: pick(rand, ["online", "classroom", "blended"] as const),
    level: def.level,
    duration_hours: def.hours,
    provider: pick(rand, ["Internal Academy", "Coursera", "Local Institute", "Vendor"] as const),
    cost_per_seat: moneyBetween(rand, 0, 1_800, 25),
    currency_code: "USD",
    passing_score: 70,
    validity_months: def.mandatory ? 12 : null,
    is_mandatory: def.mandatory,
    is_active: true,
    program_name: i < 6 ? "Compliance Essentials" : "Professional Development",
    created_at: isoDateTime(-4_000),
    updated_at: isoDateTime(-300),
  }
})

const PROGRAM_DEFS = [
  { name: "Compliance Essentials", category: "Compliance", status: "active" },
  { name: "Professional Development", category: "Development", status: "active" },
  { name: "New Manager Academy", category: "Leadership", status: "active" },
  { name: "Graduate Programme 2026", category: "Early Careers", status: "paused" },
  { name: "Technical Excellence Track", category: "Engineering", status: "draft" },
] as const

export const TRAINING_PROGRAM_ROWS: Row[] = PROGRAM_DEFS.map((def, i) => {
  const rand = makeRandom(540_000 + i)
  return {
    id: `prg-${i + 1}`,
    program_id: `prg-${i + 1}`,
    program_code: `PRG-${String(i + 1).padStart(3, "0")}`,
    program_name: def.name,
    category: def.category,
    description: `${def.name} — structured learning path.`,
    status: def.status,
    provider: "Internal Academy",
    owner_emp_id: `emp-${i + 1}`,
    target_audience: pick(rand, ["All employees", "Managers", "New joiners", "Engineers"] as const),
    total_duration_hours: intBetween(rand, 12, 80),
    cost_per_seat: moneyBetween(rand, 200, 3_500, 50),
    currency_code: "USD",
    max_cohort_size: intBetween(rand, 12, 40),
    start_date: isoDay(-intBetween(rand, 30, 200)),
    end_date: isoDay(intBetween(rand, 30, 240)),
    is_active: def.status === "active",
    enrolled_count: intBetween(rand, 4, 38),
    created_at: isoDateTime(-5_000),
    updated_at: isoDateTime(-250),
  }
})

const SESSION_STATUSES = ["scheduled", "open", "in_progress", "completed", "full"] as const

export const TRAINING_SESSION_ROWS: Row[] = COURSE_ROWS.slice(0, 10).flatMap((course, c) =>
  Array.from({ length: 2 }, (_, i) => {
    const rand = makeRandom(550_000 + c * 5 + i)
    const dayOffset = intBetween(rand, -60, 90)
    const maxSeats = intBetween(rand, 10, 30)
    const status = SESSION_STATUSES[(c + i) % SESSION_STATUSES.length]
    return {
      id: `ses-${c + 1}-${i + 1}`,
      session_id: `ses-${c + 1}-${i + 1}`,
      course_id: String(course.course_id),
      course_name: String(course.course_name),
      cohort_id: null,
      start_datetime: `${isoDay(dayOffset)}T09:00:00.000Z`,
      end_datetime: `${isoDay(dayOffset)}T15:00:00.000Z`,
      trainer_emp_id: `emp-${(c % 10) + 1}`,
      trainer_name: personName(rand),
      external_trainer: null,
      venue: pick(rand, ["Training Room A", "Online — Zoom", "Cairo HQ, 4th floor"] as const),
      delivery_mode: String(course.delivery_mode),
      max_seats: maxSeats,
      enrolled_count: status === "full" ? maxSeats : intBetween(rand, 0, maxSeats),
      status,
    }
  }),
)

const SKILL_DEFS = [
  { name: "SQL", category: "Technical" },
  { name: "Financial Analysis", category: "Finance" },
  { name: "Stakeholder Management", category: "Leadership" },
  { name: "Negotiation", category: "Commercial" },
  { name: "TypeScript", category: "Technical" },
  { name: "Project Scheduling", category: "Delivery" },
  { name: "Public Speaking", category: "Communication" },
  { name: "Risk Assessment", category: "Compliance" },
  { name: "Data Visualisation", category: "Technical" },
  { name: "Coaching", category: "Leadership" },
] as const

export const SKILL_ROWS: Row[] = SKILL_DEFS.map((def, i) => ({
  id: `skl-${i + 1}`,
  skill_id: `skl-${i + 1}`,
  skill_code: `SKL-${String(i + 1).padStart(3, "0")}`,
  skill_name: def.name,
  category: def.category,
  description: `${def.name} proficiency.`,
  max_level: 5,
  is_active: true,
}))

export const CERTIFICATION_ROWS: Row[] = EMPLOYEE_ROWS.slice(0, 34).map((employee, i) => {
  const rand = makeRandom(560_000 + i)
  const course = COURSE_ROWS[i % COURSE_ROWS.length]
  const expires = intBetween(rand, -60, 400)
  return {
    id: `cert-${i + 1}`,
    certification_id: `cert-${i + 1}`,
    employee_id: String(employee.id),
    employee_name: String(employee.full_name),
    course_id: String(course.course_id),
    course_name: String(course.course_name),
    certificate_number: `CERT-${6_000 + i}`,
    issued_date: isoDay(-intBetween(rand, 40, 700)),
    expiry_date: isoDay(expires),
    days_to_expiry: expires,
    score: intBetween(rand, 70, 100),
    status: expires < 0 ? "expired" : expires < 60 ? "expiring" : "valid",
  }
})
