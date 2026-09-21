import {
  ArrowLeftRight,
  BookOpen,
  Factory,
  FileText,
  House,
  Landmark,
  LockKeyhole,
  PieChart,
  ReceiptText,
  Settings,
  Sparkles,
} from "lucide-react"

import type { NavGroup } from "@/src/shared/lib/types"

/**
 * The finance module's sections, each group a collapsible section of the
 * sidebar submenu. Ids carry a `fin-` prefix because the sidebar resolves the
 * active item across every module and Project Manager already uses bare ids
 * like `overview` and `documents`.
 *
 * Detail routes must live under their list item's href (e.g.
 * `/finance/ar/:contactId` under `/finance/ar`) so the longest-prefix match in
 * `getActiveChildId` keeps the right item highlighted.
 */
export const FINANCE_NAV_GROUPS: NavGroup[] = [
  {
    id: "fin-g-overview",
    label: "Overview",
    icon: House,
    items: [
      { id: "fin-home", label: "Finance home", href: "/finance" },
      { id: "fin-cash-position", label: "Cash position", href: "/finance/cash-position" },
      { id: "fin-assistant", label: "Assistant", href: "/finance/assistant" },
      { id: "fin-on-the-go", label: "On the go", href: "/finance/on-the-go" },
    ],
  },
  {
    id: "fin-g-money-in",
    label: "Money in",
    icon: ArrowLeftRight,
    items: [
      { id: "fin-ar", label: "AR overview", href: "/finance/ar" },
      { id: "fin-receipts", label: "Receipts", href: "/finance/receipts" },
      { id: "fin-receipt-allocation", label: "Receipt allocation", href: "/finance/ar/allocation" },
      { id: "fin-collections", label: "Collections", href: "/finance/ar/collections" },
      { id: "fin-credit-notes", label: "Credit notes", href: "/finance/ar/credit-notes" },
      { id: "fin-customer-advances", label: "Customer advances", href: "/finance/ar/advances" },
    ],
  },
  {
    id: "fin-g-money-out",
    label: "Money out",
    icon: ReceiptText,
    items: [
      { id: "fin-ap", label: "AP overview", href: "/finance/ap" },
      { id: "fin-payments", label: "Payments", href: "/finance/payments" },
      { id: "fin-expenses", label: "Expenses", href: "/finance/expenses" },
      { id: "fin-bill-approvals", label: "Bill approvals", href: "/finance/ap/approvals" },
      { id: "fin-payment-runs", label: "Payment runs", href: "/finance/ap/payment-runs" },
      { id: "fin-debit-notes", label: "Debit notes", href: "/finance/ap/debit-notes" },
      { id: "fin-supplier-advances", label: "Supplier advances", href: "/finance/ap/advances" },
    ],
  },
  {
    id: "fin-g-banking",
    label: "Banking",
    icon: Landmark,
    items: [
      { id: "fin-treasuries", label: "Treasuries & banks", href: "/finance/treasuries" },
      { id: "fin-bank-reconciliation", label: "Bank reconciliation", href: "/finance/reconciliation" },
      { id: "fin-statement-import", label: "Statement import", href: "/finance/reconciliation/import" },
      { id: "fin-transfers", label: "Transfers", href: "/finance/transfers" },
      { id: "fin-cheques-received", label: "Cheques received", href: "/finance/cheques/received" },
      { id: "fin-cheques-issued", label: "Cheques issued", href: "/finance/cheques/issued" },
      { id: "fin-cheque-books", label: "Cheque books", href: "/finance/cheques/books" },
      { id: "fin-custody", label: "Employee custody", href: "/finance/custody" },
    ],
  },
  {
    id: "fin-g-ledger",
    label: "Ledger",
    icon: BookOpen,
    items: [
      { id: "fin-accounts", label: "Chart of accounts", href: "/finance/accounts" },
      { id: "fin-journals", label: "Journal entries", href: "/finance/journals" },
      { id: "fin-ledger", label: "General ledger", href: "/finance/ledger" },
      { id: "fin-templates", label: "Journal templates", href: "/finance/templates" },
      { id: "fin-recurring", label: "Recurring journals", href: "/finance/recurring" },
      { id: "fin-opening-balances", label: "Opening balances", href: "/finance/opening-balances" },
      { id: "fin-import", label: "Import data", href: "/finance/import" },
      { id: "fin-currencies", label: "Currencies", href: "/finance/currencies" },
      { id: "fin-fx-revaluation", label: "FX revaluation", href: "/finance/fx-revaluation" },
    ],
  },
  {
    id: "fin-g-close",
    label: "Period close",
    icon: LockKeyhole,
    items: [
      { id: "fin-close", label: "Close workspace", href: "/finance/close" },
      { id: "fin-periods", label: "Financial periods", href: "/finance/periods" },
      { id: "fin-year-end", label: "Year end", href: "/finance/periods/year-end" },
      { id: "fin-adjustments", label: "Adjustments", href: "/finance/adjustments" },
    ],
  },
  {
    id: "fin-g-tax",
    label: "Tax & compliance",
    icon: FileText,
    items: [
      { id: "fin-vat-return", label: "VAT return", href: "/finance/tax/vat-return" },
      { id: "fin-withholding", label: "Withholding tax", href: "/finance/tax/withholding" },
      { id: "fin-e-invoicing", label: "E-invoicing", href: "/finance/tax/e-invoicing" },
      { id: "fin-declarations", label: "Tax declarations", href: "/finance/tax/declarations" },
      { id: "fin-tax-codes", label: "Tax codes", href: "/finance/tax/codes" },
      { id: "fin-audit-files", label: "Audit files", href: "/finance/tax/audit-files" },
    ],
  },
  {
    id: "fin-g-assets",
    label: "Assets",
    icon: Factory,
    items: [
      { id: "fin-assets", label: "Asset register", href: "/finance/assets" },
      { id: "fin-depreciation", label: "Depreciation", href: "/finance/assets/depreciation" },
      { id: "fin-asset-categories", label: "Categories", href: "/finance/assets/categories" },
    ],
  },
  {
    id: "fin-g-planning",
    label: "Planning",
    icon: PieChart,
    items: [
      { id: "fin-budgets", label: "Budgets", href: "/finance/budgets" },
      { id: "fin-cost-centers", label: "Cost centers", href: "/finance/cost-centers" },
      { id: "fin-dimensions", label: "Dimensions", href: "/finance/dimensions" },
      { id: "fin-allocation-rules", label: "Allocation rules", href: "/finance/allocation-rules" },
    ],
  },
  {
    id: "fin-g-reports",
    label: "Reports",
    icon: Sparkles,
    items: [
      { id: "fin-reports", label: "Report library", href: "/finance/reports" },
      { id: "fin-audit", label: "Audit log", href: "/finance/audit" },
    ],
  },
  {
    id: "fin-g-configuration",
    label: "Configuration",
    icon: Settings,
    items: [
      { id: "fin-setup", label: "Set up finance", href: "/finance/setup" },
      { id: "fin-posting-map", label: "Posting map", href: "/finance/settings/posting-map" },
      { id: "fin-fiscal-calendar", label: "Fiscal calendar", href: "/finance/settings/fiscal-calendar" },
      { id: "fin-numbering", label: "Document numbering", href: "/finance/settings/numbering" },
      { id: "fin-approval-policies", label: "Approval policies", href: "/finance/settings/approvals" },
      { id: "fin-roles", label: "Roles & permissions", href: "/finance/settings/roles" },
    ],
  },
]

export const FINANCE_HOME_ROUTE = "/finance"
