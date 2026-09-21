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
import { buildFinancePeriods } from "../../seed/finance/calendar"
import { FIN_CLOSE_TASK_ROWS } from "../../seed/finance/close"
import {
  FIN_ACCOUNT_ROWS,
  FIN_CONTACT_ROWS,
  FIN_CURRENCY_ROWS,
  FIN_ENTITY_ROWS,
  FIN_TREASURY_ROWS,
} from "../../seed/finance/master-data"
import { buildApDocuments, buildPayments } from "../../seed/finance/payables"
import { buildArDocuments, buildReceipts } from "../../seed/finance/receivables"

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
