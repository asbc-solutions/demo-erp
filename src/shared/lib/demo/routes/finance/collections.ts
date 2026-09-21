import { defineCollection, type Row } from "../../demo-db"
import {
  ASSISTANT_DRAFT_ROWS,
  ASSISTANT_HISTORY_ROWS,
  buildAssistantSettings,
} from "../../seed/finance/assistant"
import { FIN_BILL_ROWS } from "../../seed/finance/bills"
import { buildFinancePeriods } from "../../seed/finance/calendar"
import { FIN_CLOSE_TASK_ROWS } from "../../seed/finance/close"
import { buildArDocuments, buildReceipts } from "../../seed/finance/receivables"
import {
  FIN_ACCOUNT_ROWS,
  FIN_CONTACT_ROWS,
  FIN_CURRENCY_ROWS,
  FIN_ENTITY_ROWS,
  FIN_TREASURY_ROWS,
} from "../../seed/finance/master-data"

/** Collection names for finance data; each section adds its own here. */
export const FIN_COLLECTIONS = {
  entities: "finance/entities",
  periods: "finance/periods",
  currencies: "finance/currencies",
  treasuries: "finance/treasuries",
  contacts: "finance/contacts",
  accounts: "finance/accounts",
  bills: "finance/bills",
  closeTasks: "finance/close-tasks",
  assistantDrafts: "finance/assistant-drafts",
  assistantHistory: "finance/assistant-history",
  assistantSettings: "finance/assistant-settings",
  arDocuments: "finance/ar-documents",
  receipts: "finance/receipts",
} as const

/** Seeds are copied so edits in one session never mutate the module-level fixtures. */
const copy = (rows: Row[]) => () => rows.map((row) => structuredClone(row))

defineCollection(FIN_COLLECTIONS.entities, copy(FIN_ENTITY_ROWS))
defineCollection(FIN_COLLECTIONS.periods, buildFinancePeriods)
defineCollection(FIN_COLLECTIONS.currencies, copy(FIN_CURRENCY_ROWS))
defineCollection(FIN_COLLECTIONS.treasuries, copy(FIN_TREASURY_ROWS))
defineCollection(FIN_COLLECTIONS.contacts, copy(FIN_CONTACT_ROWS))
defineCollection(FIN_COLLECTIONS.accounts, copy(FIN_ACCOUNT_ROWS))
defineCollection(FIN_COLLECTIONS.bills, copy(FIN_BILL_ROWS))
defineCollection(FIN_COLLECTIONS.closeTasks, copy(FIN_CLOSE_TASK_ROWS))
defineCollection(FIN_COLLECTIONS.assistantDrafts, copy(ASSISTANT_DRAFT_ROWS))
defineCollection(FIN_COLLECTIONS.assistantHistory, copy(ASSISTANT_HISTORY_ROWS))
defineCollection(FIN_COLLECTIONS.assistantSettings, buildAssistantSettings)
defineCollection(FIN_COLLECTIONS.arDocuments, buildArDocuments)
defineCollection(FIN_COLLECTIONS.receipts, buildReceipts)
