import type { FinancePeriod } from "../../../lib/types/common"

export type CloseTaskStatus = "done" | "in_progress" | "blocked" | "not_started"

export type CloseTask = {
  id: string
  period: string
  position: number
  group: string
  title: string
  description: string
  owner: string
  due_date: string
  status: CloseTaskStatus
  blocking: number
  can_sign_off: boolean
  href: string
}

export type ReadinessCheck = { id: string; title: string; detail: string; count: number; pass: boolean; href: string }

export type CloseSummary = {
  tasks_done: number
  tasks_total: number
  incomplete: number
  blocking_total: number
  blocking_tasks: number
  unreconciled_accounts: number
  checks_passing: number
  checks_total: number
  readiness_pct: number
  can_close: boolean
}

export type CloseWorkspace = {
  period: FinancePeriod
  summary: CloseSummary
  groups: { name: string; done: number; total: number; tasks: CloseTask[] }[]
  checks: ReadinessCheck[]
}

export type PeriodList = {
  items: FinancePeriod[]
  counts: { open: number; closed: number; locked: number; adjusting: number }
}

export type YearEndStep = { id: string; position: number; title: string; detail: string; done: boolean }

export type YearEnd = {
  fiscal_year: string
  steps: YearEndStep[]
  done: number
  total: number
  locked: boolean
  can_lock: boolean
}

export type Adjustment = { number: string; date: string; description: string; status: string; amount: number }

export type AdjustmentList = {
  items: Adjustment[]
  count: number
  total_base: number
  period: FinancePeriod
}
