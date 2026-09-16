/* ------------------------------------------------------------------ */
/* Timesheets & expenses (per-employee)                                */
/* ------------------------------------------------------------------ */

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected"

export type TimesheetEntry = {
  log_id: string
  log_date: string
  hours: number
  note: string | null
  status: string
}

export type TimesheetRow = {
  row_id: string
  project_id: string
  project_name: string
  task_id: string | null
  subtask_id: string | null
  task_title: string
  billable: boolean
  entries: TimesheetEntry[]
  total_hours: number
}

export type TimesheetSummary = {
  hours_posted: number
  billable_hours: number
  billable_pct: number
  pending_approval_count: number
  expense_amount: number
  receipt_count: number
  currency_code: string
}

export type TimesheetPerson = {
  id: string
  name: string
  employee_number: string
  role: string | null
  department: string | null
  initials: string
  avatar_url: string | null
}

export type Timesheet = {
  timesheet_id: string | null
  employee_id: string
  employee: TimesheetPerson
  period_start: string
  period_end: string
  status: TimesheetStatus
  summary: TimesheetSummary
  rows: TimesheetRow[]
}

export type CurrentTimesheetParams = {
  employee_id: string
  week_start: string
}

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid"

export type Expense = {
  expense_id: string
  project_id: string | null
  employee_id: string
  category: string
  category_label?: string
  amount: number
  currency_code: string
  expense_date: string
  status: ExpenseStatus
  status_label?: string
  description: string | null
}

export type ExpenseListParams = {
  employee_id?: string
  project_id?: string
  status?: ExpenseStatus
  from?: string
  to?: string
  page?: number
  per_page?: number
}

/** Option from `GET /pm/costbudget/expenses/categories`. */
export type ExpenseCategory = {
  id: string
  label: string
}

/** `POST /pm/expenses`. */
export type CreateExpensePayload = {
  employee_id: string
  project_id: string
  category: string
  amount: number
  currency_code?: string
  expense_date: string
  billable?: boolean
  description?: string
}

/** `POST /pm/timesheets/submit`. */
export type SubmitTimesheetPayload = {
  employee_id: string
  week_start: string
}
