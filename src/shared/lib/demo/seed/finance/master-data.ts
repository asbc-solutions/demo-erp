import type { Row } from "../../demo-db"

/**
 * Finance master data shared by every section. Names and figures follow the
 * Figma design (EG-01, Nile Contracting Co. 110301, the six cash accounts …).
 */

export const FIN_ENTITY_ROWS: Row[] = [
  { id: "EG-01", code: "EG-01", name: "Egyptian Industrial Supplies S.A.E.", base_currency: "EGP" },
  { id: "EG-02", code: "EG-02", name: "Delta Packaging Industries S.A.E.", base_currency: "EGP" },
  { id: "AE-01", code: "AE-01", name: "EIS Trading FZE", base_currency: "AED" },
]

/** Rates to EGP at the last revaluation. */
export const FIN_CURRENCY_ROWS: Row[] = [
  { id: "EGP", code: "EGP", name: "Egyptian pound", rate_to_base: 1, is_base: true },
  { id: "USD", code: "USD", name: "US dollar", rate_to_base: 48.6, is_base: false },
  { id: "EUR", code: "EUR", name: "Euro", rate_to_base: 52.85, is_base: false },
  { id: "SAR", code: "SAR", name: "Saudi riyal", rate_to_base: 12.96, is_base: false },
]

/**
 * The six cash accounts behind "EGP 8,701,390.00 across 6 accounts":
 * banks 8,187,520.00 (EGP eq.) + treasuries 513,870.00.
 */
export const FIN_TREASURY_ROWS: Row[] = [
  { id: "trs-main-cairo", kind: "cash", name: "Main treasury — Cairo", account_code: "110101", currency: "EGP", balance: 486_320, unmatched_lines: 0 },
  { id: "trs-petty-cairo", kind: "cash", name: "Petty cash — Cairo", account_code: "110102", currency: "EGP", balance: 18_450, unmatched_lines: 0 },
  { id: "trs-petty-alex", kind: "cash", name: "Petty cash — Alexandria", account_code: "110103", currency: "EGP", balance: 9_100, unmatched_lines: 0 },
  { id: "bnk-cib-0021", kind: "bank", name: "CIB — current account 0021", account_code: "110201", currency: "EGP", balance: 3_914_880, unmatched_lines: 18 },
  { id: "bnk-bm-usd-4417", kind: "bank", name: "Banque Misr — USD 4417", account_code: "110202", currency: "USD", balance: 62_400, unmatched_lines: 3 },
  { id: "bnk-qnb-payroll", kind: "bank", name: "QNB Alahli — payroll account", account_code: "110203", currency: "EGP", balance: 1_240_000, unmatched_lines: 0 },
]

export const FIN_CONTACT_ROWS: Row[] = [
  { id: "110301", code: "110301", name: "Nile Contracting Co.", kind: "customer", tax_reg_no: "201-330-880", currency: "EGP", terms_days: 45 },
  { id: "110302", code: "110302", name: "Delta Cement Company", kind: "customer", tax_reg_no: "204-118-552", currency: "EGP", terms_days: 30 },
  { id: "110303", code: "110303", name: "Red Sea Resorts Group", kind: "customer", tax_reg_no: "311-902-417", currency: "EGP", terms_days: 60 },
  { id: "110304", code: "110304", name: "Gulf Engineering Trading", kind: "customer", tax_reg_no: null, currency: "USD", terms_days: 30 },
  { id: "110305", code: "110305", name: "Suez Canal Logistics", kind: "customer", tax_reg_no: "287-440-019", currency: "EGP", terms_days: 45 },
  { id: "110306", code: "110306", name: "Alexandria Food Industries", kind: "customer", tax_reg_no: "215-660-873", currency: "EGP", terms_days: 30 },
  { id: "210101", code: "210101", name: "El Sharq Steel Works", kind: "supplier", tax_reg_no: "100-245-331", currency: "EGP", terms_days: 30 },
  { id: "210102", code: "210102", name: "National Packaging", kind: "supplier", tax_reg_no: "100-872-640", currency: "EGP", terms_days: 45 },
  { id: "210103", code: "210103", name: "Siemens Egypt", kind: "supplier", tax_reg_no: "100-033-918", currency: "EGP", terms_days: 60 },
  { id: "210104", code: "210104", name: "Cairo Logistics Services", kind: "supplier", tax_reg_no: "100-519-207", currency: "EGP", terms_days: 30 },
  { id: "210105", code: "210105", name: "El Nasr Accounting Office", kind: "supplier", tax_reg_no: "100-664-085", currency: "EGP", terms_days: 15 },
]

type AccountSeed = [code: string, name: string, type: string, parent: string | null, isGroup: boolean]

/**
 * The top of the chart of accounts. Phase 5 (Ledger) extends it; the codes
 * used here are the ones other sections post to.
 */
const ACCOUNT_SEEDS: AccountSeed[] = [
  ["1", "Assets", "asset", null, true],
  ["11", "Current assets", "asset", "1", true],
  ["110101", "Main treasury — Cairo", "asset", "11", false],
  ["110102", "Petty cash — Cairo", "asset", "11", false],
  ["110103", "Petty cash — Alexandria", "asset", "11", false],
  ["110201", "CIB current account", "asset", "11", false],
  ["110202", "Banque Misr USD account", "asset", "11", false],
  ["110203", "QNB Alahli payroll account", "asset", "11", false],
  ["1103", "Trade receivables", "asset", "11", false],
  ["1104", "Customer advances receivable", "asset", "11", false],
  ["1105", "VAT input", "asset", "11", false],
  ["12", "Fixed assets", "asset", "1", true],
  ["1201", "Machinery and equipment", "asset", "12", false],
  ["1209", "Accumulated depreciation", "asset", "12", false],
  ["2", "Liabilities", "liability", null, true],
  ["21", "Current liabilities", "liability", "2", true],
  ["2101", "Trade payables", "liability", "21", false],
  ["2102", "VAT output", "liability", "21", false],
  ["2103", "Withholding tax payable", "liability", "21", false],
  ["2199", "Suspense account", "liability", "21", false],
  ["3", "Equity", "equity", null, true],
  ["3101", "Share capital", "equity", "3", false],
  ["3201", "Retained earnings", "equity", "3", false],
  ["4", "Income", "income", null, true],
  ["4101", "Sales revenue", "income", "4", false],
  ["4102", "Service revenue", "income", "4", false],
  ["4901", "FX gains", "income", "4", false],
  ["5", "Expenses", "expense", null, true],
  ["5101", "Cost of goods sold", "expense", "5", false],
  ["5201", "Salaries and wages", "expense", "5", false],
  ["5301", "Rent and utilities", "expense", "5", false],
  ["5401", "Depreciation expense", "expense", "5", false],
  ["5901", "FX losses", "expense", "5", false],
]

export const FIN_ACCOUNT_ROWS: Row[] = ACCOUNT_SEEDS.map(([code, name, type, parent, isGroup]) => ({
  id: code,
  code,
  name,
  type,
  parent_code: parent,
  is_group: isGroup,
  currency: null,
}))
