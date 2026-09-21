import { defineCollection } from "../../demo-db"
import { buildFinancePeriods } from "../../seed/finance/calendar"
import {
  FIN_ACCOUNT_ROWS,
  FIN_CONTACT_ROWS,
  FIN_CURRENCY_ROWS,
  FIN_ENTITY_ROWS,
  FIN_TREASURY_ROWS,
} from "../../seed/finance/master-data"

/** Collection names for finance master data; section files add their own. */
export const FIN_COLLECTIONS = {
  entities: "finance/entities",
  periods: "finance/periods",
  currencies: "finance/currencies",
  treasuries: "finance/treasuries",
  contacts: "finance/contacts",
  accounts: "finance/accounts",
} as const

defineCollection(FIN_COLLECTIONS.entities, () => FIN_ENTITY_ROWS.map((row) => ({ ...row })))
defineCollection(FIN_COLLECTIONS.periods, buildFinancePeriods)
defineCollection(FIN_COLLECTIONS.currencies, () => FIN_CURRENCY_ROWS.map((row) => ({ ...row })))
defineCollection(FIN_COLLECTIONS.treasuries, () => FIN_TREASURY_ROWS.map((row) => ({ ...row })))
defineCollection(FIN_COLLECTIONS.contacts, () => FIN_CONTACT_ROWS.map((row) => ({ ...row })))
defineCollection(FIN_COLLECTIONS.accounts, () => FIN_ACCOUNT_ROWS.map((row) => ({ ...row })))
