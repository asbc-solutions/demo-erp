import type { Row } from "../../demo-db"

/**
 * Finance master data shared by every section. Names and figures follow the
 * Figma design (EG-01, the five customers, the six cash accounts …).
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
 * banks 8,187,520.00 (EGP eq.) + treasuries 513,870.00. Unmatched statement
 * lines are counted live from the reconciliation data, not stored here.
 */
export const FIN_TREASURY_ROWS: Row[] = [
  { id: "trs-main-cairo", code: "T-01", kind: "cash", name: "Main treasury — Cairo", short_name: "Main treasury", bank: null, account_code: "110101", account_last4: null, currency: "EGP", balance: 486_320, last_reconciled: "2026-03-30" },
  { id: "trs-petty-cairo", code: "T-02", kind: "cash", name: "Petty cash — Cairo", short_name: "Petty cash", bank: null, account_code: "110102", account_last4: null, currency: "EGP", balance: 18_450, last_reconciled: "2026-03-28" },
  { id: "trs-petty-alex", code: "T-03", kind: "cash", name: "Petty cash — Alexandria", short_name: "Petty cash", bank: null, account_code: "110103", account_last4: null, currency: "EGP", balance: 9_100, last_reconciled: "2026-03-25" },
  { id: "bnk-cib-0021", code: "T-04", kind: "bank", name: "CIB — current account 0021", short_name: "CIB", bank: "CIB", account_code: "110201", account_last4: "0021", currency: "EGP", balance: 3_914_880, last_reconciled: "2026-03-01" },
  { id: "bnk-bm-usd-4417", code: "T-05", kind: "bank", name: "Banque Misr — USD 4417", short_name: "Banque Misr", bank: "Banque Misr", account_code: "110202", account_last4: "4417", currency: "USD", balance: 62_400, last_reconciled: "2026-03-15" },
  { id: "bnk-qnb-payroll", code: "T-06", kind: "bank", name: "QNB Alahli — payroll account", short_name: "QNB Alahli", bank: "QNB Alahli", account_code: "110203", account_last4: "7781", currency: "EGP", balance: 1_240_000, last_reconciled: "2026-03-20" },
]

/** Control accounts the subledgers post to; advances sit outside the AR/AP balance. */
export const AR_CONTROL_ACCOUNT = "110301"
export const CUSTOMER_ADVANCES_ACCOUNT = "210103"
export const AP_CONTROL_ACCOUNT = "210101"
export const SUPPLIER_ADVANCES_ACCOUNT = "120302"
export const INPUT_VAT_ACCOUNT = "110601"
export const EMPLOYEE_CUSTODY_ACCOUNT = "120305"

export const FIN_CONTACT_ROWS: Row[] = [
  { id: "C-0101", code: "C-0101", name: "Nile Contracting Co.", kind: "customer", tax_reg_no: "201-330-880", currency: "EGP", terms_days: 45, credit_limit: 2_000_000 },
  { id: "C-0102", code: "C-0102", name: "Delta Industrial Group", kind: "customer", tax_reg_no: "204-118-552", currency: "EGP", terms_days: 30, credit_limit: 1_500_000 },
  { id: "C-0103", code: "C-0103", name: "Ahram Supplies", kind: "customer", tax_reg_no: "208-441-201", currency: "EGP", terms_days: 30, credit_limit: 800_000 },
  { id: "C-0104", code: "C-0104", name: "Gulf Technical Est.", kind: "customer", tax_reg_no: "300-551-702-00003", currency: "SAR", terms_days: 60, credit_limit: 1_500_000 },
  { id: "C-0105", code: "C-0105", name: "Mediterranean Trading LLC", kind: "customer", tax_reg_no: "US-4471", currency: "USD", terms_days: 45, credit_limit: 6_000_000 },
  { id: "S-0201", code: "S-0201", name: "El Sharq Steel Works", kind: "supplier", tax_reg_no: "305-220-114", currency: "EGP", terms_days: 30 },
  { id: "S-0202", code: "S-0202", name: "National Packaging", kind: "supplier", tax_reg_no: "100-872-640", currency: "EGP", terms_days: 45 },
  { id: "S-0203", code: "S-0203", name: "Siemens Egypt", kind: "supplier", tax_reg_no: "100-033-918", currency: "EGP", terms_days: 60 },
  { id: "S-0204", code: "S-0204", name: "Cairo Logistics Services", kind: "supplier", tax_reg_no: null, currency: "EGP", terms_days: 30 },
  { id: "S-0205", code: "S-0205", name: "El Nasr Accounting Office", kind: "supplier", tax_reg_no: null, currency: "EGP", terms_days: 15 },
]

type AccountSeed = [code: string, name: string, type: string, parent: string | null, isGroup: boolean]

/**
 * The chart of accounts, following the design's hierarchy: class (1 digit),
 * group (2), sub-group (4) and postable accounts (6, plus the 4-digit
 * suspense account). Codes other sections post to are kept stable.
 */
const ACCOUNT_SEEDS: AccountSeed[] = [
  ["1", "Assets", "asset", null, true],
  ["11", "Current assets", "asset", "1", true],
  ["1101", "Cash and cash equivalents", "asset", "11", true],
  ["110101", "Main treasury — Cairo", "asset", "1101", false],
  ["110102", "Petty cash — Cairo", "asset", "1101", false],
  ["110103", "Petty cash — Alexandria", "asset", "1101", false],
  ["1102", "Banks", "asset", "11", true],
  ["110201", "CIB — current account 0021", "asset", "1102", false],
  ["110202", "Banque Misr — USD 4417", "asset", "1102", false],
  ["110203", "QNB Alahli — payroll account", "asset", "1102", false],
  ["1103", "Accounts receivable", "asset", "11", true],
  ["110301", "Trade receivables — customers", "asset", "1103", false],
  ["110302", "Cheques under collection", "asset", "1103", false],
  ["1104", "Inventory", "asset", "11", true],
  ["110401", "Raw materials", "asset", "1104", false],
  ["110402", "Finished goods", "asset", "1104", false],
  ["1105", "Prepayments and accrued income", "asset", "11", true],
  ["110501", "Prepaid rent", "asset", "1105", false],
  ["110502", "Prepaid insurance", "asset", "1105", false],
  ["110503", "Accrued interest receivable", "asset", "1105", false],
  ["1106", "Recoverable taxes", "asset", "11", true],
  ["110601", "Input VAT", "asset", "1106", false],
  ["12", "Non-current assets", "asset", "1", true],
  ["1201", "Property, plant and equipment", "asset", "12", true],
  ["120101", "Machinery and equipment", "asset", "1201", false],
  ["120102", "Furniture and fixtures", "asset", "1201", false],
  ["120103", "Vehicles", "asset", "1201", false],
  ["120104", "Computers and IT equipment", "asset", "1201", false],
  ["1202", "Accumulated depreciation", "asset", "12", true],
  ["120201", "Accum. dep. — machinery", "asset", "1202", false],
  ["120202", "Accum. dep. — vehicles", "asset", "1202", false],
  ["120203", "Accum. dep. — furniture", "asset", "1202", false],
  ["120204", "Accum. dep. — IT equipment", "asset", "1202", false],
  ["1203", "Advances and other receivables", "asset", "12", true],
  ["120302", "Supplier advances", "asset", "1203", false],
  ["120305", "Employee custody", "asset", "1203", false],
  ["120306", "Intercompany receivable", "asset", "1203", false],
  ["2", "Liabilities", "liability", null, true],
  ["21", "Current liabilities", "liability", "2", true],
  ["2101", "Accounts payable", "liability", "21", true],
  ["210101", "Trade payables — suppliers", "liability", "2101", false],
  ["210103", "Customer advances", "liability", "2101", false],
  ["210105", "Intercompany payable", "liability", "2101", false],
  ["2102", "Tax liabilities", "liability", "21", true],
  ["210201", "VAT output", "liability", "2102", false],
  ["210202", "Withholding tax payable", "liability", "2102", false],
  ["210203", "Income tax payable", "liability", "2102", false],
  ["210204", "VAT payable to ETA", "liability", "2102", false],
  ["210205", "Stamp tax payable", "liability", "2102", false],
  ["2103", "Accrued expenses", "liability", "21", true],
  ["210301", "Accrued salaries", "liability", "2103", false],
  ["210302", "Accrued services", "liability", "2103", false],
  ["2104", "Payroll liabilities", "liability", "21", true],
  ["210401", "Social insurance payable", "liability", "2104", false],
  ["210402", "Payroll tax withheld", "liability", "2104", false],
  ["2199", "Suspense account", "liability", "21", false],
  ["22", "Non-current liabilities", "liability", "2", true],
  ["2201", "Long-term loans", "liability", "22", true],
  ["220101", "Term loan — NBE", "liability", "2201", false],
  ["2202", "Lease liabilities", "liability", "22", true],
  ["220201", "Warehouse lease", "liability", "2202", false],
  ["3", "Equity", "equity", null, true],
  ["31", "Capital", "equity", "3", true],
  ["310101", "Issued capital", "equity", "31", false],
  ["310102", "Legal reserve", "equity", "31", false],
  ["32", "Retained earnings", "equity", "3", true],
  ["320101", "Retained earnings — prior years", "equity", "32", false],
  ["320102", "Current year result", "equity", "32", false],
  ["4", "Revenue", "revenue", null, true],
  ["41", "Operating revenue", "revenue", "4", true],
  ["410101", "Product sales — local", "revenue", "41", false],
  ["410102", "Product sales — export", "revenue", "41", false],
  ["410103", "Service revenue", "revenue", "41", false],
  ["410104", "Installation and commissioning", "revenue", "41", false],
  ["42", "Other income", "revenue", "4", true],
  ["420101", "Interest income", "revenue", "42", false],
  ["420102", "FX gains — realised", "revenue", "42", false],
  ["420103", "FX gains — unrealised", "revenue", "42", false],
  ["420104", "Gain on disposal of assets", "revenue", "42", false],
  ["43", "Revenue deductions", "revenue", "4", true],
  ["430101", "Sales discounts", "revenue", "43", false],
  ["5", "Cost of sales", "expense", null, true],
  ["51", "Cost of goods sold", "expense", "5", true],
  ["510101", "Cost of goods sold", "expense", "51", false],
  ["6", "Operating expenses", "expense", null, true],
  ["61", "Staff costs", "expense", "6", true],
  ["610101", "Salaries and wages", "expense", "61", false],
  ["62", "Premises", "expense", "6", true],
  ["620101", "Rent", "expense", "62", false],
  ["620102", "Utilities", "expense", "62", false],
  ["620110", "Sundry office expenses", "expense", "62", false],
  ["63", "Finance costs", "expense", "6", true],
  ["630101", "Bank charges", "expense", "63", false],
  ["630102", "FX losses — realised", "expense", "63", false],
  ["630103", "FX losses — unrealised", "expense", "63", false],
  ["64", "General and administrative", "expense", "6", true],
  ["640101", "Professional fees", "expense", "64", false],
  ["640104", "Office supplies", "expense", "64", false],
  ["640106", "Software subscriptions", "expense", "64", false],
  ["640201", "Travel and transport", "expense", "64", false],
  ["640301", "Meals and entertainment", "expense", "64", false],
  ["640401", "Telephone and internet", "expense", "64", false],
  ["640501", "Repairs and maintenance", "expense", "64", false],
  ["65", "Depreciation", "expense", "6", true],
  ["650101", "Depreciation expense", "expense", "65", false],
  ["650102", "Loss on disposal and write-off", "expense", "65", false],
  ["650103", "Bad debt expense", "expense", "65", false],
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
