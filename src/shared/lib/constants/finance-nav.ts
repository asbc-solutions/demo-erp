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
    labelKey: "finGroupOverview",
    icon: House,
    items: [
      { id: "fin-home", labelKey: "finHome", href: "/finance" },
      { id: "fin-cash-position", labelKey: "finCashPosition", href: "/finance/cash-position" },
      { id: "fin-assistant", labelKey: "finAssistant", href: "/finance/assistant" },
      { id: "fin-on-the-go", labelKey: "finOnTheGo", href: "/finance/on-the-go" },
    ],
  },
  {
    id: "fin-g-money-in",
    labelKey: "finGroupMoneyIn",
    icon: ArrowLeftRight,
    items: [
      { id: "fin-ar", labelKey: "finAr", href: "/finance/ar" },
      { id: "fin-receipts", labelKey: "finReceipts", href: "/finance/receipts" },
      { id: "fin-receipt-allocation", labelKey: "finReceiptAllocation", href: "/finance/ar/allocation" },
      { id: "fin-collections", labelKey: "finCollections", href: "/finance/ar/collections" },
      { id: "fin-credit-notes", labelKey: "finCreditNotes", href: "/finance/ar/credit-notes" },
      { id: "fin-customer-advances", labelKey: "finCustomerAdvances", href: "/finance/ar/advances" },
    ],
  },
  {
    id: "fin-g-money-out",
    labelKey: "finGroupMoneyOut",
    icon: ReceiptText,
    items: [
      { id: "fin-ap", labelKey: "finAp", href: "/finance/ap" },
      { id: "fin-payments", labelKey: "finPayments", href: "/finance/payments" },
      { id: "fin-expenses", labelKey: "finExpenses", href: "/finance/expenses" },
      { id: "fin-bill-approvals", labelKey: "finBillApprovals", href: "/finance/ap/approvals" },
      { id: "fin-payment-runs", labelKey: "finPaymentRuns", href: "/finance/ap/payment-runs" },
      { id: "fin-debit-notes", labelKey: "finDebitNotes", href: "/finance/ap/debit-notes" },
      { id: "fin-supplier-advances", labelKey: "finSupplierAdvances", href: "/finance/ap/advances" },
    ],
  },
  {
    id: "fin-g-banking",
    labelKey: "finGroupBanking",
    icon: Landmark,
    items: [
      { id: "fin-treasuries", labelKey: "finTreasuries", href: "/finance/treasuries" },
      { id: "fin-bank-reconciliation", labelKey: "finBankReconciliation", href: "/finance/reconciliation" },
      { id: "fin-statement-import", labelKey: "finStatementImport", href: "/finance/reconciliation/import" },
      { id: "fin-transfers", labelKey: "finTransfers", href: "/finance/transfers" },
      { id: "fin-cheques-received", labelKey: "finChequesReceived", href: "/finance/cheques/received" },
      { id: "fin-cheques-issued", labelKey: "finChequesIssued", href: "/finance/cheques/issued" },
      { id: "fin-cheque-books", labelKey: "finChequeBooks", href: "/finance/cheques/books" },
      { id: "fin-custody", labelKey: "finCustody", href: "/finance/custody" },
    ],
  },
  {
    id: "fin-g-ledger",
    labelKey: "finGroupLedger",
    icon: BookOpen,
    items: [
      { id: "fin-accounts", labelKey: "finAccounts", href: "/finance/accounts" },
      { id: "fin-journals", labelKey: "finJournals", href: "/finance/journals" },
      { id: "fin-ledger", labelKey: "finLedger", href: "/finance/ledger" },
      { id: "fin-templates", labelKey: "finTemplates", href: "/finance/templates" },
      { id: "fin-recurring", labelKey: "finRecurring", href: "/finance/recurring" },
      { id: "fin-opening-balances", labelKey: "finOpeningBalances", href: "/finance/opening-balances" },
      { id: "fin-import", labelKey: "finImport", href: "/finance/import" },
      { id: "fin-currencies", labelKey: "finCurrencies", href: "/finance/currencies" },
      { id: "fin-fx-revaluation", labelKey: "finFxRevaluation", href: "/finance/fx-revaluation" },
    ],
  },
  {
    id: "fin-g-close",
    labelKey: "finGroupClose",
    icon: LockKeyhole,
    items: [
      { id: "fin-close", labelKey: "finClose", href: "/finance/close" },
      { id: "fin-periods", labelKey: "finPeriods", href: "/finance/periods" },
      { id: "fin-year-end", labelKey: "finYearEnd", href: "/finance/periods/year-end" },
      { id: "fin-adjustments", labelKey: "finAdjustments", href: "/finance/adjustments" },
    ],
  },
  {
    id: "fin-g-tax",
    labelKey: "finGroupTax",
    icon: FileText,
    items: [
      { id: "fin-vat-return", labelKey: "finVatReturn", href: "/finance/tax/vat-return" },
      { id: "fin-withholding", labelKey: "finWithholding", href: "/finance/tax/withholding" },
      { id: "fin-e-invoicing", labelKey: "finEInvoicing", href: "/finance/tax/e-invoicing" },
      { id: "fin-declarations", labelKey: "finDeclarations", href: "/finance/tax/declarations" },
      { id: "fin-tax-codes", labelKey: "finTaxCodes", href: "/finance/tax/codes" },
      { id: "fin-audit-files", labelKey: "finAuditFiles", href: "/finance/tax/audit-files" },
    ],
  },
  {
    id: "fin-g-assets",
    labelKey: "finGroupAssets",
    icon: Factory,
    items: [
      { id: "fin-assets", labelKey: "finAssets", href: "/finance/assets" },
      { id: "fin-depreciation", labelKey: "finDepreciation", href: "/finance/assets/depreciation" },
      { id: "fin-asset-categories", labelKey: "finAssetCategories", href: "/finance/assets/categories" },
    ],
  },
  {
    id: "fin-g-planning",
    labelKey: "finGroupPlanning",
    icon: PieChart,
    items: [
      { id: "fin-budgets", labelKey: "finBudgets", href: "/finance/budgets" },
      { id: "fin-cost-centers", labelKey: "finCostCenters", href: "/finance/cost-centers" },
      { id: "fin-dimensions", labelKey: "finDimensions", href: "/finance/dimensions" },
      { id: "fin-allocation-rules", labelKey: "finAllocationRules", href: "/finance/allocation-rules" },
    ],
  },
  {
    id: "fin-g-reports",
    labelKey: "finGroupReports",
    icon: Sparkles,
    items: [
      { id: "fin-reports", labelKey: "finReports", href: "/finance/reports" },
      { id: "fin-audit", labelKey: "finAudit", href: "/finance/audit" },
    ],
  },
  {
    id: "fin-g-configuration",
    labelKey: "finGroupConfiguration",
    icon: Settings,
    items: [
      { id: "fin-setup", labelKey: "finSetup", href: "/finance/setup" },
      { id: "fin-posting-map", labelKey: "finPostingMap", href: "/finance/settings/posting-map" },
      { id: "fin-fiscal-calendar", labelKey: "finFiscalCalendar", href: "/finance/settings/fiscal-calendar" },
      { id: "fin-numbering", labelKey: "finNumbering", href: "/finance/settings/numbering" },
      { id: "fin-approval-policies", labelKey: "finApprovalPolicies", href: "/finance/settings/approvals" },
      { id: "fin-roles", labelKey: "finRoles", href: "/finance/settings/roles" },
    ],
  },
]

export const FINANCE_HOME_ROUTE = "/finance"
