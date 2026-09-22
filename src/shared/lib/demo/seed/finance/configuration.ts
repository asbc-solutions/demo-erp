import type { Row } from "../../demo-db"

/**
 * Configuration — the posting map, setup-wizard industries, approval
 * policies and roles. Posting rules route to accounts in the chart; the
 * stamp-tax rule is left unrouted on the debit side, as in the design.
 */

/** [id, event, module, debit, credit, tax code, documents a month, value last full month, what happens]. */
type RuleSeed = [string, string, string, string | null, string, string | null, number, number, string]

const RULES: RuleSeed[] = [
  ["sale.local", "Sales invoice — local", "AR", "110301", "410101", "VAT14", 184, 2_460_000, "An invoice is issued to a local customer"],
  ["sale.service", "Service invoice", "AR", "110301", "410103", "VAT14", 41, 286_000, "A service invoice is issued"],
  ["sale.export", "Sales invoice — export", "AR", "110301", "410102", "VAT0", 22, 826_000, "An invoice is issued to a customer abroad"],
  ["sale.credit", "Sales credit note", "AR", "430101", "110301", "VAT14", 9, 64_000, "Goods come back or a price is reduced"],
  ["receipt.customer", "Customer receipt", "AR", "110201", "110301", null, 156, 3_120_000, "A customer pays into the bank"],
  ["receipt.advance", "Customer advance", "AR", "110201", "210103", null, 11, 124_000, "A customer pays before being invoiced"],
  ["cheque.deposit", "Cheque deposited", "AR", "110302", "110301", null, 28, 412_000, "A customer cheque is deposited for collection"],
  ["cheque.collect", "Cheque collected", "AR", "110201", "110302", null, 26, 398_000, "The bank collects a deposited cheque"],
  ["ar.write_off", "Bad debt write-off", "AR", "650103", "110301", null, 1, 9_600, "An uncollectable balance is written off"],
  ["purchase.goods", "Supplier bill — goods", "AP", "510101", "210101", "VAT14", 96, 1_820_000, "A supplier bills for goods"],
  ["purchase.services", "Supplier bill — services", "AP", "640101", "210101", "VAT14", 34, 246_000, "A supplier bills for services"],
  ["payment.supplier", "Supplier payment", "AP", "210101", "110201", null, 88, 1_960_000, "A supplier is paid from the bank"],
  ["payment.advance", "Advance to supplier", "AP", "120302", "110201", null, 6, 96_000, "A supplier is paid before billing"],
  ["payment.wht", "Withholding on payment", "AP", "210101", "210202", "WHT3", 31, 42_800, "Tax is withheld from a supplier payment"],
  ["purchase.debit_note", "Supplier debit note", "AP", "210101", "510101", null, 4, 18_400, "Goods are returned to a supplier"],
  ["cash.petty", "Petty cash expense", "CASH", "640104", "110102", null, 62, 21_500, "A small expense is paid from petty cash"],
  ["bank.charges", "Bank charges", "CASH", "630101", "110201", null, 18, 12_000, "The bank takes a fee"],
  ["treasury.transfer", "Treasury transfer", "TREASURY", "110101", "110201", null, 14, 380_000, "Cash moves between treasuries"],
  ["custody.issue", "Custody issued", "CASH", "120305", "110101", null, 8, 64_000, "An employee is given cash custody"],
  ["custody.settle", "Custody settled", "CASH", "640201", "120305", null, 7, 51_000, "An employee settles custody with receipts"],
  ["fx.gain", "FX revaluation — gain", "TREASURY", "110202", "420103", null, 1, 14_000, "A foreign balance is revalued upward"],
  ["fx.loss", "FX revaluation — loss", "TREASURY", "630103", "110202", null, 1, 6_400, "A foreign balance is revalued downward"],
  ["payroll.gross", "Payroll — gross pay", "PAYROLL", "610101", "210301", null, 1, 510_000, "Monthly salaries are accrued"],
  ["payroll.social", "Payroll — social insurance", "PAYROLL", "610101", "210401", null, 1, 64_000, "The employer's social insurance is accrued"],
  ["payroll.payment", "Payroll — payment", "PAYROLL", "210301", "110203", null, 1, 486_000, "Salaries are paid from the payroll account"],
  ["asset.acquire", "Asset acquisition", "ASSETS", "120101", "210101", "VAT14", 3, 180_000, "A fixed asset is bought on credit"],
  ["asset.depreciation", "Depreciation charge", "ASSETS", "650101", "120201", null, 1, 96_600, "The monthly depreciation run posts"],
  ["asset.disposal", "Asset disposal — proceeds", "ASSETS", "110201", "420104", null, 1, 40_000, "A fixed asset is sold"],
  ["inventory.receipt", "Goods receipt", "INVENTORY", "110401", "210101", null, 74, 1_240_000, "Goods arrive against a purchase order"],
  ["inventory.cogs", "Cost of goods sold", "INVENTORY", "510101", "110402", null, 184, 1_507_000, "Goods leave the warehouse on a sale"],
  ["inventory.adjust", "Inventory adjustment", "INVENTORY", "510101", "110401", null, 2, 8_800, "A stock count differs from the books"],
  ["tax.vat_settle", "VAT settlement", "TAX", "210204", "110201", null, 1, 587_850, "The monthly VAT return is paid"],
  ["tax.wht_remit", "Withholding remittance", "TAX", "210202", "110201", null, 1, 42_800, "Tax withheld is paid to the authority"],
  ["tax.stamp", "Stamp tax on contracts", "TAX", null, "210205", "STAMP", 5, 14_200, "Stamp tax is due on a signed contract"],
]

export const FIN_POSTING_RULE_ROWS: Row[] = RULES.map(([id, event, module, debit, credit, tax, perMonth, monthly, description]) => ({
  id,
  code: id,
  event,
  module,
  description,
  current: { debit_account: debit, credit_account: credit, tax_code: tax },
  staged: null,
  per_month: perMonth,
  monthly_value: monthly,
  changed_on: "2026-01-12",
  changed_by: "Layla Adham",
}))

/** Setup wizard: what each kind of business gets by default, and why. */
export const FIN_SETUP_INDUSTRIES = [
  {
    id: "contracting",
    name: "Contracting and construction",
    analysed_by: "Project",
    tax_codes: ["VAT14", "WHT3"],
    decisions: [
      { setting: "Revenue is recognised", value: "As work is completed", because: "Contract revenue is earned as work is completed, not when the invoice is raised.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Project", because: "Contractors need cost and margin per project before they need it per department.", href: "/finance/dimensions" },
      { setting: "Retention held by clients", value: "Switched on", because: "Clients hold back a percentage until handover, and it has to be tracked separately from what is overdue.", href: "/finance/settings/posting-map" },
      { setting: "Tax withheld at source", value: "Applied", because: "Contract payments in Egypt are subject to tax withheld at source.", href: "/finance/tax/withholding" },
    ],
  },
  {
    id: "retail",
    name: "Retail and wholesale",
    analysed_by: "Branch",
    tax_codes: ["VAT14", "TBL5"],
    decisions: [
      { setting: "Revenue is recognised", value: "At the point of sale", because: "A retail sale is complete when the customer pays and takes the goods.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Branch", because: "Retailers compare margin branch by branch before anything else.", href: "/finance/dimensions" },
      { setting: "Inventory costing", value: "Weighted average", because: "Stock is bought repeatedly at changing prices, and an average keeps margins steady.", href: "/finance/settings/posting-map" },
      { setting: "Electronic receipts", value: "Switched on", because: "Point-of-sale receipts in Egypt are reported to the tax authority as they are issued.", href: "/finance/tax/e-invoicing" },
    ],
  },
  {
    id: "services",
    name: "Professional services",
    analysed_by: "Client",
    tax_codes: ["VAT14", "WHT5"],
    decisions: [
      { setting: "Revenue is recognised", value: "As time is billed", because: "Fees are earned as the work is delivered and billed to the client.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Client", because: "A firm needs to know which clients are profitable, not only which teams.", href: "/finance/dimensions" },
      { setting: "Work in progress", value: "Tracked", because: "Hours worked but not yet billed are an asset until they are invoiced.", href: "/finance/settings/posting-map" },
      { setting: "Tax withheld at source", value: "Applied", because: "Clients withhold tax on professional fees paid in Egypt.", href: "/finance/tax/withholding" },
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    analysed_by: "Product line",
    tax_codes: ["VAT14", "TBL5"],
    decisions: [
      { setting: "Revenue is recognised", value: "On delivery", because: "Control of manufactured goods passes to the customer on delivery.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Product line", because: "Manufacturers price and plan by product line, so costs follow it.", href: "/finance/dimensions" },
      { setting: "Inventory costing", value: "Standard cost", because: "Standard costs make production variances visible each month.", href: "/finance/settings/posting-map" },
      { setting: "Table tax", value: "Applied", because: "Some manufactured goods carry table tax on top of VAT.", href: "/finance/tax/codes" },
    ],
  },
  {
    id: "distribution",
    name: "Import and distribution",
    analysed_by: "Shipment",
    tax_codes: ["VAT14", "WHT1"],
    decisions: [
      { setting: "Revenue is recognised", value: "On delivery", because: "Distributed goods are sold when the customer receives them.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Shipment", because: "Freight, duty and clearing belong to the shipment that caused them.", href: "/finance/dimensions" },
      { setting: "Landed cost", value: "Switched on", because: "Import costs are added to the value of the goods, not expensed on arrival.", href: "/finance/settings/posting-map" },
      { setting: "Foreign balances", value: "Revalued monthly", because: "Supplier balances in dollars move with the exchange rate.", href: "/finance/fx-revaluation" },
    ],
  },
  {
    id: "nonprofit",
    name: "Non-profit",
    analysed_by: "Fund",
    tax_codes: ["VATEX"],
    decisions: [
      { setting: "Income is recognised", value: "When grant conditions are met", because: "Grants are earned as their conditions are satisfied, not when cash arrives.", href: "/finance/settings/posting-map" },
      { setting: "Costs analysed by", value: "Fund", because: "Donors need to see that their money was spent as agreed.", href: "/finance/dimensions" },
      { setting: "Restricted funds", value: "Tracked separately", because: "Restricted money cannot be spent on general running costs.", href: "/finance/settings/posting-map" },
      { setting: "VAT", value: "Exempt", because: "Most non-profit activity in Egypt is exempt from VAT.", href: "/finance/tax/codes" },
    ],
  },
]

/** Values created for the analysis dimension a setup choice switches on. */
export const SETUP_DIMENSION_VALUES: Record<string, string[]> = {
  Client: ["Nile Contracting Co.", "Delta Food Industries", "Ahram Supplies", "Gulf Technical Est."],
  Shipment: ["SHP-2026-014", "SHP-2026-015", "SHP-2026-016"],
  Fund: ["General fund", "Restricted grants", "Endowment"],
}

export const APPROVER_LADDERS: Record<string, string[]> = {
  journal: ["Accountant", "Controller", "CFO"],
  bill: ["AP", "Finance manager", "CFO"],
  payment_run: ["Treasury", "Controller", "CFO"],
  expense: ["Line manager", "Finance manager", "CFO"],
  period_close: ["Controller sign-off", "CFO", "Board"],
}

export const POLICY_TYPES = [
  { value: "journal", label: "Journal entry" },
  { value: "bill", label: "Bill" },
  { value: "payment_run", label: "Payment run" },
  { value: "expense", label: "Expense claim" },
  { value: "period_close", label: "Period close" },
]

export const FIN_APPROVAL_POLICY_ROWS: Row[] = [
  { id: "APP-1", name: "Journal entries over EGP 500k", type: "journal", threshold: 500_000, approvers: ["Accountant", "Controller"], active: true },
  { id: "APP-2", name: "Supplier bills over EGP 250k", type: "bill", threshold: 250_000, approvers: ["AP", "Finance manager"], active: true },
  { id: "APP-3", name: "Payment runs", type: "payment_run", threshold: null, approvers: ["Treasury", "Controller", "CFO"], active: true },
  { id: "APP-4", name: "Period close", type: "period_close", threshold: null, approvers: ["Controller sign-off"], active: true },
]

export const PERMISSIONS = ["view", "post", "approve", "reverse", "close", "settings"] as const

const role = (id: string, name: string, members: number, granted: string[], scope = "Entity") => ({
  id,
  name,
  scope,
  members,
  permissions: Object.fromEntries(PERMISSIONS.map((permission) => [permission, granted.includes(permission)])),
})

export const FIN_ROLE_ROWS: Row[] = [
  role("R-1", "Financial Controller", 1, ["view", "post", "approve", "reverse", "close", "settings"]),
  role("R-2", "Senior Accountant", 1, ["view", "post", "approve", "reverse"]),
  role("R-3", "AP Accountant", 1, ["view", "post"]),
  role("R-4", "AR Accountant", 1, ["view", "post"]),
  role("R-5", "Treasury Officer", 1, ["view", "post"], "Treasury"),
  role("R-6", "Auditor", 1, ["view"]),
]

/** The personas the roles page can preview, and the matrix row each one acts as. */
export const DEMO_PERSONAS = [
  { id: "administrator", name: "Administrator", role_id: "R-1" },
  { id: "accountant", name: "Accountant", role_id: "R-2" },
  { id: "cost_center_manager", name: "Cost centre manager", role_id: "R-6" },
]
