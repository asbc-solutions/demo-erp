import { defineCollection, type Row } from "../../demo-db"
import {
  ASSISTANT_DRAFT_ROWS,
  ASSISTANT_HISTORY_ROWS,
  buildAssistantSettings,
} from "../../seed/finance/assistant"
import {
  FIN_CHEQUE_BOOK_ROWS,
  FIN_EMPLOYEE_ROWS,
  buildBookEntries,
  buildCheques,
  buildCustody,
  buildStatementLines,
  buildTransfers,
  buildTreasuryMovements,
} from "../../seed/finance/banking"
import { FIN_ASSET_CATEGORY_ROWS, buildAssets } from "../../seed/finance/assets"
import { FIN_CLOSING_PERIOD, buildFinancePeriods } from "../../seed/finance/calendar"
import { FIN_CLOSE_TASK_ROWS, FIN_YEAR_END_STEPS } from "../../seed/finance/close"
import { FIN_APPROVAL_POLICY_ROWS, FIN_POSTING_RULE_ROWS, FIN_ROLE_ROWS } from "../../seed/finance/configuration"
import {
  FIN_BOOK_RATES,
  FIN_JOURNAL_TEMPLATE_ROWS,
  FIN_RECURRING_ROWS,
  buildJournals,
  buildOpeningBalances,
} from "../../seed/finance/ledger"
import {
  FIN_ACCOUNT_ROWS,
  FIN_CONTACT_ROWS,
  FIN_CURRENCY_ROWS,
  FIN_ENTITY_ROWS,
  FIN_TREASURY_ROWS,
} from "../../seed/finance/master-data"
import { buildApDocuments, buildPayments } from "../../seed/finance/payables"
import {
  FIN_ALLOCATION_RULE_ROWS,
  FIN_BUDGET_ROWS,
  FIN_COST_CENTER_ROWS,
  FIN_DIMENSION_ROWS,
} from "../../seed/finance/planning"
import { buildArDocuments, buildReceipts } from "../../seed/finance/receivables"
import {
  FIN_AUDIT_FILE_ROWS,
  FIN_DECLARATION_ROWS,
  FIN_EINVOICE_SETTINGS,
  FIN_TAX_CODE_ROWS,
  FIN_VAT_CHECK_ROWS,
  FIN_VAT_RETURN_ROWS,
  FIN_WHT_CERTIFICATE_ROWS,
  buildEDocuments,
} from "../../seed/finance/tax"

/** Collection names for finance data; each section adds its own here. */
export const FIN_COLLECTIONS = {
  entities: "finance/entities",
  periods: "finance/periods",
  currencies: "finance/currencies",
  treasuries: "finance/treasuries",
  contacts: "finance/contacts",
  accounts: "finance/accounts",
  closeTasks: "finance/close-tasks",
  assistantDrafts: "finance/assistant-drafts",
  assistantHistory: "finance/assistant-history",
  assistantSettings: "finance/assistant-settings",
  arDocuments: "finance/ar-documents",
  receipts: "finance/receipts",
  apDocuments: "finance/ap-documents",
  payments: "finance/payments",
  expenses: "finance/expenses",
  treasuryMovements: "finance/treasury-movements",
  transfers: "finance/transfers",
  statementLines: "finance/statement-lines",
  bookEntries: "finance/book-entries",
  statementImports: "finance/statement-imports",
  cheques: "finance/cheques",
  chequeBooks: "finance/cheque-books",
  custody: "finance/custody",
  employees: "finance/employees",
  journals: "finance/journals",
  ledgerOpenings: "finance/ledger-openings",
  ledgerSettings: "finance/ledger-settings",
  journalTemplates: "finance/journal-templates",
  recurringJournals: "finance/recurring-journals",
  taxCodes: "finance/tax-codes",
  costCenters: "finance/cost-centers",
  dimensions: "finance/dimensions",
  yearEndSteps: "finance/year-end-steps",
  vatReturns: "finance/vat-returns",
  vatChecks: "finance/vat-checks",
  eDocuments: "finance/e-documents",
  eInvoiceSettings: "finance/e-invoice-settings",
  declarations: "finance/declarations",
  whtCertificates: "finance/wht-certificates",
  auditFiles: "finance/audit-files",
  assets: "finance/assets",
  assetCategories: "finance/asset-categories",
  depreciationRuns: "finance/depreciation-runs",
  budgets: "finance/budgets",
  allocationRules: "finance/allocation-rules",
  financeSettings: "finance/settings",
  postingRules: "finance/posting-rules",
  approvalPolicies: "finance/approval-policies",
  roles: "finance/roles",
} as const

/** Seeds are copied so edits in one session never mutate the module-level fixtures. */
const copy = (rows: Row[]) => () => rows.map((row) => structuredClone(row))

defineCollection(FIN_COLLECTIONS.entities, copy(FIN_ENTITY_ROWS))
defineCollection(FIN_COLLECTIONS.periods, buildFinancePeriods)
defineCollection(FIN_COLLECTIONS.currencies, copy(FIN_CURRENCY_ROWS))
defineCollection(FIN_COLLECTIONS.treasuries, copy(FIN_TREASURY_ROWS))
defineCollection(FIN_COLLECTIONS.contacts, copy(FIN_CONTACT_ROWS))
defineCollection(FIN_COLLECTIONS.accounts, copy(FIN_ACCOUNT_ROWS))
defineCollection(FIN_COLLECTIONS.closeTasks, copy(FIN_CLOSE_TASK_ROWS))
defineCollection(FIN_COLLECTIONS.assistantDrafts, copy(ASSISTANT_DRAFT_ROWS))
defineCollection(FIN_COLLECTIONS.assistantHistory, copy(ASSISTANT_HISTORY_ROWS))
defineCollection(FIN_COLLECTIONS.assistantSettings, buildAssistantSettings)
defineCollection(FIN_COLLECTIONS.arDocuments, buildArDocuments)
defineCollection(FIN_COLLECTIONS.receipts, buildReceipts)
defineCollection(FIN_COLLECTIONS.apDocuments, buildApDocuments)
defineCollection(FIN_COLLECTIONS.payments, buildPayments)
// Expense claims start empty: the design opens on "Nothing is waiting for approval".
defineCollection(FIN_COLLECTIONS.expenses, () => [])
defineCollection(FIN_COLLECTIONS.treasuryMovements, () => buildTreasuryMovements().reverse())
defineCollection(FIN_COLLECTIONS.transfers, buildTransfers)
defineCollection(FIN_COLLECTIONS.statementLines, buildStatementLines)
defineCollection(FIN_COLLECTIONS.bookEntries, buildBookEntries)
defineCollection(FIN_COLLECTIONS.statementImports, () => [])
defineCollection(FIN_COLLECTIONS.cheques, buildCheques)
defineCollection(FIN_COLLECTIONS.chequeBooks, copy(FIN_CHEQUE_BOOK_ROWS))
defineCollection(FIN_COLLECTIONS.custody, buildCustody)
defineCollection(FIN_COLLECTIONS.employees, copy(FIN_EMPLOYEE_ROWS))
defineCollection(FIN_COLLECTIONS.journals, buildJournals)
defineCollection(FIN_COLLECTIONS.ledgerOpenings, buildOpeningBalances)
defineCollection(FIN_COLLECTIONS.ledgerSettings, () => [
  {
    id: "settings",
    openings_locked: false,
    openings_locked_at: null,
    book_rates: { ...FIN_BOOK_RATES },
    revaluations: [],
    rates_refreshed_at: "2026-03-31T08:00:00.000Z",
  },
])
defineCollection(FIN_COLLECTIONS.journalTemplates, copy(FIN_JOURNAL_TEMPLATE_ROWS))
defineCollection(FIN_COLLECTIONS.recurringJournals, copy(FIN_RECURRING_ROWS))
defineCollection(FIN_COLLECTIONS.taxCodes, copy(FIN_TAX_CODE_ROWS))
// Import appends to cost centers and dimensions.
defineCollection(FIN_COLLECTIONS.costCenters, copy(FIN_COST_CENTER_ROWS))
defineCollection(FIN_COLLECTIONS.dimensions, copy(FIN_DIMENSION_ROWS))
defineCollection(FIN_COLLECTIONS.yearEndSteps, copy(FIN_YEAR_END_STEPS))
defineCollection(FIN_COLLECTIONS.vatReturns, copy(FIN_VAT_RETURN_ROWS))
defineCollection(FIN_COLLECTIONS.vatChecks, copy(FIN_VAT_CHECK_ROWS))
defineCollection(FIN_COLLECTIONS.eDocuments, buildEDocuments)
defineCollection(FIN_COLLECTIONS.eInvoiceSettings, copy([FIN_EINVOICE_SETTINGS]))
defineCollection(FIN_COLLECTIONS.declarations, copy(FIN_DECLARATION_ROWS))
defineCollection(FIN_COLLECTIONS.whtCertificates, copy(FIN_WHT_CERTIFICATE_ROWS))
defineCollection(FIN_COLLECTIONS.auditFiles, copy(FIN_AUDIT_FILE_ROWS))
defineCollection(FIN_COLLECTIONS.assets, buildAssets)
defineCollection(FIN_COLLECTIONS.assetCategories, copy(FIN_ASSET_CATEGORY_ROWS))
// The closing period's run waits as a draft; retired and fully depreciated assets drop out of it.
defineCollection(FIN_COLLECTIONS.depreciationRuns, () => [
  { id: `DR-${FIN_CLOSING_PERIOD}`, period: FIN_CLOSING_PERIOD, status: "draft", skipped: [], entry: null },
])
defineCollection(FIN_COLLECTIONS.budgets, copy(FIN_BUDGET_ROWS))
defineCollection(FIN_COLLECTIONS.allocationRules, copy(FIN_ALLOCATION_RULE_ROWS))
defineCollection(FIN_COLLECTIONS.financeSettings, () => [
  {
    id: "settings",
    // Setup has not been run in this session; the seeded module is configured by hand.
    setup: null,
    fiscal: { year_start_month: 1, period_length: "monthly", periods_per_year: 12, adjusting_days: 10 },
    persona: "administrator",
  },
])
defineCollection(FIN_COLLECTIONS.postingRules, copy(FIN_POSTING_RULE_ROWS))
defineCollection(FIN_COLLECTIONS.approvalPolicies, copy(FIN_APPROVAL_POLICY_ROWS))
defineCollection(FIN_COLLECTIONS.roles, copy(FIN_ROLE_ROWS))
