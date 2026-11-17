import type { Messages, useTranslations } from "next-intl"

export type ConfigTranslator = ReturnType<typeof useTranslations<"FinanceConfiguration">>

type ConfigMessages = Messages["FinanceConfiguration"]
/** A flat (non-enum-map) key of the `FinanceConfiguration` namespace. */
export type ConfigMessageKey = {
  [K in keyof ConfigMessages]: ConfigMessages[K] extends string ? K : never
}[keyof ConfigMessages]

export type SetupDecision = { setting: string; value: string; because: string; href: string }

export type SetupSummary = {
  completed: boolean
  completed_at: string | null
  choices: { industry: string; entity_id: string; year_start_month: number } | null
  industry: { id: string; name: string; analysed_by: string; tax_codes: string[] } | null
  decisions: SetupDecision[]
  industries: { id: string; name: string; analysed_by: string; tax_codes: string[]; decisions: SetupDecision[] }[]
  entities: { id: string; name: string }[]
  dimension_created: boolean
}

export type SetupInput = { industry: string; entity_id: string; year_start_month: number }

export type RuleSide = {
  debit_account: string | null
  credit_account: string | null
  tax_code: string | null
  debit_name: string | null
  credit_name: string | null
  tax_rate: number | null
}

export type PostingRule = {
  id: string
  code: string
  event: string
  module: string
  description: string
  current: RuleSide
  staged: RuleSide | null
  per_month: number
  monthly_value: number
  changed_on: string
  changed_by: string
}

export type PostingMap = {
  rules: PostingRule[]
  staged_count: number
  staged_events: string[]
  staged_documents: number
  staged_value: number
  tax_codes: { code: string; name: string; rate: number; kind: string }[]
}

export type StageInput = { debit_account?: string | null; credit_account?: string | null; tax_code?: string | null }

export type SimulatedEntry = {
  refused: string | null
  lines: { account_code: string; name: string | null; debit: number; credit: number }[]
  debit?: number
  credit?: number
  difference?: number
}

export type Simulation = { rule: PostingRule; amount: number; inclusive: boolean; current: SimulatedEntry; staged: SimulatedEntry | null }

export type FiscalCalendar = {
  year_start_month: number
  year_start_label: string
  period_length: string
  periods_per_year: number
  adjusting_days: number
  pending_change: boolean
  periods: { id: string; label: string; start_date: string; end_date: string; status: string; adjusting_until: string }[]
}

export type NumberingRow = { id: string; document: string; format: string; count: number; next: string }

export type ApprovalPolicy = {
  id: string
  name: string
  type: string
  type_label: string
  threshold: number | null
  approvers: string[]
  active: boolean
  waiting: number | null
}

export type ApprovalPolicyList = { items: ApprovalPolicy[]; active: number; types: { value: string; label: string }[] }

export type NewPolicyInput = { name: string; type: string; threshold: number; approvers: number }

export type Permission = "view" | "post" | "approve" | "reverse" | "close" | "settings"

export type FinanceRole = { id: string; name: string; scope: string; members: number; permissions: Record<Permission, boolean> }

export type RoleList = {
  items: FinanceRole[]
  permissions: Permission[]
  personas: { id: string; name: string; role_id: string }[]
  persona: string
  persona_role: FinanceRole | null
}

export type NewRoleInput = { name: string; scope: string; may_post: boolean; may_approve: boolean; may_see_balances: boolean }
