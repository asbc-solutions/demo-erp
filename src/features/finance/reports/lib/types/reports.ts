import type { Messages, useTranslations } from "next-intl"

export type ReportsTranslator = ReturnType<typeof useTranslations<"FinanceReports">>

type ReportsMessages = Messages["FinanceReports"]
/** A flat (non-enum-map) key of the `FinanceReports` namespace. */
export type ReportsMessageKey = {
  [K in keyof ReportsMessages]: ReportsMessages[K] extends string ? K : never
}[keyof ReportsMessages]

export type TrialBalanceRow = {
  id: string
  code: string
  name: string
  type: string
  is_group: boolean
  parent_code: string | null
  /** 1 class · 2 group · 3 sub-group · 4 account. */
  level: number
  opening: number
  /** Closing balance on its natural side; a group sums each side of its accounts. */
  debit: number
  credit: number
  net: number
  changed: number
}

export type TrialBalance = {
  as_at: string
  entity: { id: string; name: string } | null
  currency: string
  basis: "accrual"
  rows: TrialBalanceRow[]
  accounts: number
  debit: number
  credit: number
  difference: number
  max_level: number
}

export type AuditSource = "ui" | "import" | "system"

export type AuditEvent = {
  id: string
  at: string
  actor: string
  action: string
  object_type: string
  object: string
  href: string | null
  source: AuditSource
}

export type AuditLog = { items: AuditEvent[]; total: number; user: number; imports: number; system: number }
