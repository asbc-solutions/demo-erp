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
