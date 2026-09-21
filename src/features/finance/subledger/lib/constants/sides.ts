import type { Side } from "../types/subledger"

type SideConfig = {
  contactKind: "customer" | "supplier"
  /** API endpoints served by the demo layer. */
  api: { overview: string; contact: string; notes: string; advances: string; vouchers: string }
  /** App routes. */
  href: { overview: string; contact: (id: string) => string; vouchers: string }
  contact: { singular: string; lower: string; plural: string }
  overview: {
    title: string
    figure: string
    caption: string
    loading: string
    action: { label: string; href: string }
  }
  card: {
    figure: string
    controlTitle: string
    action: (id: string) => { label: string; href: string }
    empty: string
  }
  writeOff: { explainer: string; done: (name: string, amount: string) => string }
  notes: {
    title: string
    newLabel: string
    noun: string
    count: string
    explainer: string
  }
  advances: {
    title: string
    figure: string
    date: string
    heldAs: string
    explainer: string
  }
  vouchers: {
    title: string
    figure: string
    newLabel: string
    newHref: string
    treasury: string
    caption: string
    noun: string
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
    href: { overview: "/finance/ar", contact: (id) => `/finance/ar/${id}`, vouchers: "/finance/receipts" },
    contact: { singular: "Customer", lower: "customer", plural: "customers" },
    overview: {
      title: "Accounts receivable",
      figure: "Owed to us (EGP)",
      caption: "Receivables by customer",
      loading: "Loading receivables",
      action: { label: "Allocate receipt", href: "/finance/ar/allocation" },
    },
    card: {
      figure: "Owed to us",
      controlTitle: "Receivables control account",
      action: (id) => ({ label: "Allocate receipt", href: `/finance/ar/allocation?customer=${id}` }),
      empty: "Nothing is open for this customer.",
    },
    writeOff: {
      explainer:
        "A write-off charges the outstanding amount to bad debt expense and clears the customer's balance. It is not a credit note, so the original invoice stays as issued. Recovering the money later needs a new entry.",
      done: (name, amount) => `${name}'s invoices were written off (EGP ${amount}).`,
    },
    notes: {
      title: "Credit notes",
      newLabel: "New credit note",
      noun: "credit note",
      count: "Notes issued",
      explainer:
        "A credit note reduces what the customer owes and can be applied against open invoices. Unapplied notes stay on the ledger until offset, so they always tie back to the aging report.",
    },
    advances: {
      title: "Customer advances",
      figure: "Unapplied advances (EGP)",
      date: "Received",
      heldAs: "Held as liability",
      explainer:
        "A customer advance is money received before an invoice exists, so it sits as a liability until applied. Allocating it against a future invoice clears both the advance and the receivable.",
    },
    vouchers: {
      title: "Receipts",
      figure: "Received this year (EGP)",
      newLabel: "New receipt",
      newHref: "/finance/receipts/new-receipt",
      treasury: "Into",
      caption: "Receipt vouchers",
      noun: "receipt",
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
    href: { overview: "/finance/ap", contact: (id) => `/finance/ap/${id}`, vouchers: "/finance/payments" },
    contact: { singular: "Supplier", lower: "supplier", plural: "suppliers" },
    overview: {
      title: "Accounts payable",
      figure: "We owe (EGP)",
      caption: "Payables by supplier",
      loading: "Loading payables",
      action: { label: "New payment run", href: "/finance/ap/payment-runs" },
    },
    card: {
      figure: "We owe",
      controlTitle: "Payables control account",
      action: (id) => ({ label: "Pay", href: `/finance/ap/payment-runs?supplier=${id}` }),
      empty: "Nothing is open for this supplier.",
    },
    writeOff: {
      explainer:
        "A write-off releases the outstanding amount to other income and clears the supplier's balance. It is not a debit note, so the original bills stay as received. Paying the supplier later needs a new entry.",
      done: (name, amount) => `${name}'s bills were written off (EGP ${amount}).`,
    },
    notes: {
      title: "Debit notes",
      newLabel: "New debit note",
      noun: "debit note",
      count: "Notes issued",
      explainer:
        "A debit note reduces what we owe the supplier and can be applied against open bills. Unapplied notes stay on the ledger until offset, so they always tie back to the aging report.",
    },
    advances: {
      title: "Supplier advances",
      figure: "Unapplied advances (EGP)",
      date: "Paid",
      heldAs: "Held as asset",
      explainer:
        "A supplier advance is a prepayment made before a bill arrives, so it sits as an asset until applied. Applying it against a future bill clears both the advance and the payable.",
    },
    vouchers: {
      title: "Payments",
      figure: "Paid this year (EGP)",
      newLabel: "New payment",
      newHref: "/finance/payments/new-payment",
      treasury: "From",
      caption: "Payment vouchers",
      noun: "payment",
    },
  },
}
