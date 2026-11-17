import type { Side } from "../types/subledger"

/**
 * Routing per subledger side. The copy for each side lives in the
 * `FinanceSubledger` messages as enum maps keyed by side, e.g.
 * `t(`overviewTitle.${side}`)`.
 */
type SideConfig = {
  contactKind: "customer" | "supplier"
  /** API endpoints served by the demo layer. */
  api: { overview: string; contact: string; notes: string; advances: string; vouchers: string }
  /** App routes. */
  href: {
    overview: string
    contact: (id: string) => string
    vouchers: string
    /** The overview header action: allocate a receipt, or start a payment run. */
    overviewAction: string
    /** The contact card header action for one contact. */
    cardAction: (id: string) => string
  }
}

export const SUBLEDGER_SIDES: Record<Side, SideConfig> = {
  receivable: {
    contactKind: "customer",
    api: {
      overview: "/finance/ar/overview",
      contact: "/finance/ar/customers",
      notes: "/finance/ar/credit-notes",
      advances: "/finance/ar/advances",
      vouchers: "/finance/receipts",
    },
    href: {
      overview: "/finance/ar",
      contact: (id) => `/finance/ar/${id}`,
      vouchers: "/finance/receipts",
      overviewAction: "/finance/ar/allocation",
      cardAction: (id) => `/finance/ar/allocation?customer=${id}`,
    },
  },
  payable: {
    contactKind: "supplier",
    api: {
      overview: "/finance/ap/overview",
      contact: "/finance/ap/suppliers",
      notes: "/finance/ap/debit-notes",
      advances: "/finance/ap/advances",
      vouchers: "/finance/payments",
    },
    href: {
      overview: "/finance/ap",
      contact: (id) => `/finance/ap/${id}`,
      vouchers: "/finance/payments",
      overviewAction: "/finance/ap/payment-runs",
      cardAction: (id) => `/finance/ap/payment-runs?supplier=${id}`,
    },
  },
}
