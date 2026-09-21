import { collection } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_ANCHORS } from "../../seed/finance/anchors"
import { FIN_COLLECTIONS } from "./collections"

const SEARCH_LIMIT = 5

/**
 * Nav badge counts keyed by finance nav item id. Sections replace the anchor
 * values with live counts as they are built.
 */
function navCounts(): Record<string, number> {
  return {
    "fin-bank-reconciliation": FIN_ANCHORS.banking.cibUnmatchedLines,
    "fin-bill-approvals": collection(FIN_COLLECTIONS.bills).filter(
      (bill) => bill.status === "pending_approval",
    ).length,
    "fin-e-invoicing": FIN_ANCHORS.tax.rejectedEInvoices,
  }
}

function matches(value: unknown, needle: string): boolean {
  return String(value ?? "").toLowerCase().includes(needle)
}

/** The toolbar's shared endpoints: scope pickers, nav badges, global search. */
export const financeShellRoutes: DemoRoute[] = [
  route("get", "/finance/entities", () => ({ data: collection(FIN_COLLECTIONS.entities) })),

  route("get", "/finance/periods", () => ({ data: collection(FIN_COLLECTIONS.periods) })),

  route("get", "/finance/nav-counts", () => {
    const counts = navCounts()
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    return { data: { total, counts } }
  }),

  route("get", "/finance/search", (req) => {
    const needle = String(req.params.q ?? "").trim().toLowerCase()
    if (!needle) return { data: { contacts: [], accounts: [] } }

    const contacts = collection(FIN_COLLECTIONS.contacts)
      .filter((row) => matches(row.name, needle) || matches(row.code, needle))
      .slice(0, SEARCH_LIMIT)
    const accounts = collection(FIN_COLLECTIONS.accounts)
      .filter((row) => !row.is_group && (matches(row.name, needle) || matches(row.code, needle)))
      .slice(0, SEARCH_LIMIT)

    return { data: { contacts, accounts } }
  }),
]
