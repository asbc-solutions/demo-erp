import { collection, findRow } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { auditEvents } from "./audit-model"
import { FIN_COLLECTIONS } from "./collections"
import { accountBalances } from "./ledger-model"

/** 10 · Reports — the trial balance and the audit log. */

const r2 = (value: number) => Math.round(value * 100) / 100

/** Chart depth from the code: 1 · 11 · 1101 · 110101. */
const levelOf = (code: string) => (code.length <= 2 ? code.length : code.length === 4 ? 3 : 4)

export const financeReportRoutes: DemoRoute[] = [
  /**
   * Every account with its opening, closing and change, in EGP. Group rows
   * carry the sums of the accounts under them, debit and credit sides kept
   * apart so any level adds to the same totals.
   */
  route("get", "/finance/reports/trial-balance", () => {
    const balances = accountBalances()
    const accounts = [...collection(FIN_COLLECTIONS.accounts)].sort((a, b) => String(a.code).localeCompare(String(b.code)))
    const leaves = accounts.filter((row) => !row.is_group)
    const figures = new Map(
      leaves.map((row) => {
        const balance = balances.get(String(row.code)) ?? { opening: 0, closing: 0 }
        const closing = r2(balance.closing)
        return [String(row.code), { opening: r2(balance.opening), closing, debit: Math.max(closing, 0), credit: Math.max(-closing, 0) }]
      }),
    )
    const rows = accounts.map((account) => {
      const code = String(account.code)
      const members = account.is_group ? leaves.filter((row) => String(row.code).startsWith(code)) : [account]
      const sum = (key: "opening" | "closing" | "debit" | "credit") =>
        r2(members.reduce((total, member) => total + (figures.get(String(member.code))?.[key] ?? 0), 0))
      const closing = sum("closing")
      const opening = sum("opening")
      return {
        id: code,
        code,
        name: account.name,
        type: account.type,
        is_group: Boolean(account.is_group),
        parent_code: account.parent_code ?? null,
        level: levelOf(code),
        opening,
        debit: sum("debit"),
        credit: sum("credit"),
        net: closing,
        changed: r2(closing - opening),
      }
    })
    const debit = r2(leaves.reduce((total, row) => total + (figures.get(String(row.code))?.debit ?? 0), 0))
    const credit = r2(leaves.reduce((total, row) => total + (figures.get(String(row.code))?.credit ?? 0), 0))
    const entity = findRow(FIN_COLLECTIONS.entities, "EG-01") ?? collection(FIN_COLLECTIONS.entities)[0]
    return {
      data: {
        as_at: FIN_TODAY,
        entity: entity ? { id: entity.id, name: entity.name } : null,
        currency: "EGP",
        basis: "accrual",
        rows,
        accounts: leaves.length,
        debit,
        credit,
        difference: r2(debit - credit),
        max_level: 4,
      },
    }
  }),

  route("get", "/finance/audit", () => {
    const items = auditEvents()
    const count = (source: string) => items.filter((row) => row.source === source).length
    return { data: { items, total: items.length, user: count("ui"), imports: count("import"), system: count("system") } }
  }),
]
